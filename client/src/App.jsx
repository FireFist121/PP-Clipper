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

  const deleteAllClips = async () => {
    if (!window.confirm('⚠️ WARNING: This will delete ALL generated clips forever. Continue?')) return;
    try {
      await axios.delete('/api/clips');
      fetchData();
    } catch (err) {
      console.error('Delete All error:', err);
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
  const bg = 'min-h-screen bg-[#03000a] text-white selection:bg-[#7c3aed]/30 relative overflow-hidden';
  const glassCard = 'bg-white/[0.01] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] transition-all duration-1000 hover:border-[#7c3aed]/30 shadow-[0_20px_80px_rgba(0,0,0,0.8)] hover:shadow-[0_30px_100px_rgba(124,58,237,0.15)] hover:-translate-y-2';
  const muted = 'text-white/30';
  const inputCls = 'bg-white/[0.02] border border-white/5 text-white placeholder-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-[#7c3aed] focus:ring-8 focus:ring-[#7c3aed]/5 transition-all duration-700';
  const accentBtn = 'bg-gradient-to-br from-[#7c3aed] via-[#6d28d9] to-[#4c1d95] hover:shadow-[0_20px_50px_rgba(124,58,237,0.5)] text-white text-xs font-black tracking-[0.2em] px-8 py-4 rounded-2xl transition-all duration-700 flex items-center gap-2 cursor-pointer active:scale-90 border border-white/10 uppercase';
  const premiumBadge = 'bg-gradient-to-br from-[#7c3aed]/10 to-transparent border border-white/5 rounded-3xl p-4 flex items-center gap-4 transition-all duration-700 hover:border-[#7c3aed]/40 hover:bg-[#7c3aed]/20 group relative overflow-hidden';

  const tabCls = (t) =>
    `px-8 py-3.5 text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all duration-1000 cursor-pointer flex items-center gap-3 relative overflow-hidden ${
      activeTab === t
        ? 'bg-[#7c3aed]/20 text-white shadow-[0_0_40px_rgba(124,58,237,0.2)] scale-105 border border-[#7c3aed]/40 after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-gradient-to-r after:from-cyan-400 after:to-violet-600'
        : 'text-white/20 hover:text-white/60 hover:bg-white/5'
    }`;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#05000a] flex items-center justify-center p-6 relative overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@800&display=swap');
          @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-30px); } }
          .bg-glow { position: absolute; width: 800px; height: 800px; border-radius: 50%; background: radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%); filter: blur(100px); animation: float 10s ease-in-out infinite; }
        `}</style>
        <div className="bg-glow -top-64 -left-64" />
        <div className="bg-glow -bottom-64 -right-64" style={{ animationDelay: '-5s' }} />
        
        <div className="bg-white/[0.01] backdrop-blur-[100px] border border-white/5 w-full max-w-md p-12 rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative z-10 border-t-white/10">
          <div className="flex flex-col items-center gap-8 mb-14">
            <div className="w-28 h-28 rounded-[2.5rem] bg-gradient-to-br from-[#7c3aed] to-[#22d3ee] flex items-center justify-center shadow-[0_20px_50px_rgba(124,58,237,0.4)] animate-pulse">
              <Icon.Clip size={50} />
            </div>
            <div className="text-center">
              <h1 className="text-5xl font-black text-white mb-3 tracking-tighter uppercase" style={{ fontFamily: "'Syne', sans-serif" }}>PP CLIPPER</h1>
              <p className="text-[#7c3aed] font-black text-[10px] tracking-[0.5em] uppercase">Private Admin Access</p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-4">Email Address</label>
              <input name="email" type="email" defaultValue="PPClipper@admin.com" className="w-full bg-white/[0.03] border border-white/5 text-white rounded-[1.5rem] px-6 py-5 text-sm focus:border-[#7c3aed] focus:ring-8 focus:ring-[#7c3aed]/5 transition-all outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-4">Access Key</label>
              <input name="password" type="password" placeholder="••••••••" className="w-full bg-white/[0.03] border border-white/5 text-white rounded-[1.5rem] px-6 py-5 text-sm focus:border-[#7c3aed] focus:ring-8 focus:ring-[#7c3aed]/5 transition-all outline-none" />
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] hover:shadow-[0_20px_40px_rgba(124,58,237,0.3)] text-white font-black py-6 rounded-[1.5rem] transition-all uppercase tracking-[0.3em] text-[10px] active:scale-95 border border-white/10">Authorize Terminal</button>
          </form>
          <p className="text-center mt-12 text-[10px] font-bold text-white/10 uppercase tracking-widest">v3.0 Secure Engine</p>
        </div>
      </div>
    );
  }

  return (
    <div className={bg} style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@800&display=swap');
        .fade-slide-up { animation: fadeSlideUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; transform: translateY(20px); }
        @keyframes fadeSlideUp { to { opacity: 1; transform: translateY(0); } }
        .bg-blob { position: absolute; border-radius: 50%; filter: blur(120px); z-index: 0; pointer-events: none; opacity: 0.15; animation: pulse 10s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.15; } 50% { transform: scale(1.2); opacity: 0.25; } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>

      {/* Decorative Blobs */}
      <div className="bg-blob w-[800px] h-[800px] bg-violet-600/40 -top-64 -left-64" />
      <div className="bg-blob w-[600px] h-[600px] bg-cyan-400/20 -bottom-64 -right-64" style={{ animationDelay: '-5s' }} />
      <div className="bg-blob w-[500px] h-[500px] bg-fuchsia-500/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: '-2s' }} />

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-12 relative z-10">
        <nav className="flex justify-between items-center pb-10 border-b border-white/5">
          <div className="flex items-center gap-6 group">
            <div className="w-16 h-16 bg-gradient-to-br from-[#7c3aed] to-[#22d3ee] rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.3)] transition-transform duration-700 group-hover:rotate-12"><Icon.Clip size={32} /></div>
            <div>
              <span className="text-3xl font-extrabold tracking-tighter uppercase block leading-none" style={{ fontFamily: "'Syne', sans-serif" }}>PP CLIPPER</span>
              <span className="text-[10px] font-black text-cyan-400 tracking-[0.4em] uppercase mt-2 block">Premium Cloud Engine v3.0</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-[10px] font-black text-cyan-400 bg-cyan-400/5 px-6 py-3 rounded-full border border-cyan-400/20 shadow-[0_0_20px_rgba(34,211,238,0.1)] uppercase tracking-[0.2em]">ULTRA-STABLE</div>
            <button onClick={handleLogout} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-rose-500/20 transition-all text-white/20 hover:text-rose-500 flex items-center justify-center"><Icon.Logout /></button>
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
              <div className="p-10 border-b border-white/5 flex flex-wrap gap-8 justify-between items-center bg-white/[0.01]">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>GENERATED CLIPS</h2>
                  <p className="text-[10px] font-bold text-white/20 tracking-[0.2em] uppercase">Archive of all captured moments</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <input type="text" placeholder="Search archives..." value={search} onChange={e => setSearch(e.target.value)} className={`${inputCls} w-72 !pl-12 hover:bg-white/[0.05]`} />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#7c3aed] transition-colors"><Icon.Search /></div>
                  </div>
                  <button 
                    onClick={deleteAllClips} 
                    className="h-12 px-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all duration-500 active:scale-90"
                  >
                    Clear Archive
                  </button>
                </div>
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
                  <input type="text" placeholder="Channel Link / ID" value={newChannelUrl} onChange={e => setNewChannelUrl(e.target.value)} className={inputCls + " flex-1"} />
                  <button onClick={addChannel} className={accentBtn}><Icon.Plus /> AUTHORIZE</button>
                </div>
             </div>
             
             <div className="grid md:grid-cols-2 gap-8">
                {channels.map(ch => (
                  <div key={ch.channel_id} className={`${glassCard} p-10 group flex flex-col relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-all duration-700" />
                    
                    <div className="flex justify-between mb-8 relative z-10">
                      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500/20 to-blue-600/5 flex items-center justify-center text-blue-400 border border-blue-500/10"><Icon.Channel /></div>
                      <button onClick={() => deleteChannel(ch.channel_id)} className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-rose-500/20 text-rose-500/40 hover:text-rose-500 transition-all duration-300"><Icon.Trash /></button>
                    </div>
                    
                    <h3 className="text-2xl font-extrabold tracking-tight mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>{ch.title}</h3>
                    <p className="text-[10px] font-bold text-white/20 tracking-widest uppercase mb-10">{ch.channel_id}</p>
                    
                    {/* Whitelist Section */}
                    <div className="flex-1 space-y-6 relative z-10">
                      <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Authorized Crew</h4>
                        <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-md">{ch.allowed_users?.length || 0}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {ch.allowed_users?.length === 0 ? (
                          <div className="py-8 text-center border-2 border-dashed border-white/5 rounded-3xl">
                            <p className="text-[11px] text-white/20 font-medium italic">Owner-only mode active</p>
                          </div>
                        ) : (
                          ch.allowed_users.map(u => (
                            <div key={u.username} className={premiumBadge}>
                              <div className="relative">
                                {u.thumbnail ? (
                                  <img src={u.thumbnail} alt={u.username} className="w-10 h-10 rounded-2xl object-cover border border-white/10" />
                                ) : (
                                  <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-xs font-black text-white/20 border border-white/10">{u.username.charAt(0).toUpperCase()}</div>
                                )}
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#02040a] rounded-full shadow-lg" />
                              </div>
                              <div className="flex flex-col flex-1 truncate">
                                <span className="text-xs font-bold text-white/90 truncate">{u.username}</span>
                                {u.handle && <span className="text-[9px] font-bold text-blue-400/60 tracking-wider truncate">{u.handle}</span>}
                              </div>
                              <button 
                                onClick={async () => { 
                                  await axios.delete(`/api/channels/${ch.channel_id}/allowed-users/${encodeURIComponent(u.username)}`); 
                                  fetchData(); 
                                }} 
                                className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 text-rose-500 transition-all duration-300"
                              >
                                <Icon.Close />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                      
                      <div className="group/input relative">
                        <input 
                          type="text" 
                          placeholder="Add user by @handle or link..." 
                          className={inputCls + " w-full !pl-12"} 
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
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-blue-500 transition-colors"><Icon.Plus /></div>
                      </div>
                    </div>

                    <div className="mt-10 pt-10 border-t border-white/5 flex justify-between items-center relative z-10">
                       <button onClick={() => setSetupModal(ch)} className="text-[10px] font-black text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest flex items-center gap-2">
                         <Icon.Bot /> Setup Guide
                       </button>
                       <button onClick={() => toggleChannel(ch.channel_id)} className={`text-[10px] font-black px-6 py-2.5 rounded-2xl border transition-all duration-500 uppercase tracking-widest ${ch.active ? 'text-emerald-400 bg-emerald-400/5 border-emerald-400/10 shadow-[0_0_20px_rgba(52,211,153,0.1)]' : 'text-rose-400 bg-rose-400/5 border-rose-400/10'}`}>
                         {ch.active ? 'System Live' : 'System Paused'}
                       </button>
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