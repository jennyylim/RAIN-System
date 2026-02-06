
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthService } from '../services/store';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = AuthService.getCurrentUser();

  const handleLogout = () => {
    AuthService.logout();
    navigate('/login');
  };

  if (!user) {
      setTimeout(() => navigate('/login'), 0);
      return null;
  }

  const isPower = user.role === 'PowerIT';

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar - Hidden on Print */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl fixed h-full z-10 border-r border-slate-800 print:hidden">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center overflow-hidden border border-teal-500/20 relative group">
            <img 
              src="rain_1.png" 
              alt="RAIN" 
              className="w-8 h-8 object-contain relative z-10" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
              }}
            />
            <i className="fa-solid fa-cloud-showers-heavy text-teal-500 text-xl hidden fallback-icon"></i>
          </div>
          <div>
            <span className="text-xl font-black tracking-tighter block text-white leading-none italic">RAIN</span>
            <span className="text-[9px] text-teal-500 uppercase tracking-[0.1em] font-black mt-1 block">Request Automation</span>
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {(user.role === 'HR' || isPower) && (
             <>
             <button
                onClick={() => navigate('/hr')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  location.pathname === '/hr' ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/40 translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <i className={`fa-solid fa-users-gear w-5 text-center text-sm ${location.pathname === '/hr' ? 'text-white' : 'text-teal-500/60'}`}></i>
                <span className="font-bold text-sm">Personnel Hub</span>
              </button>
              
               {/* Staff Admin moved for HR/PowerIT */}
               <button
                  onClick={() => navigate('/admin/users')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  location.pathname === '/admin/users' ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/40 translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <i className={`fa-solid fa-user-shield w-5 text-center text-sm ${location.pathname === '/admin/users' ? 'text-white' : 'text-purple-500/60'}`}></i>
                  <span className="font-bold text-sm">Staff Administration</span>
                </button>
             </>
          )}

          {(user.role === 'IT' || isPower) && (
              <>
                <button
                    onClick={() => navigate('/it')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    location.pathname === '/it' ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/40 translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                >
                    <i className={`fa-solid fa-microchip w-5 text-center text-sm ${location.pathname === '/it' ? 'text-white' : 'text-teal-500/60'}`}></i>
                    <span className="font-bold text-sm">Fleet Control</span>
                </button>
                 <button
                    onClick={() => navigate('/it/returns')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    location.pathname === '/it/returns' ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/40 translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                >
                    <i className={`fa-solid fa-box-archive w-5 text-center text-sm ${location.pathname === '/it/returns' ? 'text-white' : 'text-teal-500/60'}`}></i>
                    <span className="font-bold text-sm">Returns Desk</span>
                </button>
                <button
                    onClick={() => navigate('/it/database')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    location.pathname === '/it/database' ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/40 translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                >
                    <i className={`fa-solid fa-database w-5 text-center text-sm ${location.pathname === '/it/database' ? 'text-white' : 'text-teal-500/60'}`}></i>
                    <span className="font-bold text-sm">DB Ledger</span>
                </button>
                <button
                  onClick={() => navigate('/it/reports')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  location.pathname === '/it/reports' ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/40 translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <i className={`fa-solid fa-file-invoice-dollar w-5 text-center text-sm ${location.pathname === '/it/reports' ? 'text-white' : 'text-amber-500/60'}`}></i>
                  <span className="font-bold text-sm">Reporting Hub</span>
                </button>
              </>
          )}

          {isPower && (
             <div className="pt-4 mt-4 border-t border-slate-800">
               <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">System Config</p>
                
               <button
                  onClick={() => navigate('/admin/witness')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  location.pathname === '/admin/witness' ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/40 translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <i className={`fa-solid fa-glasses w-5 text-center text-sm ${location.pathname === '/admin/witness' ? 'text-white' : 'text-blue-500/60'}`}></i>
                  <span className="font-bold text-sm">Deploy-Engineer</span>
                </button>

                <button
                  onClick={() => navigate('/admin/architecture')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  location.pathname === '/admin/architecture' ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/40 translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <i className={`fa-solid fa-project-diagram w-5 text-center text-sm ${location.pathname === '/admin/architecture' ? 'text-white' : 'text-cyan-500/60'}`}></i>
                  <span className="font-bold text-sm">Architecture Map</span>
                </button>
                
               <div className="mt-2">
                 <button
                    onClick={() => navigate('/employee')}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all group"
                  >
                    <i className="fa-solid fa-user-tie w-5 text-center text-sm text-amber-500/60 group-hover:text-amber-400"></i>
                    <span className="font-bold text-sm">Staff Portal (Sim)</span>
                  </button>
               </div>
             </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
           <div className="flex items-center gap-3 px-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-sm font-black ring-2 ring-slate-800 shadow-lg text-white uppercase">
                  {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                  <p className="text-sm font-black truncate text-slate-100">{user.name}</p>
                  <p className="text-[10px] text-teal-500 font-mono truncate uppercase font-bold tracking-widest">{user.role}</p>
              </div>
           </div>
           <button onClick={handleLogout} className="w-full py-2.5 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:bg-red-600/10 hover:border-red-600/30 text-[10px] font-black tracking-widest transition-all uppercase">
             <i className="fa-solid fa-xmark mr-2"></i> Close
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen custom-scrollbar print:ml-0 print:p-0 print:overflow-visible">
        <div className="max-w-7xl mx-auto print:max-w-none print:w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
