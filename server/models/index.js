const mongoose = require('mongoose');

const ClipSchema = new mongoose.Schema({
  video_id: String,
  title: String,
  youtube_url: String,
  clipped_by: String,
  created_at: { type: Date, default: Date.now }
});

const ChannelSchema = new mongoose.Schema({
  channel_id: { type: String, unique: true },
  title: String,
  url: String,
  active: { type: Boolean, default: true },
  clips: { type: Number, default: 0 },
  allowed_users: [{
    username: String,
    handle: String,
    channel_url: String,
    channel_id: String,
    thumbnail: String
  }],
  created_at: { type: Date, default: Date.now }
});

const SuspiciousLogSchema = new mongoose.Schema({
  channel_id: String,
  user_name: String,
  query_params: Object,
  ip: String,
  created_at: { type: Date, default: Date.now }
});

const BlockedIpSchema = new mongoose.Schema({
  ip: { type: String, unique: true },
  reason: String,
  created_at: { type: Date, default: Date.now }
});

const SettingsSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  value: mongoose.Schema.Types.Mixed
});

const UsageSchema = new mongoose.Schema({
  youtube_calls: { type: Number, default: 0 }
});

module.exports = {
  Clip: mongoose.model('Clip', ClipSchema),
  Channel: mongoose.model('Channel', ChannelSchema),
  SuspiciousLog: mongoose.model('SuspiciousLog', SuspiciousLogSchema),
  BlockedIp: mongoose.model('BlockedIp', BlockedIpSchema),
  Settings: mongoose.model('Settings', SettingsSchema),
  Usage: mongoose.model('Usage', UsageSchema)
};
