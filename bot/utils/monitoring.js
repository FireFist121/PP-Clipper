const axios = require('axios');
const logger = require('./logger');

const MONITORING_API_URL = 'https://monitoring.googleapis.com/v3';

class MonitoringClient {
  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY;
    this.projectId = 'strategic-lens-465804-d9';
  }

  async getQuotaUsage() {
    if (!this.apiKey) {
      return { usage: 0, limit: 10000 };
    }

    try {
      // YouTube Quota resets at 00:00 Pacific Time (UTC-7/UTC-8)
      // To get the most accurate 'today' count, we'll fetch the last 24 hours 
      // but use Google's alignment to sum it up correctly.
      const now = new Date();
      const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const endTime = now.toISOString();

      const response = await axios.get(`${MONITORING_API_URL}/projects/${this.projectId}/timeSeries`, {
        params: {
          filter: 'metric.type="serviceruntime.googleapis.com/quota/rate/net_usage" AND resource.labels.service="youtube.googleapis.com"',
          'interval.startTime': startTime,
          'interval.endTime': endTime,
          // Aggregate into a single sum for the entire period
          'aggregation.alignmentPeriod': '86400s', 
          'aggregation.perSeriesAligner': 'ALIGN_SUM',
          'aggregation.crossSeriesReducer': 'REDUCE_SUM',
          'aggregation.groupByFields': 'metric.labels.quota_metric',
          key: this.apiKey
        }
      });

      let totalUsage = 0;
      if (response.data.timeSeries && response.data.timeSeries.length > 0) {
        // We look for the 'queries' or 'default' quota metric
        // YouTube Data API v3 usually uses 'queries'
        response.data.timeSeries.forEach(series => {
          const points = series.points || [];
          if (points.length > 0) {
            const val = points[0].value.int64Value ? parseInt(points[0].value.int64Value) : (points[0].value.doubleValue || 0);
            totalUsage += val;
          }
        });
      }

      // Fallback: If totalUsage is still 0 but we know the user has usage, 
      // it might be because the alignment period hasn't finished.
      // Let's try to get raw points if sum is 0.
      if (totalUsage === 0) {
        const rawRes = await axios.get(`${MONITORING_API_URL}/projects/${this.projectId}/timeSeries`, {
          params: {
            filter: 'metric.type="serviceruntime.googleapis.com/quota/rate/net_usage" AND resource.labels.service="youtube.googleapis.com"',
            'interval.startTime': startTime,
            'interval.endTime': endTime,
            key: this.apiKey
          }
        });
        if (rawRes.data.timeSeries) {
          rawRes.data.timeSeries.forEach(series => {
            series.points.forEach(p => {
              totalUsage += p.value.int64Value ? parseInt(p.value.int64Value) : (p.value.doubleValue || 0);
            });
          });
        }
      }

      return {
        usage: totalUsage,
        limit: 10000 
      };
    } catch (error) {
      console.error('Quota Fetch Error:', error.response?.data || error.message);
      return { usage: 0, limit: 10000 };
    }
  }
}

module.exports = new MonitoringClient();
