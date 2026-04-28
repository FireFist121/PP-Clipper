/**
 * AntyGravity — YouTube API Client
 * YouTube Data API v3 (Metadata only, no downloading)
 */

const axios = require('axios');
const logger = require('./logger');

const YT_API_URL = 'https://www.googleapis.com/youtube/v3';

class YouTubeClient {
  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY;
    this._cache = new Map();
    this._pendingStreams = new Map(); // Prevent concurrent identical API calls
    this._cacheTTL = 5 * 60 * 1000;
  }

  async _request(endpoint, params = {}, useCache = true) {
    if (!this.apiKey) {
      throw new Error('YOUTUBE_API_KEY is not set in your .env file.');
    }

    const cacheKey = `${endpoint}?${JSON.stringify(params)}`;
    if (useCache && this._cache.has(cacheKey)) {
      const cached = this._cache.get(cacheKey);
      if (Date.now() < cached.expiresAt) return cached.data;
      this._cache.delete(cacheKey);
    }

    try {
      const response = await axios.get(`${YT_API_URL}${endpoint}`, {
        params: { ...params, key: this.apiKey },
      });
      if (useCache) {
        this._cache.set(cacheKey, { data: response.data, expiresAt: Date.now() + this._cacheTTL });
      }
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.error?.message || error.message;
      throw new Error(`YouTube API error: ${msg}`);
    }
  }

  /**
   * Finds the currently active live stream for a given channel ID
   * Uses a short-term cache to avoid high-cost search calls (100 quota units)
   * @param {string} channelId 
   */
  async getActiveLiveStream(channelId) {
    const liveCacheKey = `live_stream_${channelId}`;
    
    if (this._cache.has(liveCacheKey)) {
      const cached = this._cache.get(liveCacheKey);
      if (Date.now() < cached.expiresAt) {
        logger.info(`Using cached live stream ID for ${channelId}: ${cached.data.id}`);
        return cached.data;
      }
    }

    if (this._pendingStreams.has(liveCacheKey)) {
      logger.info(`Waiting for pending live stream fetch for ${channelId}...`);
      return this._pendingStreams.get(liveCacheKey);
    }

    const fetchPromise = (async () => {
      try {
        let videoId = null;

        try {
          // 1. Try FAST /live redirect (Cost: 0 Units)
          logger.info(`Fetching live stream ID via /live redirect for: ${channelId}`);
          const liveUrl = `https://www.youtube.com/channel/${channelId}/live`;
          const res = await axios.get(liveUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            timeout: 5000
          });
          const match = res.data.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([^"]+)">/);
          if (match) videoId = match[1];
        } catch (scrapeErr) {
          logger.warn(`Scrape failed for ${channelId}: ${scrapeErr.message}`);
        }

        // 2. Fallback to API SEARCH (Cost: 100 Units)
        if (!videoId) {
           logger.info(`Falling back to API search for live stream: ${channelId}`);
           const searchData = await this._request('/search', {
             part: 'snippet',
             channelId: channelId,
             eventType: 'live',
             type: 'video',
             order: 'date'
           }, false);
           if (searchData.items?.length > 0) videoId = searchData.items[0].id.videoId;
        }

        if (!videoId) throw new Error(`No active live stream found for channel ${channelId}.`);

        // 3. Get live streaming details (Cost: 1 Unit)
        const videoData = await this._request('/videos', {
          part: 'snippet,liveStreamingDetails',
          id: videoId,
        }, false);

        if (!videoData.items?.length) throw new Error(`Could not fetch details for live stream ${videoId}.`);

        const videoInfo = videoData.items[0];
        const streamInfo = {
          id: videoId,
          title: videoInfo.snippet.title,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          actualStartTime: videoInfo.liveStreamingDetails?.actualStartTime 
        };

        this._cache.set(liveCacheKey, { data: streamInfo, expiresAt: Date.now() + (5 * 60 * 1000) });
        return streamInfo;
      } finally {
        this._pendingStreams.delete(liveCacheKey);
      }
    })();

    this._pendingStreams.set(liveCacheKey, fetchPromise);
    return fetchPromise;
  }

  async getVideoById(videoId) {
    const data = await this._request('/videos', {
      part: 'snippet,contentDetails,statistics',
      id: videoId,
    });
    if (!data.items?.length) {
      throw new Error(`Video "${videoId}" not found.`);
    }
    return this._normalizeVideoFull(data.items[0]);
  }

  async getVideoByUrl(url) {
    const videoId = this._extractVideoId(url);
    if (!videoId) throw new Error('Invalid YouTube URL.');
    return this.getVideoById(videoId);
  }

  isYouTubeUrl(text) {
    return /youtu\.be\/|youtube\.com\/(watch|shorts|clip)/.test(text);
  }

  _extractVideoId(url) {
    const shortMatch = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
    if (shortMatch) return shortMatch[1];
    const watchMatch = url.match(/[?&]v=([A-Za-z0-9_-]{11})/);
    if (watchMatch) return watchMatch[1];
    const shortsMatch = url.match(/\/shorts\/([A-Za-z0-9_-]{11})/);
    if (shortsMatch) return shortsMatch[1];
    return null;
  }

  _normalizeVideo(item) {
    const s = item.snippet;
    const videoId = item.id?.videoId || item.id;
    return {
      id: videoId,
      title: s.title,
      description: s.description,
      channelId: s.channelId,
      channelTitle: s.channelTitle,
      thumbnail: s.thumbnails?.high?.url || s.thumbnails?.default?.url,
      publishedAt: s.publishedAt,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    };
  }

  _normalizeVideoFull(item) {
    const base = this._normalizeVideo(item);
    const stats = item.statistics || {};
    return {
      ...base,
      viewCount: parseInt(stats.viewCount || '0', 10),
      likeCount: parseInt(stats.likeCount || '0', 10),
      duration: item.contentDetails?.duration,
    };
  }

  async getChannelInfo(channelId) {
    const data = await this._request('/channels', {
      part: 'snippet',
      id: channelId,
    });
    if (!data.items?.length) throw new Error('Channel not found.');
    return {
      id: channelId,
      title: data.items[0].snippet.title,
      url: `https://youtube.com/channel/${channelId}`,
      thumbnail: data.items[0].snippet.thumbnails?.default?.url
    };
  }

  async getChannelInfoByHandle(handle) {
    // Handle can be like "@username"
    const searchData = await this._request('/search', {
      part: 'snippet',
      q: handle,
      type: 'channel',
      maxResults: 1
    });
    if (!searchData.items?.length) throw new Error('Channel not found by handle.');
    return this.getChannelInfo(searchData.items[0].id.channelId);
  }
}

module.exports = new YouTubeClient();
