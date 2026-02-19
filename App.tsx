
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HouseConnectionRecord, User, ActivityLog } from './types';
import { STORAGE_KEY } from './constants';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import MainTable from './components/MainTable';
import BOQManager from './components/BOQManager';
import ExportTool from './components/ExportTool';
import AuditTrail from './components/AuditTrail';
import Sidebar from './components/Sidebar';
import { RefreshCw, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dash' | 'main' | 'boq' | 'export' | 'audit'>('dash');
  const [records, setRecords] = useState<HouseConnectionRecord[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Sync Channel for real-time simulation across browser tabs
  const syncChannel = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    syncChannel.current = new BroadcastChannel('hc_framework_sync');
    
    syncChannel.current.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === 'DATA_UPDATE') {
        setRecords(payload.records);
        setActivities(payload.activities);
        setIsSyncing(true);
        setTimeout(() => setIsSyncing(false), 500);
      } else if (type === 'USER_PING') {
        setOnlineUsers(prev => {
          const exists = prev.find(u => u.username === payload.username);
          if (exists) return prev;
          return [...prev, payload];
        });
      }
    };

    return () => syncChannel.current?.close();
  }, []);

  // Broadcast user presence
  useEffect(() => {
    if (user) {
      const ping = () => syncChannel.current?.postMessage({ type: 'USER_PING', payload: user });
      ping();
      const interval = setInterval(ping, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Load initial data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedActivities = localStorage.getItem(STORAGE_KEY + '_logs');
    if (saved) {
      try { setRecords(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
    if (savedActivities) {
      try { setActivities(JSON.parse(savedActivities)); } catch (e) { console.error(e); }
    }
    
    const session = localStorage.getItem('hc_user_session');
    if (session) {
      setUser(JSON.parse(session));
    }
  }, []);

  const updateRecords = useCallback((newRecords: HouseConnectionRecord[], logEntry?: Partial<ActivityLog>) => {
    setRecords(newRecords);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));

    if (logEntry && user) {
      const newLog: ActivityLog = {
        id: Math.random().toString(36).substr(2, 9),
        user: user.username,
        action: logEntry.action || 'updated record',
        timestamp: new Date().toISOString(),
        targetRef: logEntry.targetRef
      };
      const updatedLogs = [newLog, ...activities].slice(0, 100);
      setActivities(updatedLogs);
      localStorage.setItem(STORAGE_KEY + '_logs', JSON.stringify(updatedLogs));
      
      syncChannel.current?.postMessage({ 
        type: 'DATA_UPDATE', 
        payload: { records: newRecords, activities: updatedLogs } 
      });
    } else {
      syncChannel.current?.postMessage({ 
        type: 'DATA_UPDATE', 
        payload: { records: newRecords, activities } 
      });
    }
    
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 800);
  }, [activities, user]);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('hc_user_session', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('hc_user_session');
  };

  const handleOpenBOQ = (ref: string) => {
    setSelectedRef(ref);
    setActiveTab('boq');
  };

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.min(Math.max(prev + delta, 70), 130));
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout}
        user={user}
        onlineUsers={onlineUsers}
        records={records}
        setRecords={updateRecords}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-800">
              {activeTab === 'dash' && 'Cloud Dashboard'}
              {activeTab === 'main' && 'Live Register'}
              {activeTab === 'boq' && 'Quantity Manager'}
              {activeTab === 'export' && 'Reporting Engine'}
              {activeTab === 'audit' && 'System Audit Logs'}
            </h1>
            {isSyncing && (
              <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Live Sync
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-6">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => handleZoom(-10)} 
                className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-500 hover:text-blue-600"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <div className="px-2 text-[10px] font-black text-slate-400 w-12 text-center uppercase">
                {zoomLevel}%
              </div>
              <button 
                onClick={() => handleZoom(10)} 
                className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-500 hover:text-blue-600"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <button 
                onClick={() => setZoomLevel(100)} 
                className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-500 hover:text-blue-600"
                title="Reset Zoom"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>

            <div className="flex -space-x-2">
               {onlineUsers.slice(0, 3).map((u, i) => (
                 <div key={i} title={`${u.username} (${u.role})`} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase">
                   {u.username.charAt(0)}
                 </div>
               ))}
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden lg:block">
                <div className="text-sm font-semibold text-slate-700">{user.username}</div>
                <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">{user.role}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-600/20 uppercase">
                {user.username.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div 
            className="p-8 transition-transform duration-200 origin-top-left"
            style={{ 
              transform: `scale(${zoomLevel / 100})`, 
              width: `${100 / (zoomLevel / 100)}%`,
              minWidth: '100%' 
            }}
          >
            {activeTab === 'dash' && (
              <Dashboard records={records} onOpenBOQ={handleOpenBOQ} logs={activities} />
            )}
            {activeTab === 'main' && (
              <MainTable 
                records={records} 
                setRecords={(recs, log) => updateRecords(recs, log)} 
                onOpenBOQ={handleOpenBOQ}
              />
            )}
            {activeTab === 'boq' && (
              <BOQManager 
                records={records} 
                setRecords={(recs, log) => updateRecords(recs, log)} 
                initialRef={selectedRef}
              />
            )}
            {activeTab === 'export' && (
              <ExportTool records={records} />
            )}
            {activeTab === 'audit' && (
              <AuditTrail logs={activities} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
