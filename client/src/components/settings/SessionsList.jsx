import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { formatDistanceToNow } from 'date-fns';

const SessionsList = ({ onLogoutRequested }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/api/auth/sessions');
      setSessions(res.data);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  if (loading) return <div className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] py-10">Loading active links...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-black tracking-tight text-white/60 uppercase" style={{ fontFamily: "'Syne', sans-serif" }}>ACTIVE TERMINALS</h3>
        <button 
          onClick={() => onLogoutRequested('all')}
          className="text-[8px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-400 transition-colors"
        >
          Terminate All Others
        </button>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-white/5 bg-white/[0.01]">
        <table className="w-full text-left">
          <thead className="bg-white/5">
            <tr>
              <th className="py-4 px-6 text-[9px] font-black uppercase tracking-widest text-white/30">Device Info</th>
              <th className="py-4 px-6 text-[9px] font-black uppercase tracking-widest text-white/30">IP Address</th>
              <th className="py-4 px-6 text-[9px] font-black uppercase tracking-widest text-white/30 text-right">Activity</th>
            </tr>
          </thead>
          <tbody className="divide-y border-white/5">
            {sessions.map((s) => (
              <tr key={s.id} className={`group/row transition-colors ${s.isCurrent ? 'bg-[#7c3aed]/5' : 'hover:bg-white/[0.02]'}`}>
                <td className="py-5 px-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${s.isCurrent ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-white/10'}`} />
                    <div>
                      <div className="text-xs font-black text-white uppercase tracking-tight">{s.deviceInfo}</div>
                      <div className="text-[8px] text-white/20 font-black uppercase tracking-[0.2em] mt-0.5">
                        Established {new Date(s.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-5 px-6 text-[10px] font-bold text-white/40 font-mono">{s.ipAddress}</td>
                <td className="py-5 px-6 text-right">
                  {s.isCurrent ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">Active Now</span>
                  ) : (
                    <button 
                      onClick={() => onLogoutRequested(s.id)}
                      className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[8px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover/row:opacity-100"
                    >
                      Terminate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SessionsList;
