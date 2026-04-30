import React from 'react';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#03000a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-violet-500/20 border-t-violet-500 rounded-full processing" />
          <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Verifying Authorization...</div>
        </div>
      </div>
    );
  }

  // If no user, the App component already handles showing the login screen.
  // But for a true PrivateRoute component used in a Router, we would redirect.
  // In this project, everything is in App.jsx, so we'll just return children if auth is valid.
  return user ? children : null;
};

export default PrivateRoute;
