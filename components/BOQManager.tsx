
import React, { useState, useMemo } from 'react';
import { HouseConnectionRecord, BOQItemValues, ActivityLog } from '../types';
import { BOQ_MASTER } from '../constants';
import { formatCurrency, safeEval } from '../utils';
import { Calculator, Search, FileText } from 'lucide-react';

interface BOQManagerProps {
  records: HouseConnectionRecord[];
  setRecords: (recs: HouseConnectionRecord[], log?: Partial<ActivityLog>) => void;
  initialRef: string | null;
}

const BOQManager: React.FC<BOQManagerProps> = ({ records, setRecords, initialRef }) => {
  const [selectedRef, setSelectedRef] = useState(initialRef || '');
  const [activeSection, setActiveSection] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [searchTerm, setSearchTerm] = useState('');

  const currentRec = useMemo(() => 
    records.find(r => r.reference === selectedRef),
    [records, selectedRef]
  );

  const filteredMaster = useMemo(() => 
    BOQ_MASTER.filter(m => 
      m.section === activeSection && 
      (m.desc.toLowerCase().includes(searchTerm.toLowerCase()) || m.bill.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    [activeSection, searchTerm]
  );

  const handleQtyChange = (bill: string, column: 'est' | 'over' | 'claim' | 'cert', expr: string) => {
    if (!currentRec) return;

    const evaluation = safeEval(expr);
    const updatedRecords = records.map(r => {
      if (r.reference !== selectedRef) return r;

      const newBOQ = { ...r.boq };
      const itemValues = newBOQ[bill] || {
        estExpr: '', estVal: 0,
        overExpr: '', overVal: 0,
        claimExpr: '', claimVal: 0,
        certExpr: '', certVal: 0
      };

      (itemValues as any)[`${column}Expr`] = expr;
      (itemValues as any)[`${column}Val`] = evaluation.ok ? evaluation.val : (itemValues[`${column}Val` as keyof BOQItemValues] || 0);
      
      newBOQ[bill] = itemValues;

      const totals = { est: 0, over: 0, claim: 0, cert: 0 };
      BOQ_MASTER.forEach(m => {
        if (m.kind === 'item' && m.rate && newBOQ[m.bill]) {
          const v = newBOQ[m.bill];
          totals.est += (v.estVal || 0) * m.rate;
          totals.over += (v.overVal || 0) * m.rate;
          totals.claim += (v.claimVal || 0) * m.rate;
          totals.cert += (v.certVal || 0) * m.rate;
        }
      });

      return { ...r, boq: newBOQ, totals };
    });

    setRecords(updatedRecords, { action: `adjusted ${column} qty for ${bill} on`, targetRef: selectedRef });
  };

  const sections = [
    { id: 'A', label: 'A: Public' },
    { id: 'B', label: 'B: Private' },
    { id: 'C', label: 'C: Reinstatement' },
    { id: 'D', label: 'D: Dayworks' }
  ];

  return (
    <div className="space-y-4 max-w-full mx-auto overflow-x-hidden">
      <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Active Working File</label>
          <div className="relative">
            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              value={selectedRef}
              onChange={(e) => setSelectedRef(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-2xl font-black text-slate-800 outline-none appearance-none transition-all focus:bg-white text-xs border border-slate-100"
            >
              <option value="">Choose connection...</option>
              {records.filter(r => !!r.reference).map(r => (
                <option key={r.id} value={r.reference}>{r.reference} — {r.surname}</option>
              ))}
            </select>
          </div>
        </div>

        {currentRec && (
          <div className="flex flex-wrap gap-1.5">
            <div className="bg-blue-600 px-4 py-2.5 rounded-xl text-white shadow-lg shadow-blue-500/10">
               <div className="text-[8px] font-black opacity-70 uppercase tracking-widest leading-none mb-1">ESTIMATED</div>
               <div className="text-xs font-black tracking-tight leading-none">{formatCurrency(currentRec.totals.est)}</div>
            </div>
            <div className="bg-orange-600 px-4 py-2.5 rounded-xl text-white shadow-lg shadow-orange-500/10">
               <div className="text-[8px] font-black opacity-70 uppercase tracking-widest leading-none mb-1">OVER BUDGET</div>
               <div className="text-xs font-black tracking-tight leading-none">{formatCurrency(currentRec.totals.over)}</div>
            </div>
            <div className="bg-indigo-600 px-4 py-2.5 rounded-xl text-white shadow-lg shadow-indigo-500/10">
               <div className="text-[8px] font-black opacity-70 uppercase tracking-widest leading-none mb-1">CLAIMED VAL.</div>
               <div className="text-xs font-black tracking-tight leading-none">{formatCurrency(currentRec.totals.claim)}</div>
            </div>
            <div className="bg-emerald-600 px-4 py-2.5 rounded-xl text-white shadow-lg shadow-emerald-500/10">
               <div className="text-[8px] font-black opacity-70 uppercase tracking-widest leading-none mb-1">CERTIFIED</div>
               <div className="text-xs font-black tracking-tight leading-none">{formatCurrency(currentRec.totals.cert)}</div>
            </div>
          </div>
        )}
      </div>

      {!selectedRef ? (
        <div className="bg-white p-32 rounded-[32px] border border-slate-100 text-center space-y-4">
           <Calculator className="w-12 h-12 text-slate-100 mx-auto" />
           <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] italic">Select reference to load schedule</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm gap-1.5 items-center">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id as any)}
                className={`flex-1 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${
                  activeSection === s.id 
                    ? 'bg-slate-900 text-white' 
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                {s.label}
              </button>
            ))}
            <div className="w-px h-6 bg-slate-100 mx-1" />
            <div className="relative w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300" />
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter Bill..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold outline-none"
              />
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left table-fixed min-w-[1400px]">
                <thead className="bg-slate-50/50 text-slate-400 text-[8px] font-black uppercase tracking-[0.2em] border-b">
                  <tr>
                    <th className="px-3 py-4 w-16 sticky left-0 bg-slate-50/50 z-20">Bill</th>
                    <th className="px-3 py-4 w-56 sticky left-16 bg-slate-50/50 z-20">Description</th>
                    <th className="px-1 py-4 w-12 text-center">Unit</th>
                    <th className="px-2 py-4 w-20 text-right">Rate</th>
                    <th className="px-1 py-4 w-18 text-center bg-blue-50/20">Est Qty</th>
                    <th className="px-2 py-4 w-24 text-right bg-blue-50/20">Est Amt</th>
                    <th className="px-1 py-4 w-18 text-center bg-orange-50/20">Over Qty</th>
                    <th className="px-2 py-4 w-24 text-right bg-orange-50/20">Over Amt</th>
                    <th className="px-1 py-4 w-18 text-center bg-indigo-50/20">Claim Qty</th>
                    <th className="px-2 py-4 w-24 text-right bg-indigo-50/20">Claim Amt</th>
                    <th className="px-1 py-4 w-18 text-center bg-emerald-50/20">Cert Qty</th>
                    <th className="px-2 py-4 w-24 text-right bg-emerald-50/20">Cert Amt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredMaster.map((m, idx) => {
                    if (m.kind !== 'item') {
                      return (
                        <tr key={idx} className="bg-slate-50/10">
                          <td className="px-3 py-2 font-black text-slate-400 text-[9px] sticky left-0 bg-slate-50/10 z-10">{m.bill}</td>
                          <td colSpan={11} className={`px-3 py-2 font-black text-[9px] uppercase tracking-tight ${m.kind === 'section' ? 'text-blue-900 bg-blue-50/20' : 'text-slate-600'}`}>
                            {m.desc}
                          </td>
                        </tr>
                      );
                    }
                    
                    const it = currentRec?.boq[m.bill] || { estExpr: '', estVal: 0, overExpr: '', overVal: 0, claimExpr: '', claimVal: 0, certExpr: '', certVal: 0 };
                    const rate = m.rate || 0;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/30 transition-colors group text-[10px]">
                        <td className="px-3 py-2.5 font-bold text-slate-400 sticky left-0 bg-white group-hover:bg-slate-50/30 z-10 border-r border-slate-50/50">{m.bill}</td>
                        <td className="px-3 py-2.5 font-semibold text-slate-700 leading-tight sticky left-16 bg-white group-hover:bg-slate-50/30 z-10 truncate border-r border-slate-50/50" title={m.desc}>{m.desc}</td>
                        <td className="px-1 py-2.5 text-center text-slate-400 font-bold uppercase text-[8px]">{m.unit === 'Nil' ? '-' : m.unit}</td>
                        <td className="px-2 py-2.5 text-right font-black text-slate-500">{m.rate ? formatCurrency(m.rate).replace('MUR', '') : '-'}</td>
                        
                        {(['est', 'over', 'claim', 'cert'] as const).map(col => {
                          const val = (it as any)[`${col}Val`] || 0;
                          const amt = val * rate;
                          const colorMap = { est: 'blue', over: 'orange', claim: 'indigo', cert: 'emerald' };
                          const base = colorMap[col];
                          return (
                            <React.Fragment key={col}>
                              <td className={`px-1 py-2.5 bg-${base}-50/5`}>
                                <input 
                                  type="text"
                                  value={(it as any)[`${col}Expr`] || ''}
                                  onChange={(e) => handleQtyChange(m.bill, col, e.target.value)}
                                  className="w-full text-center py-1 bg-white border border-slate-100 rounded text-[9px] font-black outline-none focus:ring-1 focus:ring-blue-500/30"
                                  placeholder="0"
                                />
                              </td>
                              <td className={`px-2 py-2.5 text-right font-black text-slate-800 bg-${base}-50/10`}>
                                {amt > 0 ? formatCurrency(amt).replace('MUR', '') : '-'}
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BOQManager;
