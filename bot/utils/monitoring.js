const axios = require('axios');
const logger = require('./logger');

const MONITORING_API_URL = 'https://monitoring.googleapis.com/v3';

class MonitoringClient {
  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY;
    this.projectId = 'strategic-lens-465804-d9';
    this._cache = {
      data: null,
      timestamp: 0
    };
    this._cacheTTL = 90 * 1000; // 90 seconds cache
    this._lastUsedValue = 0; // Anti-fluctuation stability
  }

  async getQuotaUsage() {
    if (!this.apiKey) {
      return { used: 0, limit: 10000, remaining: 10000, percent: 0 };
    }

    // 1. Check Cache
    const now = Date.now();
    if (this._cache.data && (now - this._cache.timestamp < this._cacheTTL)) {
      return this._cache.data;
    }

    try {
      // 2. Define Time Range (Start of UTC day to now)
      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);
      const startTime = startOfDay.toISOString();
      const endTime = new Date().toISOString();

      // 3. Execute Monitoring API Call with specific Instructions
      // Metric: quota/allocation/usage
      // Aggregation: ALIGN_DELTA with 3600s
      const response = await axios.get(`${MONITORING_API_URL}/projects/${this.projectId}/timeSeries`, {
        params: {
          filter: 'metric.type="serviceruntime.googleapis.com/quota/allocation/usage" AND resource.labels.service="youtube.googleapis.com" AND metric.labels.quota_metric="youtube.googleapis.com/default"',
          'interval.startTime': startTime,
          'interval.endTime': endTime,
          'aggregation.alignmentPeriod': '3600s',
          'aggregation.perSeriesAligner': 'ALIGN_DELTA',
          'aggregation.crossSeriesReducer': 'REDUCE_SUM',
          key: this.apiKey
        }
      });

      let currentUsed = 0;

      // 4. Process Aggregated Points
      if (response.data.timeSeries && response.data.timeSeries.length > 0) {
        response.data.timeSeries.forEach(series => {
          series.points.forEach(point => {
            const val = point.value.int64Value ? parseInt(point.value.int64Value) : (point.value.doubleValue || 0);
            currentUsed += val;
          });
        });
      }

      // 5. Fallback: If 0, fetch raw data points for manual sum
      if (currentUsed === 0) {
        const rawRes = await axios.get(`${MONITORING_API_URL}/projects/${this.projectId}/timeSeries`, {
          params: {
            filter: 'metric.type="serviceruntime.googleapis.com/quota/allocation/usage" AND resource.labels.service="youtube.googleapis.com" AND metric.labels.quota_metric="youtube.googleapis.com/default"',
            'interval.startTime': startTime,
            'interval.endTime': endTime,
            key: this.apiKey
          }
        });
        if (rawRes.data.timeSeries) {
          rawRes.data.timeSeries.forEach(series => {
            series.points.forEach(p => {
              currentUsed += p.value.int64Value ? parseInt(p.value.int64Value) : (p.value.doubleValue || 0);
            });
          });
        }
      }

      // 6. Stability Fix: Anti-Fluctuation (Never decrease suddenly)
      // Only reset if it's a new day (startOfDay changed since last fetch)
      if (this._lastFetchDay && this._lastFetchDay !== startOfDay.toDateString()) {
        this._lastUsedValue = 0; // New day reset
      }
      this._lastFetchDay = startOfDay.toDateString();
      
      const finalUsed = Math.max(this._lastUsedValue, currentUsed);
      this._lastUsedValue = finalUsed;

      // 7. Prepare Response
      const limit = 10000;
      const result = {
        used: finalUsed,
        limit: limit,
        remaining: Math.max(0, limit - finalUsed),
        percent: parseFloat(((finalUsed / limit) * 100).toFixed(2))
      };

      // 8. Update Cache
      this._cache = {
        data: result,
        timestamp: now
      };

      logger.info(`Quota Updated: ${finalUsed}/${limit} (${result.percent}%)`);
      return result;
    } catch (error) {
      logger.error('Quota Monitoring API Failed:', error.response?.data || error.message);
      // Return cached data if available on failure, or safe fallback
      return this._cache.data || { used: this._lastUsedValue, limit: 10000, remaining: 10000 - this._lastUsedValue, percent: 0, error: true };
    }
  }
}

module.exports = new MonitoringClient();
