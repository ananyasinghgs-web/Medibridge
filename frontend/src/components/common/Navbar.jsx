import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from './Logo';
import { 
  User, Stethoscope, Building2, LogOut, ChevronDown, 
  Sparkles, ShieldCheck, Calendar, FileText, ArrowRight 
} from 'lucide-react';

export default function Navbar() {
  const { user, role, logout, demoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  const handleDemoSwitch = async (targetRole) => {
    setDemoMenuOpen(false);
    await demoLogin(targetRole);
    if (targetRole === 'patient') navigate('/patient');
    if (targetRole === 'doctor') navigate('/doctor');
    if (targetRole === 'admin') navigate('/admin');
  };

  const getRoleBadge = (r) => {
    if (r === 'patient') return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">Patient Portal</span>;
    if (r === 'doctor') return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">Doctor Portal</span>;
    if (r === 'admin') return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-teal-300 border border-slate-700">Admin Command</span>;
    return null;
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center">
              <Logo height={36} />
            </Link>

            {/* In-app navigation when logged in */}
            {user && (
              <div className="hidden md:flex items-center space-x-1">
                {role === 'patient' && (
                  <>
                    <Link to="/patient" className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${location.pathname === '/patient' ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:text-slate-900'}`}>
                      My Health Dashboard
                    </Link>
                  </>
                )}
                {role === 'doctor' && (
                  <>
                    <Link to="/doctor" className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${location.pathname === '/doctor' ? 'bg-blue-50 text-blue-800' : 'text-slate-600 hover:text-slate-900'}`}>
                      Clinical Studio
                    </Link>
                  </>
                )}
                {role === 'admin' && (
                  <>
                    <Link to="/admin" className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${location.pathname === '/admin' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>
                      Hospital Command
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right side tools */}
          <div className="flex items-center space-x-3">
            {/* Quick Demo Role Switcher Pill */}
            <div className="relative">
              <button 
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition"
                title="Instant switch between synthetic test roles"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Demo Switcher</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {demoMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-slate-200 py-1.5 z-50 text-left">
                  <div className="px-3 py-1.5 border-b border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Instant Synthetic Sign-in</p>
                  </div>
                  <button 
                    onClick={() => handleDemoSwitch('patient')}
                    className="w-full flex items-center px-3 py-2 text-xs font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-800 transition"
                  >
                    <User className="w-4 h-4 mr-2 text-teal-600" />
                    <span>Sarah Jenkins (Patient)</span>
                  </button>
                  <button 
                    onClick={() => handleDemoSwitch('doctor')}
                    className="w-full flex items-center px-3 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-800 transition"
                  >
                    <Stethoscope className="w-4 h-4 mr-2 text-blue-600" />
                    <span>Dr. Robert Vance (Doctor)</span>
                  </button>
                  <button 
                    onClick={() => handleDemoSwitch('admin')}
                    className="w-full flex items-center px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
                  >
                    <Building2 className="w-4 h-4 mr-2 text-slate-700" />
                    <span>Elena Rostova (Admin)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Auth status */}
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-900">{user.full_name}</span>
                  <div className="flex justify-end">{getRoleBadge(role)}</div>
                </div>
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-xs transition"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

