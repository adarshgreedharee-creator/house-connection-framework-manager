
import React, { useRef } from 'react';
import { 
  LayoutDashboard, 
  Table as TableIcon, 
  Calculator, 
  Download, 
  LogOut,
  CloudLightning,
  Share2,
  FolderSync,
  History
} from 'lucide-react';
import { User, HouseConnectionRecord, ActivityLog } from '../types';
import { STORAGE_KEY } from '../constants';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onLogout: () => void;
  user: User;
  onlineUsers: User[];
  records: HouseConnectionRecord[];
  setRecords: (recs: HouseConnectionRecord[], log?: Partial<ActivityLog>) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout, user, onlineUsers, records, setRecords }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const menuItems = [
    { id: 'dash', label: 'Overview', icon: LayoutDashboard },
    { id: 'main', label: 'Master Register', icon: TableIcon },
    { id: 'boq', label: 'BOQ Entry', icon: Calculator },
    { id: 'export', label: 'Export utility', icon: Download },
    { id: 'audit', label: 'Audit Logs', icon: History },
  ];

  const handleExportDataFile = () => {
    const data = {
      version: '2.5',
      timestamp: new Date().toISOString(),
      exportedBy: user.username,
      records,
      logs: JSON.parse(localStorage.getItem(STORAGE_KEY + '_logs') || '[]')
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HC_Framework_Backup_${new Date().toISOString().split('T')[0]}.hcf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportDataFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.records) {
          // Smart Merge Logic: Combine records by ID, keeping the most recent version
          const existingMap = new Map(records.map(r => [r.id, r]));
          imported.records.forEach((rec: HouseConnectionRecord) => {
            existingMap.set(rec.id, rec);
          });
          
          const mergedRecords = Array.from(existingMap.values());
          setRecords(mergedRecords, { action: 'merged data from portable backup', targetRef: file.name });
          
          // Merge Logs
          const existingLogs = JSON.parse(localStorage.getItem(STORAGE_KEY + '_logs') || '[]');
          const mergedLogs = [...imported.logs, ...existingLogs].slice(0, 100);
          localStorage.setItem(STORAGE_KEY + '_logs', JSON.stringify(mergedLogs));
          
          alert(`Successfully merged ${imported.records.length} records from backup.`);
        }
      } catch (err) {
        alert('Failed to parse backup file. Ensure it is a valid .hcf file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-64 bg-[#0F172A] text-white flex flex-col shrink-0 border-r border-slate-800">
      <div className="p-6 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center font-black text-2xl shadow-xl shadow-blue-500/20">
            H
          </div>
          <div>
            <div className="font-black text-lg leading-tight tracking-tighter uppercase italic">FRAMEWORK</div>
            <div className="text-[10px] text-blue-400 font-black uppercase tracking-widest">LIVE COLLAB v2.5</div>
          </div>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} />
                <span className="font-bold text-sm flex-1 text-left">{item.label}</span>
                {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              </button>
            );
          })}
        </nav>

        <div className="mt-8 px-2 space-y-4">
          <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50 space-y-3">
             <div className="flex items-center gap-2 mb-1">
               <CloudLightning className="w-3.5 h-3.5 text-blue-400" />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Portability</span>
             </div>
             
             <button 
               onClick={handleExportDataFile}
               className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/50 hover:bg-blue-600/20 text-slate-300 hover:text-blue-400 rounded-xl transition-all group border border-slate-700"
             >
               <span className="text-[10px] font-black uppercase tracking-tight">Export .hcf</span>
               <Share2 className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
             </button>

             <button 
               onClick={() => fileInputRef.current?.click()}
               className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/50 hover:bg-emerald-600/20 text-slate-300 hover:text-emerald-400 rounded-xl transition-all group border border-slate-700"
             >
               <span className="text-[10px] font-black uppercase tracking-tight">Sync/Import</span>
               <FolderSync className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
             </button>
             <input type="file" ref={fileInputRef} onChange={handleImportDataFile} accept=".hcf" className="hidden" />
          </div>
        </div>

        <div className="mt-auto space-y-6 pt-6">
          <div className="space-y-3">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Active Collab</div>
            <div className="space-y-3 px-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                    {user.username.charAt(0)}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-[#0F172A]" />
                </div>
                <div className="text-xs font-bold text-slate-300 truncate max-w-[120px]">{user.username}</div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all font-bold text-sm"
            >
              <LogOut className="w-5 h-5" />
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
