import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HouseConnectionRecord, ActivityLog, User } from './types';
import { STORAGE_KEY } from './constants';
import {
  saveFrameworkState,
  loadFrameworkState,
  HCFrameworkState,
} from './utils';

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
  const [activeTab, setActiveTab] =
    useState<'dash' | 'main' | 'boq' | 'export' | 'audit'>('dash');
  const [records, setRecords] = useState<HouseConnectionRecord[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [zoomLevel, setZoomLevel] = useState(100);

  // 🚀 New: backend loading flag
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Sync Channel for real-time simulation across browser tabs
  const syncChannel = useRef<BroadcastChannel | null>(null);

  // 1) Setup BroadcastChannel listeners
  useEffect(() => {
    const channel = new BroadcastChannel('hc_framework_sync');
    syncChannel.current = channel;

    channel.onmessage = (event: MessageEvent) => {
      const { type, payload } = event.data || {};

      if (type === 'DATA_UPDATE') {
        setRecords(payload.records || []);
        setActivities(payload.activities || []);
        setIsSyncing(true);
        setTimeout(() => setIsSyncing(false), 500);
      } else if (type === 'USER_PING') {
        setOnlineUsers((prev) => {
          if (prev.some((u) => u.username === payload.username)) return prev;
          return [...prev, payload];
        });
      }
    };

    return () => channel.close();
  }, []);

  // 2) Broadcast user presence
  useEffect(() => {
    if (!user || !syncChannel.current) return;

    const ping = () =>
      syncChannel.current?.postMessage({ type: 'USER_PING', payload: user });

    ping();
    const interval = setInterval(ping, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // 3) Load initial local data (localStorage + user session)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const savedActivities = localStorage.getItem(STORAGE_KEY + '_logs');
      const session = localStorage.getItem('hc_user_session');

      if (saved) {
        setRecords(JSON.parse(saved));
      }
      if (savedActivities) {
        setActivities(JSON.parse(savedActivities));
      }
      if (session) {
        setUser(JSON.parse(session));
      }
    } catch (e) {
      console.error('Error loading local data', e);
    }
  }, []);

  // 4) 🔄 Load shared data from backend after login
  useEffect(() => {
    if (!user) return;

    setIsLoadingData(true);

    async function syncFromBackend() {
      try {
        const loaded: HCFrameworkState | null = await loadFrameworkState();

        if (loaded && (loaded as any).records && (loaded as any).activities) {
          const nextRecords = (loaded as any).records as HouseConnectionRecord[];
          const nextActivities = (loaded as any).activities as ActivityLog[];

          setRecords(nextRecords);
          setActivities(nextActivities);

          // refresh localStorage so offline still works
          localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRecords));
          localStorage.setItem(
            STORAGE_KEY + '_logs',
            JSON.stringify(nextActivities),
          );
        } else {
          console.log('No shared backend data yet, keeping local data.');
        }
      } catch (err) {
        console.error('Error loading framework state from backend', err);
      } finally {
        setIsLoadingData(false);
      }
    }

    syncFromBackend();
  }, [user]);

  // 5) Update records + logs + broadcast to other tabs
  const updateRecords = useCallback(
    (newRecords: HouseConnectionRecord[], logEntry?: Partial<ActivityLog>) => {
      setRecords(newRecords);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));

      let nextActivities = activities;

      if (logEntry && user) {
        const newLog: ActivityLog = {
          id: Math.random().toString(36).substr(2, 9),
          user: user.username,
          action: logEntry.action || 'updated record',
          timestamp: new Date().toISOString(),
          targetRef: logEntry.targetRef,
        };

        nextActivities = [newLog, ...activities].slice(0, 100);
        setActivities(nextActivities);
        localStorage.setItem(
          STORAGE_KEY + '_logs',
          JSON.stringify(nextActivities),
        );
      }

      syncChannel.current?.postMessage({
        type: 'DATA_UPDATE',
        payload: { records: newRecords, activities: nextActivities },
      });

      setIsSyncing(true);
      setTimeout(() => setIsSyncing(false), 800);
    },
    [activities, user],
  );

  // 6) Auth handlers
  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('hc_user_session', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('hc_user_session');
  };

  // 7) BOQ navigation
  const handleOpenBOQ = (ref: string) => {
    setSelectedRef(ref);
    setActiveTab('boq');
  };

  // 8) Zoom controls
  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(Math.max(prev + delta, 70), 130));
  };

  // 9) 💾 Save handler → sends { records, activities } to backend
  const handleSave = async () => {
    try {
      const stateToSave: HCFrameworkState = {
        records,
        activities,
      } as any;

      await saveFrameworkState(stateToSave);
      alert('Data saved successfully and will be visible to all users.');
    } catch (err) {
      console.error('Save failed', err);
      alert('Save failed. Please try again.');
    }
  };

  // 10) Logged-out view
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // 11) Show loading screen right after login while backend syncs
  if (isLoadingData) {
    return (
      <div className="w-screen h-screen flex items-center justify-center text-slate-700 text-sm">
        Loading shared data...
      </div>
    );
  }

  // 12) Main application layout
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        user={user}
        onlineUsers={onlineUsers}
        records={records}
        setRecords={updateRecords}
      />

      <main
        className="flex-1 flex flex-col"
        style={{ fontSize: `${zoomLevel}%` }}
      >
        {/* Top header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex flex-col">
            <h1 className="text-xs font-bold tracking-[0.25em] text-slate-400 uppercase">
              HC Framework Manager
            </h1>
            <p className="text-lg font-black tracking-tight">
              {activeTab === 'dash' && 'Cloud Dashboard'}
              {activeTab === 'main' && 'Live Register'}
              {activeTab === 'boq' && 'Quantity Manager'}
              {activeTab === 'export' && 'Reporting Engine'}
              {activeTab === 'audit' && 'System Audit Logs'}
            </p>

            {isSyncing && (
              <div className="mt-1 inline-flex items-center gap-2 text-[10px] text-emerald-400">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Live Sync</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Zoom controls */}
            <button
              onClick={() => handleZoom(-10)}
              className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-500 hover:text-blue-600"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono w-10 text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={() => handleZoom(10)}
              className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-500 hover:text-blue-600"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-500 hover:text-blue-600"
              title="Reset Zoom"
            >
              <Maximize className="w-4 h-4" />
            </button>

            {/* 💾 New Save button (wires to handleSave) */}
            <button
              onClick={handleSave}
              className="ml-4 px-4 py-2 rounded-xl bg-emerald-500 text-xs font-black uppercase tracking-[0.2em] hover:bg-emerald-400 active:scale-95 transition-all"
            >
              Save
            </button>

            {/* Online users + current user */}
            <div className="flex items-center gap-2 ml-4">
              {onlineUsers.slice(0, 3).map((u, i) => (
                <div
                  key={u.username + i}
                  className="w-7 h-7 rounded-full bg-blue-600 text-[11px] font-black flex items-center justify-center text-white border border-slate-900 -ml-2 first:ml-0"
                  title={u.username}
                >
                  {u.username.charAt(0)}
                </div>
              ))}
              <div className="ml-3 text-right">
                <div className="text-xs font-bold">{user.username}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-[0.2em]">
                  {user.role}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Tab content */}
        <section className="flex-1 overflow-auto p-6">
          {activeTab === 'dash' && (
            <Dashboard
              records={records}
              onOpenBOQ={handleOpenBOQ}
              logs={activities}
            />
          )}

          {activeTab === 'main' && (
            <MainTable
              records={records}
              setRecords={updateRecords}
              onOpenBOQ={handleOpenBOQ}
            />
          )}

          {activeTab === 'boq' && (
            <BOQManager
              records={records}
              setRecords={updateRecords}
              initialRef={selectedRef}
            />
          )}

          {activeTab === 'export' && <ExportTool records={records} />}

          {activeTab === 'audit' && <AuditTrail logs={activities} />}
        </section>
      </main>
    </div>
  );
};

export default App;
