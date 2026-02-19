
import React from 'react';
import { HouseConnectionRecord, ActivityLog } from '../types';
import { formatCurrency } from '../utils';
import { 
  BarChart3,
  DollarSign,
  Activity,
  AlertTriangle
} from 'lucide-react';

interface DashboardProps {
  records: HouseConnectionRecord[];
  onOpenBOQ: (ref: string) => void;
  logs: ActivityLog[];
}

const Dashboard: React.FC<DashboardProps> = ({ records, onOpenBOQ, logs }) => {
  const lists = Array.from(new Set(records.map(r => r.listNo || 'Unknown'))).sort();
  
  const listStats = lists.map(listName => {
    const listRecs = records.filter(r => r.listNo === listName);
    return {
      name: listName,
      total: listRecs.length,
      surveyed: listRecs.filter(r => !!r.surveyDate).length,
      feasible: listRecs.filter(r => r.feasible === 'Feasible').length,
      drawings: listRecs.filter(r => r.drawings.length > 0).length,
      estimated: listRecs.filter(r => r.totals.est > 0).length,
      estAmt: listRecs.reduce((sum, r) => sum + r.totals.est, 0),
      claimAmt: listRecs.reduce((sum, r) => sum + r.totals.claim, 0),
      overAmt: listRecs.reduce((sum, r) => sum + r.totals.over, 0),
      certAmt: listRecs.reduce((sum, r) => sum + r.totals.cert, 0),
    };
  });

  const totalEst = records.reduce((acc, r) => acc + r.totals.est, 0);
  const totalOver = records.reduce((acc, r) => acc + r.totals.over, 0);

  // Operational Quantity Totals
  const grandTotalHC = listStats.reduce((acc, ls) => acc + ls.total, 0);
  const grandTotalSurveyed = listStats.reduce((acc, ls) => acc + ls.surveyed, 0);
  const grandTotalFeasible = listStats.reduce((acc, ls) => acc + ls.feasible, 0);
  const grandTotalDrawings = listStats.reduce((acc, ls) => acc + ls.drawings, 0);
  const grandTotalEstimated = listStats.reduce((acc, ls) => acc + ls.estimated, 0);

  // Workflow Financial Progress Calculations (Works Status)
  const workflowSummary = [
    {
      label: 'Not Started',
      basis: 'Estimate Amount',
      amount: records.filter(r => (r.worksStatus || 'Not Started') === 'Not Started').reduce((sum, r) => sum + r.totals.est, 0),
      color: 'slate'
    },
    {
      label: 'Ongoing',
      basis: 'Estimate Amount',
      amount: records.filter(r => r.worksStatus === 'Ongoing').reduce((sum, r) => sum + r.totals.est, 0),
      color: 'blue'
    },
    {
      label: 'Completed',
      basis: 'Estimate Amount',
      amount: records.filter(r => r.worksStatus === 'Completed').reduce((sum, r) => sum + r.totals.claim, 0),
      color: 'indigo'
    },
    {
      label: 'Certified',
      basis: 'Amount Certified',
      amount: records.filter(r => r.worksStatus === 'Certified').reduce((sum, r) => sum + r.totals.cert, 0),
      color: 'emerald'
    }
  ];

  // Overbudget Financial Status Calculations
  const overbudgetSummary = [
    {
      label: 'Not Started',
      basis: 'Overbudget Amount',
      amount: records.filter(r => (r.overbudgetStatus || 'Not Started') === 'Not Started').reduce((sum, r) => sum + r.totals.over, 0),
      color: 'slate'
    },
    {
      label: 'Ongoing',
      basis: 'Overbudget Amount',
      amount: records.filter(r => r.overbudgetStatus === 'Ongoing').reduce((sum, r) => sum + r.totals.over, 0),
      color: 'orange'
    },
    {
      label: 'Completed',
      basis: 'Overbudget Amount',
      amount: records.filter(r => r.overbudgetStatus === 'Completed').reduce((sum, r) => sum + r.totals.over, 0),
      color: 'amber'
    },
    {
      label: 'Paid',
      basis: 'Overbudget Amount',
      amount: records.filter(r => r.overbudgetStatus === 'Paid').reduce((sum, r) => sum + r.totals.over, 0),
      color: 'emerald'
    }
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Financial Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Workflow Financial Progress</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1 italic">Aggregated by Status of Works</p>
            </div>
            <Activity className="w-6 h-6 text-blue-500" />
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">
                <tr>
                  <th className="px-8 py-5">Workflow Status</th>
                  <th className="px-8 py-5">Basis</th>
                  <th className="px-8 py-5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {workflowSummary.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full bg-${item.color}-500`} />
                        <span className="font-black text-slate-800 text-sm uppercase tracking-tight">{item.label}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-[10px] font-bold text-slate-400 italic">({item.basis})</td>
                    <td className="px-8 py-5 text-right font-black text-slate-800 text-lg">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-900 text-white font-black">
                <tr>
                  <td colSpan={2} className="px-8 py-4 uppercase text-[10px] tracking-widest">Global Portfolio Estimate</td>
                  <td className="px-8 py-4 text-right text-lg">{formatCurrency(totalEst)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Overbudget Tracking Status</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1 italic">Aggregated by Overbudget Status</p>
            </div>
            <AlertTriangle className="w-6 h-6 text-orange-500" />
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">
                <tr>
                  <th className="px-8 py-5">Budget Status</th>
                  <th className="px-8 py-5">Basis</th>
                  <th className="px-8 py-5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {overbudgetSummary.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full bg-${item.color}-500`} />
                        <span className="font-black text-slate-800 text-sm uppercase tracking-tight">{item.label}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-[10px] font-bold text-slate-400 italic">({item.basis})</td>
                    <td className="px-8 py-5 text-right font-black text-orange-600 text-lg">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-orange-600 text-white font-black">
                <tr>
                  <td colSpan={2} className="px-8 py-4 uppercase text-[10px] tracking-widest">Global Over-Budget Value</td>
                  <td className="px-8 py-4 text-right text-lg">{formatCurrency(totalOver)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Operational Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* List Operational Status Table with Totals */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">List Operational Status</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1 italic">Quantity workflow tracking per contract batch</p>
              </div>
              <BarChart3 className="w-6 h-6 text-slate-300" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/80 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">
                  <tr>
                    <th className="px-8 py-5">List Identity</th>
                    <th className="px-6 py-5 text-center">Total HC</th>
                    <th className="px-6 py-5 text-center">Surveyed</th>
                    <th className="px-6 py-5 text-center">Feasible</th>
                    <th className="px-6 py-5 text-center">Drawing</th>
                    <th className="px-6 py-5 text-center">Estimate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {listStats.map(ls => (
                    <tr key={ls.name} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-4 font-black text-blue-600 uppercase text-xs">{ls.name}</td>
                      <td className="px-6 py-4 text-center font-bold text-slate-800">{ls.total}</td>
                      <td className="px-6 py-4 text-center font-bold text-slate-500">{ls.surveyed}</td>
                      <td className="px-6 py-4 text-center font-bold text-emerald-600">{ls.feasible}</td>
                      <td className="px-6 py-4 text-center font-bold text-indigo-600">{ls.drawings}</td>
                      <td className="px-6 py-4 text-center font-bold text-orange-600">{ls.estimated}</td>
                    </tr>
                  ))}
                  {listStats.length === 0 && (
                    <tr><td colSpan={6} className="px-8 py-20 text-center text-slate-300 font-bold uppercase tracking-widest italic">No data records available</td></tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-900 text-white font-black border-t border-slate-800">
                  <tr>
                    <td className="px-8 py-5 uppercase text-[10px] tracking-widest">Aggregate Quantities</td>
                    <td className="px-6 py-5 text-center text-lg">{grandTotalHC}</td>
                    <td className="px-6 py-5 text-center text-lg">{grandTotalSurveyed}</td>
                    <td className="px-6 py-5 text-center text-lg">{grandTotalFeasible}</td>
                    <td className="px-6 py-5 text-center text-lg">{grandTotalDrawings}</td>
                    <td className="px-6 py-5 text-center text-lg">{grandTotalEstimated}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Portfolio Financial Breakdown (Per List) */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Financial Portfolio (Per List)</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1 italic">Batch list value breakdown</p>
              </div>
              <DollarSign className="w-6 h-6 text-slate-300" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/80 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">
                  <tr>
                    <th className="px-6 py-5">List Identity</th>
                    <th className="px-6 py-5 text-right">Estimate</th>
                    <th className="px-6 py-5 text-right">Over-Budget</th>
                    <th className="px-6 py-5 text-right">Claimed</th>
                    <th className="px-6 py-5 text-right">Certified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {listStats.map(ls => (
                    <tr key={ls.name} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-black text-slate-700">{ls.name}</td>
                      <td className="px-6 py-4 text-right font-bold text-blue-600">{formatCurrency(ls.estAmt)}</td>
                      <td className="px-6 py-4 text-right font-bold text-orange-600">{formatCurrency(ls.overAmt)}</td>
                      <td className="px-6 py-4 text-right font-bold text-indigo-600">{formatCurrency(ls.claimAmt)}</td>
                      <td className="px-6 py-4 text-right font-black text-emerald-600">{formatCurrency(ls.certAmt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
