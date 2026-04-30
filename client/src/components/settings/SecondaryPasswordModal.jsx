import React, { useState } from 'react';
import api from '../../api/axiosInstance';

const SecondaryPasswordModal = ({ isOpen, onClose, onSuccess, targetId }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Verify secondary password and get a short-lived token
      const verifyRes = await api.post('/api/auth/secondary-password/verify', { password });
      const { secondaryToken } = verifyRes.data;

      // 2. Perform the actual logout action
      const endpoint = targetId === 'all' ? '/api/auth/sessions' : `/api/auth/sessions/${targetId}`;
      await api.delete(endpoint, {
        headers: { 'x-secondary-token': secondaryToken }
      });

      onSuccess();
      onClose();
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#03000a]/90 backdrop-blur-md">
      <div className="bg-white/[0.01] backdrop-blur-[80px] border border-white/5 rounded-[2rem] w-full max-w-md p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-600/10 blur-[60px] -mr-16 -mt-16" />
        
        <div className="relative z-10 space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-black text-white tracking-tighter uppercase" style={{ fontFamily: "'Syne', sans-serif" }}>SECURITY VERIFICATION</h3>
            <p className="text-rose-400 font-black text-[9px] tracking-[0.3em] uppercase">Enter Security Password to Proceed</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              type="password"
              placeholder="SECURITY PASSWORD"
              className="w-full bg-white/[0.02] border border-white/5 text-white placeholder-white/10 rounded-2xl px-6 py-4 text-xs font-black tracking-widest focus:outline-none focus:border-rose-500 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
            
            {error && <div className="text-rose-500 text-[9px] font-black uppercase tracking-widest bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">{error}</div>}

            <div className="flex gap-4 pt-2">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-1 px-6 py-4 rounded-2xl border border-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-[0.2em] px-8 py-4 rounded-2xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                {loading ? 'VERIFYING...' : 'CONFIRM'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SecondaryPasswordModal;
