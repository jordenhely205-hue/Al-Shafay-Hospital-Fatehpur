import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { testSpeechAnnouncement } from '../utils/speech';
import { 
  Building2, 
  Activity, 
  Volume2, 
  VolumeX, 
  Wifi, 
  WifiOff, 
  Bell, 
  LogOut,
  Calendar,
  Search
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { connected, enableAudio, setEnableAudio } = useSocket();
  const location = useLocation();

  const navLinks = [
    { name: 'Reception', path: '/reception' },
    { name: 'Doctor EMR', path: '/doctor' },
    { name: 'Waiting Area TV', path: '/screen' },
    { name: 'Lab Portal', path: '/lab' },
    { name: 'Pharmacy POS', path: '/pharmacy' },
    { name: 'Admin Overview', path: '/admin' },
    { name: 'Online Booking', path: '/book' },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Hospital Branding */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition">
              <Building2 className="text-white" size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg md:text-xl tracking-tight text-white uppercase group-hover:text-teal-300 transition">
                  Al-Shafay Hospital
                </span>
                <span className="bg-teal-500/20 text-teal-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-500/30 uppercase">
                  Fatehpur
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Hospital Management & Queue System</p>
            </div>
          </Link>

          {/* Department Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive 
                      ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Utilities: Audio Toggle, WebSocket Status, User Badge */}
          <div className="flex items-center gap-3">
            
            {/* Audio Toggle & Test Voice Button */}
            <div className="flex items-center bg-slate-800/80 rounded-xl p-1 border border-slate-700">
              <button
                onClick={() => setEnableAudio(!enableAudio)}
                title={enableAudio ? "Audio Announcements Enabled (Click to Mute)" : "Audio Muted (Click to Enable)"}
                className={`p-1.5 rounded-lg transition ${
                  enableAudio 
                    ? 'text-teal-400 hover:bg-teal-500/20' 
                    : 'text-slate-500 hover:bg-slate-700'
                }`}
              >
                {enableAudio ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button
                onClick={testSpeechAnnouncement}
                title="Test Token Voice Announcement"
                className="text-[11px] font-medium text-slate-300 hover:text-teal-300 px-2 py-1 hover:bg-slate-700/50 rounded-lg transition"
              >
                Test Voice
              </button>
            </div>

            {/* WebSocket Connection Status */}
            <div 
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                connected 
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' 
                  : 'bg-rose-950/80 text-rose-300 border-rose-800'
              }`}
              title={connected ? "Real-time sync active" : "Reconnecting to server..."}
            >
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
              <span className="hidden sm:inline">{connected ? 'Live Sync' : 'Offline'}</span>
            </div>

            {/* Current User Role Pill */}
            {user && (
              <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 pl-3 pr-2 py-1 rounded-xl">
                <div className="text-right">
                  <p className="text-xs font-bold text-white truncate max-w-[120px]">{user.name || user.username}</p>
                  <p className="text-[10px] text-teal-400 font-semibold uppercase">{user.role?.replace('_', ' ')}</p>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="text-slate-400 hover:text-rose-400 p-1 hover:bg-slate-700 rounded-lg transition"
                >
                  <LogOut size={14} />
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
