const mongoose = require('mongoose');
const crypto = require('crypto');
const { Clip, Channel, SuspiciousLog, BlockedIp, Settings, Usage } = require('../server/models');

const initDatabase = async () => {
  if (mongoose.connection.readyState >= 1) return;
  
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI is not set in .env');
    process.exit(1);
  }

  console.log(`📡 Attempting connection to: ${mongoUri.substring(0, 15)}...`);

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Initialize Nightbot Token if missing
    let token = await Settings.findOne({ key: 'nightbot_token' });
    if (!token) {
      const newToken = crypto.randomBytes(8).toString('hex');
      await Settings.create({ key: 'nightbot_token', value: newToken });
    }
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
  }
};

const clips = {
  async insert(data) {
    return await Clip.create(data);
  },
  async findAll({ limit = 50 } = {}) {
    return await Clip.find().sort({ created_at: -1 }).limit(limit);
  },
  async delete(id) {
    return await Clip.findByIdAndDelete(id);
  },
  async deleteAll() {
    return await Clip.deleteMany({});
  }
};

const channels = {
  async upsert(data) {
    return await Channel.findOneAndUpdate(
      { channel_id: data.channel_id },
      { ...data },
      { upsert: true, new: true }
    );
  },
  async findById(channelId) {
    return await Channel.findOne({ channel_id: channelId });
  },
  async findAll() {
    return await Channel.find().sort({ title: 1 });
  },
  async delete(channelId) {
    return await Channel.findOneAndDelete({ channel_id: channelId });
  }
};

const suspicious_logs = {
  async insert(data) {
    return await SuspiciousLog.create(data);
  },
  async findAll({ limit = 50 } = {}) {
    return await SuspiciousLog.find().sort({ created_at: -1 }).limit(limit);
  },
  async clear() {
    return await SuspiciousLog.deleteMany({});
  }
};

const blacklist = {
  async add(ip, reason) {
    return await BlockedIp.findOneAndUpdate(
      { ip },
      { ip, reason, created_at: new Date() },
      { upsert: true, new: true }
    );
  },
  async remove(ip) {
    return await BlockedIp.findOneAndDelete({ ip });
  },
  async isBlocked(ip) {
    const doc = await BlockedIp.findOne({ ip });
    return !!doc;
  },
  async findAll() {
    return await BlockedIp.find().sort({ created_at: -1 });
  }
};

const stats = {
  async getOverview() {
    const totalClips = await Clip.countDocuments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const clipsToday = await Clip.countDocuments({ created_at: { $gte: today } });
    
    const usage = await Usage.findOne() || { youtube_calls: 0 };
    const token = await Settings.findOne({ key: 'nightbot_token' });

    return {
      totalClips,
      clipsToday,
      youtubeApiCalls: usage.youtube_calls,
      nightbotToken: token?.value || 'MISSING'
    };
  },
  async incrementApiUsage(count = 1) {
    const updated = await Usage.findOneAndUpdate(
      {},
      { $inc: { youtube_calls: count } },
      { upsert: true, new: true }
    );
    return updated;
  }
};

module.exports = { initDatabase, clips, channels, suspicious_logs, blacklist, stats };
