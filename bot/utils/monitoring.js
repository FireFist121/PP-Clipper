const axios = require('axios');
const { JWT } = require('google-auth-library');
const logger = require('./logger');

const MONITORING_API_URL = 'https://monitoring.googleapis.com/v3';

class MonitoringClient {
  constructor() {
    this.projectId = 'strategic-lens-465804-d9';
    this.serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    
    this._cache = { data: null, timestamp: 0 };
    this._cacheTTL = 90 * 1000; 
    this._lastUsedValue = 0;
    this._authClient = null;

    if (this.serviceAccountJson) {
      try {
        const credentials = JSON.parse(this.serviceAccountJson);
        this._authClient = new JWT({
          email: credentials.client_email,
          key: credentials.private_key,
          scopes: ['https://www.googleapis.com/auth/monitoring.read'],
        });
        logger.info('Monitoring Engine: Service Account authentication initialized.');
      } catch (err) {
        logger.error('Monitoring Engine: Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON. Falling back to local tracking.');
      }
    } else {
      logger.warn('Monitoring Engine: GOOGLE_SERVICE_ACCOUNT_JSON not found. Accurate quota tracking disabled.');
    }
  }

  async _getAccessToken() {
    if (!this._authClient) return null;
    const tokens = await this._authClient.authorize();
    return tokens.access_token;
  }

  async getQuotaUsage() {
    const now = Date.now();
    
    // 1. Check Cache
    if (this._cache.data && (now - this._cache.timestamp < this._cacheTTL)) {
      return this._cache.data;
    }

    // 2. Fetch from Google if authenticated
    let currentUsed = 0;
    let authenticated = false;

    if (this._authClient) {
      try {
        const token = await this._getAccessToken();
        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);
        
        const response = await axios.get(`${MONITORING_API_URL}/projects/${this.projectId}/timeSeries`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            filter: 'metric.type="serviceruntime.googleapis.com/quota/allocation/usage" AND resource.labels.service="youtube.googleapis.com" AND metric.labels.quota_metric="youtube.googleapis.com/default"',
            'interval.startTime': startOfDay.toISOString(),
            'interval.endTime': new Date().toISOString(),
            'aggregation.alignmentPeriod': '3600s',
            'aggregation.perSeriesAligner': 'ALIGN_DELTA',
            'aggregation.crossSeriesReducer': 'REDUCE_SUM',
          }
        });

        if (response.data.timeSeries) {
          response.data.timeSeries.forEach(series => {
            series.points.forEach(point => {
              currentUsed += point.value.int64Value ? parseInt(point.value.int64Value) : (point.value.doubleValue || 0);
            });
          });
        }
        authenticated = true;
      } catch (error) {
        logger.error('Monitoring Engine: Google API Request failed:', error.response?.data || error.message);
      }
    }

    // 3. Fallback to Local Tracking if Google fails or is unauthenticated
    // We'll use the provided previousValue if Google fails to keep it stable
    const finalUsed = authenticated ? Math.max(this._lastUsedValue, currentUsed) : this._lastUsedValue;
    this._lastUsedValue = finalUsed;

    const limit = 10000;
    const result = {
      used: finalUsed,
      limit: limit,
      remaining: Math.max(0, limit - finalUsed),
      percent: parseFloat(((finalUsed / limit) * 100).toFixed(2)),
      authenticated: authenticated
    };

    this._cache = { data: result, timestamp: now };
    return result;
  }
}

module.exports = new MonitoringClient();
