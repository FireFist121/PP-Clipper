const axios = require('axios');

async function testLiveUrl() {
  const channelId = 'UCSJ4gkVC6NrvII8umztf0Ow'; // Lofi Girl (almost always live)
  try {
    const url = `https://www.youtube.com/channel/${channelId}/live`;
    console.log('Fetching', url);
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    // Look for link rel="canonical"
    const match = res.data.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([^"]+)">/);
    if (match) {
      console.log('Found video ID:', match[1]);
    } else {
      console.log('Canonical not found in HTML.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testLiveUrl();
