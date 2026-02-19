
import React, { useState } from 'react';
import { ActivityLog } from '../types';
import { 
  History, 
  Search, 
  AlertCircle, 
  User as UserIcon,
  Calendar,
  Filter
} from 'lucide-react';

interface AuditTrailProps {
  logs: ActivityLog[];
}

const AuditTrail: React.FC<AuditTrailProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(log => 
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.targetRef || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">System Audit logs</h2>
          <p className="text-slate-500 font-medium italic">Comprehensive history of all collaborative actions.</p>
        </div>
        
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by user or action..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all text-sm border-slate-100 border"
          />
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
          <History className="w-5 h-5 text-blue-600" />
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">Activity Timeline</h3>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredLogs.length} Events Logged</span>
          </div>
        </div>

        <div className="p-6 divide-y divide-slate-50">
          {filteredLogs.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-slate-100" />
              <p className="text-slate-300 font-black uppercase tracking-widest italic text-xs">No matching activity records</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="py-6 flex items-start gap-6 group hover:bg-slate-50/50 -mx-6 px-6 transition-all">
                <div className="shrink-0 w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-lg uppercase group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {log.user.charAt(0)}
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-slate-800 text-sm tracking-tight">{log.user}</span>
                      <div className="w-1 h-1 bg-slate-200 rounded-full" />
                      <span className="text-xs font-medium text-slate-400 italic">{log.action}</span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(log.timestamp).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <History className="w-3 h-3" />
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  {log.targetRef && (
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100">
                        TARGET REF: {log.targetRef}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditTrail;
