import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import axios from 'axios';
import { formatDistanceToNow, format } from 'date-fns';
import { UAParser } from 'ua-parser-js';

const SessionsList = ({ onLogoutRequested }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState({});
  const [now, setNow] = useState(new Date());

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
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchLocations = async () => {
      const newLocations = { ...locations };
      let changed = false;

      for (const s of sessions) {
        if (!newLocations[s.ipAddress]) {
          if (s.ipAddress === '::1' || s.ipAddress === '127.0.0.1' || s.ipAddress.includes('localhost')) {
            newLocations[s.ipAddress] = 'Local Network';
            changed = true;
          } else {
            try {
              const res = await axios.get(`http://ip-api.com/json/${s.ipAddress}`);
              if (res.data && res.data.status === 'success') {
                newLocations[s.ipAddress] = `${res.data.city}, ${res.data.country}`;
                changed = true;
              } else {
                newLocations[s.ipAddress] = 'Unknown Location';
                changed = true;
              }
            } catch (err) {
              console.error('Failed to geolocate:', s.ipAddress, err);
              newLocations[s.ipAddress] = 'Unknown Location';
              changed = true;
            }
          }
        }
      }

      if (changed) setLocations(newLocations);
    };

    if (sessions.length > 0) {
      fetchLocations();
    }
  }, [sessions]);

  const getEnhancedDeviceInfo = (session) => {
    // If we have the raw userAgent, parse it thoroughly
    if (session.userAgent) {
      const parser = new UAParser(session.userAgent);
      const ua = parser.getResult();

      let browserName = ua.browser.name || 'Unknown Browser';
      let browserVersion = ua.browser.major || ua.browser.version || '';
      let osName = ua.os.name || 'Unknown OS';
      let osVersion = ua.os.version || '';
      let deviceType = ua.device.type; // 'mobile', 'tablet', undefined
      let deviceModel = ua.device.model;

      // Override "Linux" with "Android" if it's a mobile device
      if (deviceType === 'mobile' || deviceType === 'tablet') {
        if (osName === 'Linux' || !osName || osName === 'Unknown OS') {
          osName = ua.device.vendor 
            ? `${ua.device.vendor} ${ua.device.model}` 
            : 'Android (Mobile)';
        }
      }

      const icon = (deviceType === 'mobile' || deviceType === 'tablet') ? '📱' : '🖥️';
      const displayString = `${browserName} ${browserVersion} on ${osName} ${osVersion}${deviceModel ? ` (${deviceModel})` : ''}`.trim();
      
      return { displayString, icon };
    }

    // Fallback for old sessions that only have the deviceInfo string
    const icon = session.deviceInfo.toLowerCase().includes('mobile') || session.deviceInfo.toLowerCase().includes('android') ? '📱' : '🖥️';
    return { displayString: session.deviceInfo, icon };
  };

  if (loading) return <div className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] py-10">Loading active terminals...</div>;

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

      <div className="space-y-3">
        {sessions.map((s) => {
          const { displayString, icon } = getEnhancedDeviceInfo(s);
          return (
            <div key={s.id} className={`group/row p-5 rounded-[1.5rem] border transition-all ${s.isCurrent ? 'bg-[#7c3aed]/5 border-[#7c3aed]/20 shadow-[0_0_20px_rgba(124,58,237,0.05)]' : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.02]'}`}>
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="mt-1 flex flex-col items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${s.isCurrent ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-white/10'}`} />
                    <span className="text-sm">{icon}</span>
                  </div>
                  <div>
                    <div className="text-[13px] font-black text-white uppercase tracking-tight mb-1">{displayString}</div>
                    <div className="flex items-center gap-2 text-[9px] font-bold text-white/40 uppercase tracking-widest">
                      <span>{locations[s.ipAddress] || 'Geolocating...'}</span>
                      <span className="text-white/10">•</span>
                      <span>Logged in {format(new Date(s.createdAt), 'd MMM yyyy, h:mm a')}</span>
                      <span className="text-white/10">•</span>
                      <span className={s.isCurrent ? 'text-emerald-400' : ''}>
                        {s.isCurrent ? 'Active Now' : `Active ${formatDistanceToNow(new Date(s.lastUsedAt), { addSuffix: true })}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {s.isCurrent ? (
                    <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-[0.2em] border border-emerald-500/20">CURRENT SESSION</span>
                  ) : (
                    <button 
                      onClick={() => onLogoutRequested(s.id)}
                      className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[8px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover/row:opacity-100"
                    >
                      Terminate
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SessionsList;


