import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';

const SecondaryPasswordForm = () => {
  const [isSet, setIsSet] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const checkStatus = async () => {
    try {
      const res = await api.get('/api/auth/check-secondary');
      setIsSet(res.data.isSet);
    } catch (err) {
      console.error('Failed to check secondary pass status');
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setMessage({ type: 'error', text: 'Passwords do not match' });
    }

    setLoading(true);
    setMessage(null);

    try {
      await api.post('/api/auth/secondary-password/set', {
        currentPassword: isSet ? currentPassword : null,
        newPassword
      });
      setMessage({ type: 'success', text: isSet ? 'Security Password Updated' : 'Security Password Established' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      checkStatus();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Operation failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h3 className="text-lg font-black tracking-tight text-white/60 uppercase" style={{ fontFamily: "'Syne', sans-serif" }}>
          {isSet ? 'UPDATE SECURITY KEY' : 'ESTABLISH SECURITY KEY'}
        </h3>
        <p className="text-[9px] font-black text-[#7c3aed] tracking-[0.3em] uppercase">
          Required for critical system actions
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
        {isSet && (
          <div className="space-y-2">
            <label className="text-[8px] font-black text-white/20 uppercase tracking-widest ml-4">Current Security Password</label>
            <input 
              type="password"
              className="w-full bg-white/[0.02] border border-white/5 text-white placeholder-white/10 rounded-2xl px-6 py-4 text-xs font-black tracking-widest focus:outline-none focus:border-[#7c3aed] transition-all"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[8px] font-black text-white/20 uppercase tracking-widest ml-4">{isSet ? 'New Security Password' : 'New Security Password'}</label>
          <input 
            type="password"
            className="w-full bg-white/[0.02] border border-white/5 text-white placeholder-white/10 rounded-2xl px-6 py-4 text-xs font-black tracking-widest focus:outline-none focus:border-[#7c3aed] transition-all"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-[8px] font-black text-white/20 uppercase tracking-widest ml-4">Confirm Security Password</label>
          <input 
            type="password"
            className="w-full bg-white/[0.02] border border-white/5 text-white placeholder-white/10 rounded-2xl px-6 py-4 text-xs font-black tracking-widest focus:outline-none focus:border-[#7c3aed] transition-all"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        {message && (
          <div className={`p-4 rounded-xl border text-[9px] font-black uppercase tracking-widest ${
            message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            {message.text}
          </div>
        )}

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-br from-[#7c3aed] to-[#4c1d95] text-white text-[10px] font-black uppercase tracking-[0.2em] px-8 py-5 rounded-2xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
        >
          {loading ? 'PROCESSING...' : (isSet ? 'UPDATE SECURITY KEY' : 'SAVE SECURITY KEY')}
        </button>
      </form>
    </div>
  );
};

export default SecondaryPasswordForm;
