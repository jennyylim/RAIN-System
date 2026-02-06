
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../services/store';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); // Kept for UI, but API in this task focuses on Email/RBAC
  const [role, setRole] = useState<'PowerIT' | 'HR Admin' | 'ITBAU' | 'End User'>('PowerIT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        // Call the new Backend API
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: username }) // Mapping username input to email for RBAC check
        });

        const data = await response.json();

        if (data.success) {
            // Save session locally for frontend checks (keeping existing AuthService structure)
            const mappedUser = {
                username: data.user.email,
                name: data.user.name,
                role: data.user.role, // "PowerIT", "HR Admin", etc.
                department: data.user.department,
                id: data.user.id
            };
            localStorage.setItem('itam_session', JSON.stringify(mappedUser));
            
            navigate(data.redirectUrl);
        } else {
            setError(data.message || 'Login Failed');
        }
    } catch (err) {
        console.error(err);
        setError('Network Error: Could not connect to RAIN Server.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row border border-slate-800/50">
        
        {/* Left Side - RAIN Hero */}
        <div className="w-full md:w-5/12 bg-[#0d9488] p-12 text-white flex flex-col justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-slate-900 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="mb-10 group">
                <img src="rain_1.png" alt="RAIN Logo" className="w-48 drop-shadow-2xl" />
            </div>
            
            <div className="h-1.5 w-16 bg-white/20 rounded-full mb-10"></div>
            
            <div className="space-y-4">
                <h1 className="text-4xl font-black tracking-tighter italic">RAIN</h1>
                <p className="text-teal-100 font-bold tracking-widest uppercase text-[10px] leading-relaxed">
                    Resource Asset Inventory Network<br/>Connected to Azure SQL
                </p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-7/12 p-12 md:p-16 flex flex-col justify-center bg-slate-50/50">
          <div className="mb-10">
             <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">Login</h2>
             <p className="text-slate-400 font-medium text-sm">Enter your organizational email to access RAIN.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">
                  Email Address
              </label>
              <div className="relative">
                <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                <input type="email" required 
                  className="w-full pl-12 pr-4 py-4 border border-slate-200 bg-white rounded-2xl focus:ring-4 focus:ring-teal-100 focus:border-teal-500 outline-none transition-all font-bold text-slate-700 shadow-sm"
                  placeholder="name@rain.com"
                  value={username} onChange={e => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Password</label>
              <div className="relative">
                <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                <input type="password" 
                  className="w-full pl-12 pr-4 py-4 border border-slate-200 bg-white rounded-2xl focus:ring-4 focus:ring-teal-100 focus:border-teal-500 outline-none transition-all font-bold text-slate-700 shadow-sm"
                  placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>
            
            {error && (
                <div className="p-4 bg-red-50 text-red-600 text-xs font-black rounded-2xl border border-red-100 flex items-center gap-3 animate-[shake_0.4s_ease-in-out]">
                    <i className="fa-solid fa-triangle-exclamation text-lg"></i> {error}
                </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-teal-600/20 active:scale-[0.98] uppercase tracking-[0.2em] flex justify-center items-center gap-2">
                {loading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : 'Authenticate'}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-slate-200/50 text-[10px] text-slate-400 text-center font-mono">
             <div className="flex flex-col gap-2 opacity-50 hover:opacity-100 transition-opacity">
                <p>Available Test Accounts:</p>
                <p>powerit@rain.com | hr.admin@rain.com</p>
                <p>it.bau@rain.com | cynthia.m@rain.com</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
