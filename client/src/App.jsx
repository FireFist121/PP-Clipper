import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import logo from './assets/logo.png';
import { formatDistanceToNow } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// ─── Icons ───────────────────────────────────────────────────────────────────
const Icon = {
  Search: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Copy: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  ),
  Check: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  ExternalLink: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
  Channel: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.54C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
    </svg>
  ),
  Plus: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Trash: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  ),
  Clip: ({ size = 18 }) => (
    <img src={logo} alt="Logo" style={{ width: size, height: size }} className="object-contain" />
  ),
  Bot: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16.01"/><line x1="16" y1="16" x2="16" y2="16.01"/>
    </svg>
  ),
  Logout: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Close: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('pp_clipper_auth') === 'true');
  const [stats, setStats] = useState(null);
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suspiciousLogs, setSuspiciousLogs] = useState([]);
  const [blockedIps, setBlockedIps] = useState([]);
  const [search, setSearch] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [channels, setChannels] = useState([]);
  const [newChannelUrl, setNewChannelUrl] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [setupModal, setSetupModal] = useState(null);
  const [serverUrl, setServerUrl] = useState('');

  useEffect(() => {
    const host = window.location.origin.replace(':5173', ':3000').replace(':5174', ':3000');
    setServerUrl(host);
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
      const interval = setInterval(fetchData, 10000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const fetchData = async () => {
    try {
      const [sRes, cRes, lRes, bRes, slRes] = await Promise.all([
        axios.get('/api/stats'),
        axios.get('/api/channels'),
        axios.get('/api/clips'),
        axios.get('/api/channels/blacklist'),
        axios.get('/api/channels/suspicious')
      ]);
      setStats(sRes.data);
      setChannels(cRes.data);
      setClips(lRes.data);
      setBlockedIps(bRes.data);
      setSuspiciousLogs(slRes.data);
      buildChartData(lRes.data);
    } catch (err) {
      console.error('Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearSuspiciousLogs = async () => {
    try { await axios.delete('/api/channels/suspicious'); fetchData(); } catch (err) { console.error(err); }
  };

  const blockIp = async (ip, reason) => {
    try { await axios.post('/api/channels/blacklist', { ip, reason }); fetchData(); } catch (err) { console.error(err); }
  };

  const buildChartData = (clipsArr) => {
    const days = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en', { weekday: 'short' });
      days[key] = 0;
    }
    clipsArr.forEach((c) => {
      const key = new Date(c.created_at).toLocaleDateString('en', { weekday: 'short' });
      if (key in days) days[key]++;
    });
    setChartData(Object.entries(days).map(([day, clips]) => ({ day, clips })));
  };

  const filteredClips = useMemo(() => {
    return clips.filter((c) => {
      const matchSearch =
        c.title?.toLowerCase().includes(search.toLowerCase()) ||
        c.clipped_by?.toLowerCase().includes(search.toLowerCase()) ||
        c.video_id?.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filterBy === 'all' ||
        (filterBy === 'named' && c.clipped_by && c.clipped_by !== 'Unknown') ||
        (filterBy === 'unknown' && (!c.clipped_by || c.clipped_by === 'Unknown'));
      return matchSearch && matchFilter;
    });
  }, [clips, search, filterBy]);

  const handleCopy = (clip) => {
    navigator.clipboard.writeText(clip.youtube_url || `https://youtube.com/watch?v=${clip.video_id}`);
    setCopiedId(clip.video_id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const addChannel = async () => {
    if (!newChannelUrl.trim()) return;
    const channelId = newChannelUrl.startsWith('UC') ? newChannelUrl : newChannelUrl.split('/').pop();
    try {
      await axios.post('/api/channels', { 
        channel_id: channelId, 
        title: newChannelName || channelId, 
        url: newChannelUrl.startsWith('http') ? newChannelUrl : `https://youtube.com/channel/${newChannelUrl}` 
      });
      fetchData();
      setNewChannelUrl('');
      setNewChannelName('');
      setSetupModal({ channel_id: channelId });
    } catch (err) { console.error(err); }
  };

  const toggleChannel = async (id) => {
    try {
      await axios.patch(`/api/channels/${id}/toggle`);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const deleteChannel = async (id) => {
    if (!window.confirm('Delete this channel?')) return;
    try { await axios.delete(`/api/channels/${id}`); fetchData(); } catch (err) { console.error(err); }
  };

  const testWebhook = async () => {
    try {
      const res = await axios.post('/api/channels/test-webhook');
      if (res.data.success) alert('✅ Success! Check your Discord channel.');
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.error || 'Check Render Environment Variables'));
    }
  };

  const deleteClip = async (id) => {
    if (!window.confirm('Are you sure you want to delete this clip forever?')) return;
    try {
      await axios.delete(`/api/clips/${id}`);
      fetchData();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    if (email === 'PPClipper@admin.com' && password === 'FIREFISTDEAD') {
      localStorage.setItem('pp_clipper_auth', 'true');
      setIsLoggedIn(true);
    } else { alert('Invalid credentials!'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('pp_clipper_auth');
    setIsLoggedIn(false);
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const bg = 'min-h-screen bg-[#05060b] text-white selection:bg-[#3b82f6]/30';
  const glassCard = 'bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl transition-all duration-500 hover:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.4)]';
  const muted = 'text-[#8a9bb0]';
  const inputCls = 'bg-white/5 border border-white/10 text-white placeholder-[#4a5568] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all';
  const accentBtn = 'bg-gradient-to-br from-[#3b82f6] to-[#2563eb] hover:from-[#60a5fa] hover:to-[#3b82f6] text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 cursor-pointer active:scale-95 shadow-[0_10px_20px_rgba(59,130,246,0.2)] hover:shadow-[0_15px_25px_rgba(59,130,246,0.3)]';

  const tabCls = (t) =>
    `px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-500 cursor-pointer flex items-center gap-2 ${
      activeTab === t
        ? 'bg-[#3b82f6] text-white shadow-[0_10px_25px_rgba(59,130,246,0.3)] scale-105'
        : 'text-[#8a9bb0] hover:text-white hover:bg-white/5'
    }`;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#050608] flex items-center justify-center p-4 relative overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@800&display=swap');
          @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
          .bg-glow { position: absolute; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%); filter: blur(80px); animation: float 8s ease-in-out infinite; }
        `}</style>
        <div className="bg-glow -top-48 -left-48" />
        <div className="bg-glow -bottom-48 -right-48" style={{ animationDelay: '-4s' }} />
        <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 w-full max-w-md p-10 rounded-[2.5rem] shadow-2xl relative z-10">
          <div className="flex flex-col items-center gap-6 mb-12">
            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] flex items-center justify-center shadow-2xl">
              <Icon.Channel />
            </div>
            <div className="text-center">
              <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight uppercase" style={{ fontFamily: "'Syne', sans-serif" }}>PP Clipper</h1>
              <p className="text-[#8a9bb0] font-medium tracking-wide">Made by - FireFist</p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input name="email" type="email" defaultValue="PPClipper@admin.com" className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-5 py-4 text-sm focus:border-[#3b82f6] transition-all" />
            <input name="password" type="password" placeholder="Password" className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-5 py-4 text-sm focus:border-[#3b82f6] transition-all" />
            <button type="submit" className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold py-5 rounded-2xl transition-all uppercase tracking-widest text-xs">Authorize Access</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={bg} style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@800&display=swap');
        .fade-slide-up { animation: fadeSlideUp 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards; opacity: 0; transform: translateY(10px); }
        @keyframes fadeSlideUp { to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-10">
        <nav className="flex justify-between items-center pb-8 border-b border-white/5">
          <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 bg-gradient-to-br from-[#3b82f6] to-[#2563eb] rounded-2xl flex items-center justify-center shadow-lg"><Icon.Clip size={28} /></div>
            <div>
              <span className="text-2xl font-extrabold tracking-tighter uppercase block leading-none" style={{ fontFamily: "'Syne', sans-serif" }}>PP CLIPPER</span>
              <span className="text-[10px] font-bold text-[#3b82f6] tracking-[0.2em] uppercase mt-1 block">Cloud Engine v2.0</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-[10px] font-bold text-emerald-400 bg-emerald-400/5 px-4 py-2 rounded-full border border-emerald-400/10">LIVE ENGINE</div>
            <button onClick={handleLogout} className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-rose-500/10 transition-all text-white/40 hover:text-rose-400"><Icon.Logout /></button>
          </div>
        </nav>

        <div className="flex items-center gap-3 bg-white/[0.02] p-1.5 rounded-2xl border border-white/5 w-fit">
          <button className={tabCls('dashboard')} onClick={() => setActiveTab('dashboard')}><Icon.Clip /> Dashboard</button>
          <button className={tabCls('channels')} onClick={() => setActiveTab('channels')}><Icon.Channel /> Channels</button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Clips', value: stats?.totalClips ?? 0, color: '#3b82f6' },
                { label: 'Clips Today', value: stats?.clipsToday ?? 0, color: '#10b981' },
                { label: 'API Quota', value: stats?.youtubeApiCalls ?? 0, color: '#f59e0b' },
                { label: 'Blocked IPs', value: blockedIps.length, color: '#f43f5e' },
              ].map(({ label, value, color }, idx) => (
                <div key={label} className={`${glassCard} p-6 fade-slide-up`} style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-4 ${muted}`}>{label}</div>
                  <div className="text-5xl font-extrabold tracking-tighter" style={{ color }}>{loading ? '...' : value}</div>
                </div>
              ))}
            </div>

            <div className={`${glassCard} overflow-hidden fade-slide-up`} style={{ animationDelay: '0.6s' }}>
              <div className="p-8 border-b border-white/5 flex flex-wrap gap-6 justify-between items-center">
                <h2 className="text-lg font-bold">Generated Clips</h2>
                <input type="text" placeholder="Search clips..." value={search} onChange={e => setSearch(e.target.value)} className={`${inputCls} w-64`} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="py-4 px-8 text-[10px] font-bold uppercase tracking-widest text-[#8a9bb0]">Details</th>
                      <th className="py-4 px-8 text-[10px] font-bold uppercase tracking-widest text-[#8a9bb0]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-white/5">
                    {filteredClips.map((clip, i) => (
                      <tr key={i} className="group hover:bg-white/[0.02]">
                        <td className="py-5 px-8">
                          <div className="text-sm font-bold">{clip.title}</div>
                          <div className="text-[10px] text-[#4a5568]">@{clip.clipped_by}</div>
                        </td>
                        <td className="py-5 px-8 flex gap-3">
                          <button onClick={() => handleCopy(clip)} className="p-2 bg-white/5 rounded-lg hover:bg-[#3b82f6] transition-all">{copiedId === clip.video_id ? <Icon.Check /> : <Icon.Copy />}</button>
                          <a href={clip.youtube_url} target="_blank" className="p-2 bg-white/5 rounded-lg hover:bg-white/10"><Icon.ExternalLink /></a>
                          <button onClick={() => deleteClip(clip._id)} className="p-2 bg-white/5 rounded-lg hover:bg-rose-500/20 text-rose-500/40 hover:text-rose-500 transition-all"><Icon.Trash /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 pb-20">
              {/* Suspicious Logs */}
              <div className={`${glassCard} flex flex-col fade-slide-up`} style={{ animationDelay: '0.8s' }}>
                <div className="p-8 border-b border-white/5 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold">Suspicious Activity</h2>
                    <p className={`text-[10px] ${muted}`}>Unauthorized access attempts recorded.</p>
                  </div>
                  <button onClick={clearSuspiciousLogs} className="text-[10px] font-bold text-rose-400 hover:underline uppercase">Clear Logs</button>
                </div>
                <div className="flex-1 overflow-auto max-h-[400px]">
                  <table className="w-full text-left">
                    <tbody className="divide-y border-white/5">
                      {suspiciousLogs.length === 0 ? (
                        <tr><td className={`py-10 text-center text-xs ${muted}`}>No threats detected.</td></tr>
                      ) : (
                        suspiciousLogs.map((log, i) => (
                          <tr key={i} className="hover:bg-white/[0.02]">
                            <td className="py-4 px-8">
                              <div className="text-xs font-bold text-rose-400">{log.channel_id}</div>
                              <div className="text-[10px] text-[#4a5568]">{log.ip} · {new Date(log.created_at).toLocaleTimeString()}</div>
                            </td>
                            <td className="py-4 px-8 text-right">
                              <button onClick={() => blockIp(log.ip, 'Suspicious access attempt')} className="text-[10px] font-bold bg-rose-500/10 text-rose-500 px-3 py-1.5 rounded-lg border border-rose-500/10 hover:bg-rose-500 hover:text-white transition-all">BLOCK IP</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Firewall / Blocked IPs */}
              <div className={`${glassCard} flex flex-col fade-slide-up`} style={{ animationDelay: '0.9s' }}>
                <div className="p-8 border-b border-white/5">
                  <h2 className="text-lg font-bold">System Firewall</h2>
                  <p className={`text-[10px] ${muted}`}>Currently restricted IP addresses.</p>
                </div>
                <div className="flex-1 overflow-auto max-h-[400px]">
                  <table className="w-full text-left">
                    <tbody className="divide-y border-white/5">
                      {blockedIps.length === 0 ? (
                        <tr><td className={`py-10 text-center text-xs ${muted}`}>Firewall is clean.</td></tr>
                      ) : (
                        blockedIps.map((b, i) => (
                          <tr key={i} className="hover:bg-white/[0.02]">
                            <td className="py-4 px-8">
                              <div className="text-xs font-mono font-bold text-white/80">{b.ip}</div>
                              <div className="text-[10px] text-rose-400/60 uppercase tracking-widest font-bold mt-1">{b.reason || 'BANNED'}</div>
                            </td>
                            <td className="py-4 px-8 text-right">
                              <button onClick={async () => { await axios.delete(`/api/channels/blacklist/${b.ip}`); fetchData(); }} className="text-[10px] font-bold text-emerald-400 bg-emerald-400/5 px-3 py-1.5 rounded-lg border border-emerald-400/10 hover:bg-emerald-400 hover:text-black transition-all">UNBLOCK</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'channels' && (
          <div className="space-y-8 max-w-4xl mx-auto">
             <div className={`${glassCard} p-10`}>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-extrabold" style={{ fontFamily: "'Syne', sans-serif" }}>AUTHORIZE ENGINE</h2>
                  <button onClick={testWebhook} className="text-[10px] font-bold px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 transition-all uppercase tracking-widest">
                    Test Webhook
                  </button>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  <input type="text" placeholder="Channel Name" value={newChannelName} onChange={e => setNewChannelName(e.target.value)} className={inputCls + " flex-1"} />
                  <input type="text" placeholder="Channel ID" value={newChannelUrl} onChange={e => setNewChannelUrl(e.target.value)} className={inputCls + " flex-1"} />
                  <button onClick={addChannel} className={accentBtn}><Icon.Plus /> AUTHORIZE</button>
                </div>
             </div>
             <div className="grid md:grid-cols-2 gap-6">
                {channels.map(ch => (
                  <div key={ch.channel_id} className={`${glassCard} p-8 group flex flex-col`}>
                    <div className="flex justify-between mb-8">
                      <div className="w-12 h-12 rounded-xl bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6]"><Icon.Channel /></div>
                      <button onClick={() => deleteChannel(ch.channel_id)} className="p-2 rounded-lg hover:bg-rose-500/20 text-rose-500"><Icon.Trash /></button>
                    </div>
                    <h3 className="text-lg font-bold">{ch.title}</h3>
                    <p className="text-[10px] text-[#4a5568] font-mono mb-6">{ch.channel_id}</p>
                    
                    {/* Whitelist Section */}
                    <div className="flex-1 space-y-4">
                      <h4 className="text-[10px] font-bold text-[#8a9bb0] uppercase tracking-widest border-b border-white/5 pb-2">Allowed Users</h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                        {ch.allowed_users?.length === 0 ? (
                          <p className="text-[10px] text-[#4a5568] italic">Only you (owner) can currently clip.</p>
                        ) : (
                          ch.allowed_users.map(u => (
                            <div key={u.username} className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                              <span className="text-[10px] font-medium truncate">{u.username}</span>
                              <button 
                                onClick={async () => { 
                                  await axios.delete(`/api/channels/${ch.channel_id}/allowed-users/${u.username}`); 
                                  fetchData(); 
                                }} 
                                className="text-rose-500/60 hover:text-rose-500 transition-all"
                              >
                                <Icon.Close />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <input 
                          type="text" 
                          placeholder="User or Link" 
                          className={inputCls + " flex-1 !py-1.5 !text-[10px]"} 
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter' && e.target.value.trim()) {
                              try {
                                await axios.post(`/api/channels/${ch.channel_id}/allowed-users`, { input: e.target.value });
                                e.target.value = '';
                                fetchData();
                              } catch (err) {
                                alert(err.response?.data?.error || 'Failed to add user');
                              }
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/5 flex justify-between items-center">
                       <button onClick={() => setSetupModal(ch)} className="text-[10px] font-bold text-[#3b82f6] hover:underline uppercase">Setup Guide</button>
                       <button onClick={() => toggleChannel(ch.channel_id)} className={`text-[10px] font-bold px-4 py-2 rounded-xl border transition-all ${ch.active ? 'text-emerald-400 bg-emerald-400/5 border-emerald-400/10' : 'text-rose-400 bg-rose-400/5 border-rose-400/10'}`}>{ch.active ? 'ON' : 'OFF'}</button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        <footer className="pt-12 border-t border-white/5 flex justify-between items-center text-[10px] font-bold tracking-[0.3em] text-[#334155] uppercase">
          <div className="flex items-center gap-4"><span>PP CLIPPER · v2.0</span> <span className="text-[#3b82f6]">MADE BY - FIREFIST</span></div>
          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />Stable</div>
        </footer>
      </div>

      {setupModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050608]/95 backdrop-blur-xl p-6">
           <div className="bg-[#0d0f12] border border-white/10 w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
              <button onClick={() => setSetupModal(null)} className="absolute top-6 right-6 text-white/30 hover:text-white bg-white/5 p-2 rounded-xl"><Icon.Close /></button>
              <h2 className="text-3xl font-extrabold mb-10 tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>BOT SETUP</h2>
              <div className="space-y-12">
                 <div className="flex gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-[#3b82f6] flex items-center justify-center text-lg font-black shrink-0">1</div>
                    <div className="flex-1 space-y-4">
                      <p className="text-sm font-medium">Verify your <strong className="text-[#3b82f6]">Public Access URL</strong>:</p>
                      <input type="text" value={serverUrl} onChange={e => setServerUrl(e.target.value)} className={inputCls + " w-full"} />
                    </div>
                 </div>
                 <div className="flex gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-[#3b82f6] flex items-center justify-center text-lg font-black shrink-0">2</div>
                    <div className="flex-1 space-y-4">
                       <p className="text-sm font-medium">Add this command to Nightbot:</p>
                       <div className="flex items-center gap-4 bg-black/40 p-6 rounded-2xl border border-white/5 group shadow-inner">
                          <div className="flex-1 font-mono text-xs text-white/90 leading-relaxed break-all">
                            {`$(urlfetch ${serverUrl}/api/nightbot/clip?channelId=$(channelid)&user=$(user)&title=$(querystring)&token=${stats?.nightbotToken || '...' })`}
                          </div>
                          <button onClick={() => { navigator.clipboard.writeText(`$(urlfetch ${serverUrl}/api/nightbot/clip?channelId=$(channelid)&user=$(user)&title=$(querystring)&token=${stats?.nightbotToken})`); setCopiedId('bot-link'); setTimeout(() => setCopiedId(null), 2000); }} className="p-4 bg-[#3b82f6] text-white rounded-xl shadow-lg active:scale-95">
                             {copiedId === 'bot-link' ? <Icon.Check /> : <Icon.Copy />}
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}