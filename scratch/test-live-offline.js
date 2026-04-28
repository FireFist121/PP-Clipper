const axios = require('axios');

async function testOfflineChannel() {
  const channelId = 'UC_x5XG1OV2P6uZZ5FSM9Ttw'; // Google Developers (usually not live)
  try {
    const url = `https://www.youtube.com/channel/${channelId}/live`;
    console.log('Fetching', url);
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const match = res.data.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([^"]+)">/);
    if (match) {
      console.log('Found video ID:', match[1]);
      
      // Also look if the page contains text indicating it is live, e.g. "isLiveNow":true
      const isLive = res.data.includes('"isLiveNow":true') || res.data.includes('style="LIVE"');
      console.log('Is it actually live?', isLive);
    } else {
      console.log('Canonical watch link not found. Page title:', res.data.match(/<title>(.*?)<\/title>/)?.[1]);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testOfflineChannel();
