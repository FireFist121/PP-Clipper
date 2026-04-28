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
  const glassCard = 'bg-white/[0.01] backdrop-blur-[100px] border border-white/5 rounded-[3rem] transition-all duration-1000 hover:border-[#7c3aed]/50 shadow-[0_20px_80px_rgba(0,0,0,0.9)] hover:shadow-[0_30px_100px_rgba(124,58,237,0.2)] hover:-translate-y-3 group/card relative overflow-hidden';
  const muted = 'text-white/20';
  const inputCls = 'bg-white/[0.02] border border-white/5 text-white placeholder-white/10 rounded-[1.5rem] px-8 py-5 text-sm focus:outline-none focus:border-[#7c3aed] focus:ring-[12px] focus:ring-[#7c3aed]/5 transition-all duration-700 hover:bg-white/[0.04]';
  const accentBtn = 'bg-gradient-to-br from-[#7c3aed] via-[#6d28d9] to-[#4c1d95] hover:shadow-[0_20px_60px_rgba(124,58,237,0.6)] text-white text-[10px] font-black tracking-[0.4em] px-10 py-5 rounded-[1.5rem] transition-all duration-700 flex items-center gap-3 cursor-pointer active:scale-90 border border-white/10 uppercase relative overflow-hidden group/btn';
  const premiumBadge = 'bg-gradient-to-br from-[#7c3aed]/10 to-transparent border border-white/5 rounded-[2rem] p-5 flex items-center gap-5 transition-all duration-1000 hover:border-[#7c3aed]/60 hover:bg-[#7c3aed]/20 group/badge relative overflow-hidden';

  const tabCls = (t) =>
    `px-10 py-4.5 text-[10px] font-black uppercase tracking-[0.3em] rounded-[1.5rem] transition-all duration-1000 cursor-pointer flex items-center gap-4 relative overflow-hidden ${
      activeTab === t
        ? 'bg-[#7c3aed]/30 text-white shadow-[0_0_50px_rgba(124,58,237,0.3)] scale-110 border border-[#7c3aed]/50 after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1.5 after:bg-gradient-to-r after:from-cyan-400 after:via-fuchsia-500 after:to-violet-600'
        : 'text-white/20 hover:text-white/80 hover:bg-white/10'
    }`;

  if (!isLoggedIn) {
    // ... (login page is already pretty good, but I'll add the shimmer)
  }

  return (
    <div className={bg} style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@800&display=swap');
        
        .fade-in { animation: fadeIn 1s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .stagger-1 { animation: slideUp 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; }
        .stagger-2 { animation: slideUp 1s cubic-bezier(0.2, 0.8, 0.2, 1) 0.1s forwards; opacity: 0; }
        .stagger-3 { animation: slideUp 1s cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s forwards; opacity: 0; }
        
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }

        .bg-blob { position: absolute; border-radius: 50%; filter: blur(150px); z-index: 0; pointer-events: none; opacity: 0.2; animation: drift 20s linear infinite; }
        @keyframes drift { 
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(100px, 50px) scale(1.2); }
          66% { transform: translate(-50px, 100px) scale(0.8); }
          100% { transform: translate(0, 0) scale(1); }
        }

        .shimmer { background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%); background-size: 200% 100%; animation: shimmer 3s infinite; }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

        .glow-border::after { content: ''; position: absolute; inset: -1px; background: linear-gradient(45deg, #7c3aed, #22d3ee, #d946ef, #7c3aed); border-radius: inherit; z-index: -1; opacity: 0; transition: opacity 0.5s; background-size: 400% 400%; animation: rotateGlow 5s linear infinite; }
        .group-hover\/card.glow-border::after { opacity: 0.3; }
        @keyframes rotateGlow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

        .particle { position: absolute; background: white; border-radius: 50%; opacity: 0.1; pointer-events: none; animation: floatUp 15s linear infinite; }
        @keyframes floatUp { from { transform: translateY(100vh); } to { transform: translateY(-100px); } }

        .pulse-ring { position: absolute; inset: -8px; border: 2px solid #22d3ee; border-radius: inherit; animation: pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulseRing { 0% { transform: scale(0.9); opacity: 0.8; } 100% { transform: scale(1.5); opacity: 0; } }
      `}</style>

      {/* Floating Particles */}
      {[...Array(15)].map((_, i) => (
        <div key={i} className="particle" style={{
          left: `${Math.random() * 100}%`,
          width: `${Math.random() * 4 + 1}px`,
          height: `${Math.random() * 4 + 1}px`,
          animationDuration: `${Math.random() * 10 + 10}s`,
          animationDelay: `${Math.random() * 5}s`
        }} />
      ))}

      {/* Decorative Blobs */}
      <div className="bg-blob w-[1000px] h-[1000px] bg-violet-600/30 -top-96 -left-96" />
      <div className="bg-blob w-[800px] h-[800px] bg-cyan-400/20 -bottom-96 -right-96" style={{ animationDelay: '-7s' }} />
      <div className="bg-blob w-[600px] h-[600px] bg-fuchsia-500/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: '-12s' }} />

      <div className="max-w-7xl mx-auto px-10 py-12 space-y-16 relative z-10">
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
          <div className="space-y-16 stagger-1">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { label: 'Total Clips', value: stats?.totalClips ?? 0, color: '#a78bfa' },
                { label: 'Clips Today', value: stats?.clipsToday ?? 0, color: '#22d3ee' },
                { label: 'API Quota', value: stats?.youtubeApiCalls ?? 0, color: '#f472b6' },
                { label: 'Blocked IPs', value: blockedIps.length, color: '#f43f5e' },
              ].map(({ label, value, color }, idx) => (
                <div key={label} className={`${glassCard} p-10 glow-border group/card`} style={{ transitionDelay: `${idx * 0.1}s` }}>
                  <div className={`text-[10px] font-black uppercase tracking-[0.3em] mb-6 ${muted}`}>{label}</div>
                  <div className="text-6xl font-black tracking-tighter" style={{ color, filter: `drop-shadow(0 0 20px ${color}44)` }}>{loading ? '...' : value}</div>
                  <div className="absolute inset-0 shimmer opacity-0 group-hover/card:opacity-100 transition-opacity duration-1000" />
                </div>
              ))}
            </div>

            <div className={`${glassCard} glow-border group/card stagger-2`}>
              <div className="p-12 border-b border-white/5 flex flex-wrap gap-10 justify-between items-center bg-white/[0.01]">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black tracking-tight uppercase" style={{ fontFamily: "'Syne', sans-serif" }}>GENERATED ARCHIVE</h2>
                  <p className="text-[10px] font-black text-[#7c3aed] tracking-[0.4em] uppercase">v3.0 Secure Storage</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="relative group/search">
                    <input type="text" placeholder="Search data..." value={search} onChange={e => setSearch(e.target.value)} className={`${inputCls} w-80 !pl-16`} />
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/search:text-[#7c3aed] transition-colors"><Icon.Search /></div>
                  </div>
                  <button 
                    onClick={deleteAllClips} 
                    className="h-14 px-8 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-rose-500 hover:text-white transition-all duration-700 active:scale-90"
                  >
                    Clear Terminal
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

            <div className="grid lg:grid-cols-2 gap-10 pb-20 stagger-3">
              {/* Suspicious Logs */}
              <div className={`${glassCard} flex flex-col glow-border group/card !border-rose-500/10`}>
                <div className="p-10 border-b border-white/5 flex justify-between items-center bg-rose-500/[0.02]">
                  <div>
                    <h2 className="text-xl font-black tracking-tight uppercase" style={{ fontFamily: "'Syne', sans-serif" }}>THREAT DETECTION</h2>
                    <p className={`text-[10px] font-bold tracking-widest ${muted}`}>Unauthorized Access Attempts</p>
                  </div>
                  <button onClick={clearSuspiciousLogs} className="text-[10px] font-black text-rose-400 hover:text-rose-300 transition-colors uppercase tracking-widest bg-rose-500/10 px-4 py-2 rounded-xl">Purge Logs</button>
                </div>
                <div className="flex-1 overflow-auto max-h-[400px] custom-scrollbar">
                  <table className="w-full text-left">
                    <tbody className="divide-y border-white/5">
                      {suspiciousLogs.length === 0 ? (
                        <tr><td className={`py-16 text-center text-xs font-bold italic ${muted}`}>Scanning for threats... No anomalies found.</td></tr>
                      ) : (
                        suspiciousLogs.map((log, i) => (
                          <tr key={i} className="hover:bg-rose-500/[0.05] transition-colors">
                            <td className="py-6 px-10">
                              <div className="text-sm font-black text-rose-400 tracking-tight">{log.channel_id}</div>
                              <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">{log.ip} · {new Date(log.created_at).toLocaleTimeString()}</div>
                            </td>
                            <td className="py-6 px-10 text-right">
                              <button onClick={() => blockIp(log.ip, 'Suspicious access attempt')} className="text-[10px] font-black bg-rose-500 text-white px-5 py-2.5 rounded-xl shadow-[0_10px_30px_rgba(244,63,94,0.3)] hover:scale-105 transition-all uppercase tracking-widest">ISOLATE IP</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Firewall / Blocked IPs */}
              <div className={`${glassCard} flex flex-col glow-border group/card !border-cyan-500/10`}>
                <div className="p-10 border-b border-white/5 bg-cyan-500/[0.02]">
                  <h2 className="text-xl font-black tracking-tight uppercase" style={{ fontFamily: "'Syne', sans-serif" }}>ACTIVE FIREWALL</h2>
                  <p className={`text-[10px] font-bold tracking-widest ${muted}`}>Restricted Access Protocols</p>
                </div>
                <div className="flex-1 overflow-auto max-h-[400px] custom-scrollbar">
                  <table className="w-full text-left">
                    <tbody className="divide-y border-white/5">
                      {blockedIps.length === 0 ? (
                        <tr><td className={`py-16 text-center text-xs font-bold italic ${muted}`}>Firewall integrity verified. No blocks.</td></tr>
                      ) : (
                        blockedIps.map((b, i) => (
                          <tr key={i} className="hover:bg-cyan-500/[0.05] transition-colors">
                            <td className="py-6 px-10">
                              <div className="text-sm font-mono font-black text-cyan-400">{b.ip}</div>
                              <div className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-black mt-1">{b.reason || 'PERMANENT BAN'}</div>
                            </td>
                            <td className="py-6 px-10 text-right">
                              <button onClick={async () => { await axios.delete(`/api/channels/blacklist/${b.ip}`); fetchData(); }} className="text-[10px] font-black text-cyan-400 bg-cyan-400/10 px-5 py-2.5 rounded-xl border border-cyan-400/20 hover:bg-cyan-400 hover:text-black transition-all uppercase tracking-widest">DE-RESTRICT</button>
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
          <div className="space-y-12 max-w-5xl mx-auto stagger-1">
             <div className={`${glassCard} p-12 glow-border group/card`}>
                <div className="flex justify-between items-center mb-10">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black tracking-tight uppercase" style={{ fontFamily: "'Syne', sans-serif" }}>AUTHORIZE ENGINE</h2>
                    <p className="text-[10px] font-black text-cyan-400 tracking-[0.4em] uppercase">Add New Clipping Nodes</p>
                  </div>
                  <button onClick={testWebhook} className="text-[10px] font-black px-6 py-3 rounded-2xl border border-white/10 hover:bg-white/5 transition-all uppercase tracking-widest bg-white/[0.02]">
                    Test Webhook
                  </button>
                </div>
                <div className="flex flex-col md:flex-row gap-6">
                  <input type="text" placeholder="Friendly Name (e.g. My Channel)" value={newChannelName} onChange={e => setNewChannelName(e.target.value)} className={inputCls + " flex-1"} />
                  <input type="text" placeholder="YouTube Link / Channel ID" value={newChannelUrl} onChange={e => setNewChannelUrl(e.target.value)} className={inputCls + " flex-1"} />
                  <button onClick={addChannel} className={accentBtn}>
                    <Icon.Plus /> AUTHORIZE NODE
                  </button>
                </div>
             </div>
             
             <div className="grid md:grid-cols-2 gap-10">
                {channels.map((ch, idx) => (
                  <div key={ch.channel_id} className={`${glassCard} p-12 glow-border group/card flex flex-col relative overflow-hidden`} style={{ transitionDelay: `${idx * 0.1}s` }}>
                    <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/5 blur-[100px] -mr-24 -mt-24 group-hover/card:bg-violet-500/15 transition-all duration-1000" />
                    
                    <div className="flex justify-between mb-10 relative z-10">
                      <div className="w-20 h-20 rounded-[2.5rem] bg-gradient-to-br from-[#7c3aed]/20 to-transparent flex items-center justify-center text-[#7c3aed] border border-[#7c3aed]/20 shadow-[0_0_30px_rgba(124,58,237,0.1)] group-hover/card:scale-110 transition-transform duration-700">
                        <Icon.Channel />
                      </div>
                      <button onClick={() => deleteChannel(ch.channel_id)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-rose-500/20 text-rose-500/20 hover:text-rose-500 transition-all duration-500"><Icon.Trash /></button>
                    </div>
                    
                    <h3 className="text-3xl font-black tracking-tighter mb-2 uppercase" style={{ fontFamily: "'Syne', sans-serif" }}>{ch.title}</h3>
                    <p className="text-[10px] font-black text-white/10 tracking-[0.4em] uppercase mb-12">{ch.channel_id}</p>
                    
                    {/* Whitelist Section */}
                    <div className="flex-1 space-y-8 relative z-10">
                      <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Authorized Crew</h4>
                        <span className="text-[10px] font-black text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-lg border border-cyan-400/20">{ch.allowed_users?.length || 0}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4 max-h-64 overflow-y-auto pr-4 custom-scrollbar">
                        {ch.allowed_users?.length === 0 ? (
                          <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
                            <p className="text-[11px] text-white/10 font-black italic uppercase tracking-widest">Standalone Mode Active</p>
                          </div>
                        ) : (
                          ch.allowed_users.map(u => (
                            <div key={u.username} className={premiumBadge + " group/badge"}>
                              <div className="relative">
                                {u.thumbnail ? (
                                  <img src={u.thumbnail} alt={u.username} className="w-12 h-12 rounded-[1.25rem] object-cover border border-white/10" />
                                ) : (
                                  <div className="w-12 h-12 rounded-[1.25rem] bg-white/5 flex items-center justify-center text-sm font-black text-white/20 border border-white/10">{u.username.charAt(0).toUpperCase()}</div>
                                )}
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-cyan-400 border-4 border-[#03000a] rounded-full shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
                              </div>
                              <div className="flex flex-col flex-1 truncate">
                                <span className="text-sm font-black text-white/90 truncate tracking-tight">{u.username}</span>
                                {u.handle && <span className="text-[10px] font-black text-cyan-400/40 tracking-wider truncate uppercase">{u.handle}</span>}
                              </div>
                              <button 
                                onClick={async () => { 
                                  await axios.delete(`/api/channels/${ch.channel_id}/allowed-users/${encodeURIComponent(u.username)}`); 
                                  fetchData(); 
                                }} 
                                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center opacity-0 group-hover/badge:opacity-100 hover:bg-rose-500/20 text-rose-500 transition-all duration-500"
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
                          className={inputCls + " w-full !pl-16 shadow-inner"} 
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
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-[#7c3aed] transition-colors"><Icon.Plus /></div>
                      </div>
                    </div>

                    <div className="mt-12 pt-12 border-t border-white/5 flex justify-between items-center relative z-10">
                       <button onClick={() => setSetupModal(ch)} className="text-[10px] font-black text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-[0.3em] flex items-center gap-3">
                         <Icon.Bot /> Setup Guide
                       </button>
                       <button onClick={() => toggleChannel(ch.channel_id)} className={`text-[10px] font-black px-8 py-4 rounded-[1.5rem] border transition-all duration-700 uppercase tracking-[0.3em] relative overflow-hidden ${ch.active ? 'text-cyan-400 bg-cyan-400/5 border-cyan-400/20 shadow-[0_0_30px_rgba(34,211,238,0.1)]' : 'text-rose-400 bg-rose-400/5 border-rose-400/20'}`}>
                         {ch.active && <div className="pulse-ring" />}
                         {ch.active ? 'System Active' : 'Offline'}
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