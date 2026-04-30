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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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
      const interval = setInterval(() => {
        fetchData();
      }, 10000);
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

  const [isAdding, setIsAdding] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e) => {
      setMousePos({ x: (e.clientX / window.innerWidth - 0.5) * 40, y: (e.clientY / window.innerHeight - 0.5) * 40 });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  const addChannel = async () => {
    if (!newChannelUrl.trim()) return;
    setIsAdding(true);
    try {
      await axios.post('/api/channels', { 
        url: newChannelUrl,
        title: newChannelName 
      });
      fetchData();
      setNewChannelUrl('');
      setNewChannelName('');
      alert('Channel Authorized Successfully');
    } catch (err) { 
      console.error(err); 
      alert(`Failed to add channel: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsAdding(false);
    }
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
    window.location.reload();
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const bg = 'min-h-screen bg-[#03000a] text-white selection:bg-[#7c3aed]/30 relative overflow-hidden';
  const glassCard = 'bg-white/[0.01] backdrop-blur-[80px] border border-white/5 rounded-[2rem] transition-all duration-700 hover:border-[#7c3aed]/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)] hover:shadow-[0_30px_70px_rgba(124,58,237,0.1)] hover:-translate-y-1.5 group/card relative overflow-hidden';
  const muted = 'text-white/20';
  const inputCls = 'bg-white/[0.02] border border-white/5 text-white placeholder-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-[#7c3aed] focus:ring-8 focus:ring-[#7c3aed]/5 transition-all duration-700 hover:bg-white/[0.04]';
  const accentBtn = 'bg-gradient-to-br from-[#7c3aed] via-[#6d28d9] to-[#4c1d95] hover:shadow-[0_20px_40px_rgba(124,58,237,0.4)] text-white text-[10px] font-black tracking-[0.3em] px-8 py-4 rounded-2xl transition-all duration-700 flex items-center gap-2 cursor-pointer active:scale-90 border border-white/10 uppercase relative overflow-hidden group/btn';
  const premiumBadge = 'bg-gradient-to-br from-[#7c3aed]/10 to-transparent border border-white/5 rounded-3xl p-4 flex items-center gap-4 transition-all duration-700 hover:border-[#7c3aed]/40 hover:bg-[#7c3aed]/20 group/badge relative overflow-hidden';

  const tabCls = (t) =>
    `px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all duration-700 cursor-pointer flex items-center gap-3 relative overflow-hidden ${
      activeTab === t
        ? 'bg-[#7c3aed]/20 text-white shadow-[0_0_30px_rgba(124,58,237,0.2)] scale-105 border border-[#7c3aed]/40 after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-gradient-to-r after:from-cyan-400 after:via-fuchsia-500 after:to-violet-600'
        : 'text-white/20 hover:text-white/60 hover:bg-white/5'
    }`;

  const [showLoginModal, setShowLoginModal] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="bg-[#020005] text-white selection:bg-[#7c3aed]/30 relative overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@800&display=swap');
          @keyframes drift { 0% { transform: translate(0, 0); } 50% { transform: translate(30px, 30px); } 100% { transform: translate(0, 0); } }
          .bg-glow { position: absolute; width: 800px; height: 800px; border-radius: 50%; background: radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%); filter: blur(120px); animation: drift 15s infinite; }
          .modal-enter { animation: modalIn 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
          @keyframes modalIn { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
          .hero-gradient { background: linear-gradient(to bottom, #7c3aed, #22d3ee); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .scanline { width: 100%; height: 2px; background: rgba(34, 211, 238, 0.1); position: absolute; top: 0; left: 0; animation: scan 8s linear infinite; pointer-events: none; }
          @keyframes scan { from { top: 0; } to { top: 100%; } }
        `}</style>
        
        <div className="scanline" />
        <div className="bg-glow -top-64 -left-64" />
        <div className="bg-glow -bottom-64 -right-64" style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.05) 0%, transparent 70%)' }} />

        <div className="max-w-7xl mx-auto px-10 py-4 space-y-2 relative z-10">
          {/* Header */}
          <nav className="flex justify-between items-center">
            <div className="flex items-center gap-5 group cursor-pointer" onClick={() => window.location.reload()}>
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:border-[#7c3aed]/50 transition-all duration-500">
                <Icon.Clip size={32} />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tighter uppercase block leading-none" style={{ fontFamily: "'Syne', sans-serif" }}>PP CLIPPER</span>
                <span className="text-[8px] font-black text-cyan-400 tracking-[0.4em] uppercase mt-1.5 block opacity-60">Global Access Node v4.0</span>
              </div>
            </div>
            <button 
              onClick={() => setShowLoginModal(true)}
              className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#7c3aed] hover:text-white transition-all shadow-xl active:scale-95"
            >
              Staff Portal
            </button>
          </nav>

          {/* Hero Section */}
          <div className="text-center space-y-6 py-2 stagger-1">
             <div className="space-y-2">
                <div className="inline-block px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[9px] font-black uppercase tracking-[0.3em] text-violet-400 mb-2">Real-Time Capture Active</div>
                <h1 className="text-7xl font-black uppercase tracking-tighter leading-[0.9]" style={{ fontFamily: "'Syne', sans-serif" }}>
                  COMMAND <span className="hero-gradient">THE FEED</span>
                </h1>
                <p className="text-sm font-medium text-white/30 tracking-[0.2em] uppercase max-w-2xl mx-auto leading-relaxed">
                  The ultimate community-driven archive engine. Instantly capturing the most legendary moments from live streams across the globe.
                </p>
             </div>
             
             {/* System Status Nodes */}
             <div className="flex flex-wrap justify-center gap-6">
                {[
                  { label: 'Network', value: 'Online', color: 'text-emerald-400' },
                  { label: 'Uptime', value: '99.9%', color: 'text-cyan-400' },
                  { label: 'Latency', value: '14ms', color: 'text-violet-400' },
                  { label: 'Nodes', value: 'Global', color: 'text-fuchsia-400' }
                ].map((node, i) => (
                  <div key={i} className="px-6 py-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center gap-1 min-w-[140px]">
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">{node.label}</span>
                    <span className={`text-xs font-black uppercase tracking-widest ${node.color}`}>{node.value}</span>
                  </div>
                ))}
             </div>
          </div>

          {/* Archive Section */}
          <div className="space-y-2 stagger-2">
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                {clips.map((clip, i) => (
                  <div key={i} className={`${glassCard} group/card p-2`}>
                    <div className="relative aspect-video rounded-[2.5rem] overflow-hidden mb-6">
                      <img src={`https://img.youtube.com/vi/${clip.video_id}/maxresdefault.jpg`} className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700" alt={clip.title} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                      <div className="absolute bottom-6 left-8 right-8">
                        <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">Clipped by @{clip.clipped_by}</div>
                        <div className="text-lg font-black text-white line-clamp-1 tracking-tight">{clip.title}</div>
                      </div>
                      <a href={clip.youtube_url} target="_blank" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all duration-500 hover:scale-110 border border-white/20">
                        <Icon.ExternalLink />
                      </a>
                    </div>
                  </div>
                ))}
                {clips.length === 0 && (
                  <div className="col-span-full py-2 flex flex-col items-center justify-center space-y-4">
                    <div className="w-24 h-24 rounded-full bg-white/[0.02] border border-dashed border-white/10 flex items-center justify-center animate-pulse">
                      <Icon.Clip size={32} className="opacity-10" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em]">Listening for transmissions...</p>
                      <p className="text-[8px] font-medium text-white/5 uppercase tracking-[0.2em]">Use !clip in chat to initiate capture</p>
                    </div>
                  </div>
                )}
             </div>
          </div>

          {/* Footer */}
          <footer className="pb-4 text-center relative z-10">
            <div className="h-px w-32 bg-white/5 mx-auto mb-4" />
            <p className="text-[10px] font-black tracking-[0.5em] text-white/40 uppercase">
              MADE BY - <span className="text-white/60 hover:text-cyan-400 transition-colors cursor-default">FIREFIST</span>
            </p>
          </footer>
        </div>

        {/* Premium Login Modal */}
        {showLoginModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#03000a]/90 backdrop-blur-md">
            <div className={`${glassCard} w-full max-w-lg p-14 modal-enter border-t-white/10 relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 blur-[100px] -mr-32 -mt-32" />
              
              <div className="flex flex-col items-center gap-8 mb-12 relative z-10">
                <div className="transition-all duration-700 hover:scale-110 active:scale-95">
                  <Icon.Clip size={72} />
                </div>
                <div className="text-center">
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase" style={{ fontFamily: "'Syne', sans-serif" }}>STAFF AUTHORIZATION</h2>
                  <p className="text-[#7c3aed] font-black text-[10px] tracking-[0.5em] uppercase mt-2">Level 3 Clearance Required</p>
                </div>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const mail = e.target.email.value;
                  const pass = e.target.password.value;
                  if (mail === 'PPClipper@admin.com' && pass === 'FIREFISTDEAD') {
                    localStorage.setItem('pp_clipper_auth', 'true');
                    setIsLoggedIn(true);
                  } else { alert('Access Denied. Check credentials.'); }
                }}
                className="space-y-8 relative z-10"
              >
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-4">Terminal Email</label>
                  <input name="email" type="email" placeholder="PPClipper@admin.com" required className="w-full bg-white/[0.03] border border-white/5 text-white rounded-[1.5rem] px-8 py-5 text-sm focus:border-[#7c3aed] focus:ring-8 focus:ring-[#7c3aed]/5 outline-none transition-all" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-4">Access Protocol Key</label>
                  <input name="password" type="password" placeholder="••••••••" required className="w-full bg-white/[0.03] border border-white/5 text-white rounded-[1.5rem] px-8 py-5 text-sm focus:border-[#7c3aed] focus:ring-8 focus:ring-[#7c3aed]/5 outline-none transition-all" />
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setShowLoginModal(false)} className="flex-1 px-8 py-5 rounded-[1.5rem] border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">Cancel</button>
                  <button type="submit" className="flex-[2] bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white font-black py-5 rounded-[1.5rem] transition-all uppercase tracking-[0.3em] text-[10px] active:scale-95 shadow-[0_20px_40px_rgba(124,58,237,0.3)]">Authorize Terminal</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
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

        .bg-blob { position: absolute; border-radius: 50%; filter: blur(150px); z-index: 0; pointer-events: none; opacity: 0.2; transition: transform 0.2s ease-out; }
        
        .shimmer { background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%); background-size: 200% 100%; animation: shimmer 3s infinite; }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

        .glow-border::after { content: ''; position: absolute; inset: -1px; background: linear-gradient(45deg, #7c3aed, #22d3ee, #d946ef, #7c3aed); border-radius: inherit; z-index: -1; opacity: 0; transition: opacity 0.5s; background-size: 400% 400%; animation: rotateGlow 5s linear infinite; }
        .group-hover\/card.glow-border::after { opacity: 0.3; }
        @keyframes rotateGlow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

        .particle { position: absolute; background: white; border-radius: 50%; opacity: 0.1; pointer-events: none; animation: floatUp 15s linear infinite; }
        @keyframes floatUp { from { transform: translateY(100vh); } to { transform: translateY(-100px); } }

        .pulse-ring { position: absolute; inset: -8px; border: 2px solid #22d3ee; border-radius: inherit; animation: pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulseRing { 0% { transform: scale(0.9); opacity: 0.8; } 100% { transform: scale(1.5); opacity: 0; } }

        .processing { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
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

      {/* Decorative Parallax Blobs */}
      <div className="bg-blob w-[1000px] h-[1000px] bg-violet-600/30 -top-96 -left-96" style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }} />
      <div className="bg-blob w-[800px] h-[800px] bg-cyan-400/20 -bottom-96 -right-96" style={{ transform: `translate(${-mousePos.x}px, ${-mousePos.y}px)` }} />
      <div className="bg-blob w-[600px] h-[600px] bg-fuchsia-500/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)` }} />

      <div className="max-w-7xl mx-auto px-10 py-12 space-y-16 relative z-10">
        <nav className="flex justify-between items-center pb-8 border-b border-white/5">
          <div className="flex items-center gap-6 group cursor-pointer" onClick={() => window.location.reload()}>
            <div className="transition-all duration-700 group-hover:scale-125 active:scale-95">
              <Icon.Clip size={56} />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tighter uppercase block leading-none" style={{ fontFamily: "'Syne', sans-serif" }}>PP CLIPPER</span>
              <span className="text-[8px] font-black text-cyan-400 tracking-[0.4em] uppercase mt-1.5 block opacity-60">Secure Cloud Node v3.0</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-[8px] font-black text-cyan-400 bg-cyan-400/5 px-4 py-2 rounded-full border border-cyan-400/20 uppercase tracking-[0.2em]">ULTRA-STABLE</div>
            <button 
              onClick={handleLogout} 
              className="px-6 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
            >
              Logout Terminal
            </button>
          </div>
        </nav>

        <div className="flex items-center gap-3 bg-white/[0.02] p-1.5 rounded-2xl border border-white/5 w-fit">
          <button className={tabCls('dashboard')} onClick={() => setActiveTab('dashboard')}><Icon.Clip /> Dashboard</button>
          <button className={tabCls('channels')} onClick={() => setActiveTab('channels')}><Icon.Channel /> Channels</button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-12 stagger-1">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Clips', value: stats?.totalClips ?? 0, color: '#a78bfa' },
                { label: 'Clips Today', value: stats?.clipsToday ?? 0, color: '#22d3ee' },
                { label: 'Blocked IPs', value: blockedIps.length, color: '#f43f5e' },
              ].map(({ label, value, color, isQuota }, idx) => (
                <div key={label} className={`${glassCard} p-8 glow-border group/card`} style={{ transitionDelay: `${idx * 0.1}s` }}>
                  <div className={`text-[9px] font-black uppercase tracking-[0.2em] mb-4 ${muted}`}>{label}</div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-4xl font-black tracking-tighter" style={{ color, filter: `drop-shadow(0 0 15px ${color}33)` }}>
                      {loading ? '...' : (isQuota ? Math.floor(value) : value)}
                    </div>
                    {isQuota && !loading && (
                      <div className="text-[10px] font-black opacity-60 uppercase tracking-widest">
                        / {stats?.youtubeApiLimit || 10000} ({((value / (stats?.youtubeApiLimit || 10000)) * 100).toFixed(2)}% used)
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 shimmer opacity-0 group-hover/card:opacity-100 transition-opacity duration-700" />
                </div>
              ))}
            </div>

            <div className={`${glassCard} glow-border group/card stagger-2`}>
              <div className="p-10 border-b border-white/5 flex flex-wrap gap-8 justify-between items-center bg-white/[0.01]">
                <div className="space-y-1">
                  <h2 className="text-xl font-black tracking-tight uppercase" style={{ fontFamily: "'Syne', sans-serif" }}>GENERATED ARCHIVE</h2>
                  <p className="text-[9px] font-black text-[#7c3aed] tracking-[0.3em] uppercase">Private Cloud Storage</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative group/search">
                    <input type="text" placeholder="Search data..." value={search} onChange={e => setSearch(e.target.value)} className={`${inputCls} w-72 !pl-14`} />
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/search:text-[#7c3aed] transition-colors"><Icon.Search /></div>
                  </div>
                  <button 
                    onClick={deleteAllClips} 
                    className="h-12 px-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-rose-500 hover:text-white transition-all duration-700 active:scale-95"
                  >
                    Clear Node
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
                  <input type="text" placeholder="Paste YouTube Channel Link or @Handle here..." value={newChannelUrl} onChange={e => setNewChannelUrl(e.target.value)} className={inputCls + " flex-[3]"} />
                  <button onClick={addChannel} disabled={isAdding} className={accentBtn + " flex-1 h-[60px]"}>
                    {isAdding ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full processing" />
                        AUTHORIZING...
                      </>
                    ) : (
                      <>
                        <Icon.Plus /> AUTHORIZE NODE
                      </>
                    )}
                  </button>
                </div>
             </div>
             
             <div className="grid md:grid-cols-2 gap-10">
                {channels.map((ch, idx) => (
                  <div key={ch.channel_id} className={`${glassCard} p-12 glow-border group/card flex flex-col relative overflow-hidden`} style={{ transitionDelay: `${idx * 0.1}s` }}>
                    <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/5 blur-[100px] -mr-24 -mt-24 group-hover/card:bg-violet-500/15 transition-all duration-1000" />
                    
                    <div className="flex justify-between mb-10 relative z-10">
                      <div className="w-20 h-20 rounded-[2.5rem] bg-gradient-to-br from-[#7c3aed]/20 to-transparent flex items-center justify-center text-[#7c3aed] border border-[#7c3aed]/20 shadow-[0_0_30px_rgba(124,58,237,0.1)] group-hover/card:scale-110 transition-transform duration-700 overflow-hidden">
                        {ch.thumbnail ? (
                          <img src={ch.thumbnail} alt={ch.title} className="w-full h-full object-cover" />
                        ) : (
                          <Icon.Channel />
                        )}
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