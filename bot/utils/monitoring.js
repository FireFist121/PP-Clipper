const axios = require('axios');
const logger = require('./logger');

const MONITORING_API_URL = 'https://monitoring.googleapis.com/v3';

class MonitoringClient {
  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY;
    this.projectId = 'strategic-lens-465804-d9'; // From user request
  }

  async getQuotaUsage() {
    if (!this.apiKey) {
      logger.warn('YOUTUBE_API_KEY is not set. Skipping quota fetch.');
      return { usage: 0, limit: 10000 };
    }

    try {
      // We need to fetch the last 24 hours of usage for the YouTube Data API v3
      // The filter provided by the user: metric.type="serviceruntime.googleapis.com/quota/rate/net_usage"
      // We also need to filter by the service "youtube.googleapis.com"
      const now = new Date();
      const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const endTime = now.toISOString();

      const response = await axios.get(`${MONITORING_API_URL}/projects/${this.projectId}/timeSeries`, {
        params: {
          filter: 'metric.type="serviceruntime.googleapis.com/quota/rate/net_usage" AND resource.labels.service="youtube.googleapis.com"',
          'interval.startTime': startTime,
          'interval.endTime': endTime,
          key: this.apiKey
        }
      });

      // The response contains time series data. We need to sum the points or take the latest value depending on how it's reported.
      // For rate/net_usage, it's usually a delta.
      let totalUsage = 0;
      if (response.data.timeSeries && response.data.timeSeries.length > 0) {
        // Sum up all points in the last 24h or take the sum if it's already aggregated
        // For net_usage, we usually look at the latest value if it's a gauge or sum of deltas.
        // Actually, net_usage for quota/rate is usually reported as points.
        // Let's try to get the most accurate sum.
        response.data.timeSeries.forEach(series => {
          series.points.forEach(point => {
            totalUsage += point.value.int64Value ? parseInt(point.value.int64Value) : (point.value.doubleValue || 0);
          });
        });
      }

      return {
        usage: totalUsage,
        limit: 10000 // Standard limit for YouTube Data API v3
      };
    } catch (error) {
      logger.error('Error fetching quota from Monitoring API:', error.response?.data || error.message);
      return { usage: 0, limit: 10000, error: true };
    }
  }
}

module.exports = new MonitoringClient();
