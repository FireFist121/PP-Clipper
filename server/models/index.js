const mongoose = require('mongoose');

const ClipSchema = new mongoose.Schema({
  video_id: String,
  title: String,
  youtube_url: String,
  clipped_by: String,
  channel_id: String,
  channel_title: String,
  game_name: String,
  created_at: { type: Date, default: Date.now }
});

const ChannelSchema = new mongoose.Schema({
  channel_id: { type: String, unique: true },
  title: String,
  url: String,
  thumbnail: String,
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

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  secondaryPasswordHash: { type: String, default: null },
  created_at: { type: Date, default: Date.now }
});

const RefreshTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tokenHash: { type: String, required: true },
  deviceInfo: String,
  userAgent: String,
  ipAddress: String,
  createdAt: { type: Date, default: Date.now },
  lastUsedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  isActive: { type: Boolean, default: true }
});

// TTL Index to auto-delete expired tokens
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = {
  Clip: mongoose.model('Clip', ClipSchema),
  Channel: mongoose.model('Channel', ChannelSchema),
  SuspiciousLog: mongoose.model('SuspiciousLog', SuspiciousLogSchema),
  BlockedIp: mongoose.model('BlockedIp', BlockedIpSchema),
  Settings: mongoose.model('Settings', SettingsSchema),
  Usage: mongoose.model('Usage', UsageSchema),
  User: mongoose.model('User', UserSchema),
  RefreshToken: mongoose.model('RefreshToken', RefreshTokenSchema)
};
