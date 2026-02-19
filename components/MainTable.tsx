
import React, { useState, useRef } from 'react';
import { HouseConnectionRecord, FeasibilityStatus, WorksStatus, OverbudgetStatus, ActivityLog, FileData } from '../types';
import { readFileAsDataURL, parseCSV } from '../utils';
import { 
  Search, 
  Plus, 
  Trash2, 
  Camera, 
  FileText,
  UploadCloud,
  Eye,
  FileSearch,
  CheckCircle,
  Hash
} from 'lucide-react';

interface MainTableProps {
  records: HouseConnectionRecord[];
  setRecords: (recs: HouseConnectionRecord[], log?: Partial<ActivityLog>) => void;
  onOpenBOQ: (ref: string) => void;
}

const MainTable: React.FC<MainTableProps> = ({ records, setRecords, onOpenBOQ }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [listFilter, setListFilter] = useState('All');
  const [feasibilityFilter, setFeasibilityFilter] = useState('All');
  const [targetBatchList, setTargetBatchList] = useState('');
  const [viewingFiles, setViewingFiles] = useState<{title: string, items: FileData[]} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredRecords = records.filter(r => {
    const matchesSearch = 
      (r.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.surname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.address || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesList = listFilter === 'All' || r.listNo === listFilter;
    const matchesFeasibility = feasibilityFilter === 'All' || r.feasible === feasibilityFilter;
    return matchesSearch && matchesList && matchesFeasibility;
  });

  const handleFileUpload = async (id: string, type: 'photos' | 'drawings', files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    const rec = records.find(r => r.id === id);
    if (!rec) return;

    const updatedFiles = [...(rec[type] || [])];
    for (const file of newFiles) {
      const dataUrl = await readFileAsDataURL(file);
      updatedFiles.push({ name: file.name, mimeType: file.type, dataUrl });
    }

    const updated = records.map(r => r.id === id ? { ...r, [type]: updatedFiles } : r);
    setRecords(updated, { action: `uploaded ${type} for`, targetRef: rec.reference || id });
  };

  const updateRecord = (id: string, field: keyof HouseConnectionRecord, value: any) => {
    const rec = records.find(r => r.id === id);
    const updated = records.map(r => r.id === id ? { ...r, [field]: value } : r);
    setRecords(updated, { action: `modified ${field} of`, targetRef: rec?.reference || id });
  };

  const addNewRow = () => {
    const list = targetBatchList || 'New List';
    const newRec: HouseConnectionRecord = {
      id: Math.random().toString(36).substr(2, 9),
      listNo: list,
      reference: '',
      surname: '',
      name: '',
      phone1: '',
      phone2: '',
      address: '',
      location: '',
      surveyDate: new Date().toISOString().split('T')[0],
      feasible: 'Feasible',
      worksStatus: 'Not Started',
      overbudgetStatus: 'Not Started',
      reason: '',
      photos: [],
      drawings: [],
      boq: {},
      totals: { est: 0, over: 0, claim: 0, cert: 0 }
    };
    setRecords([newRec, ...records], { action: 'created new record in list', targetRef: list });
    setTargetBatchList('');
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const data = parseCSV(text);
      
      const newRecords: HouseConnectionRecord[] = data.map(item => ({
        id: Math.random().toString(36).substr(2, 9),
        listNo: targetBatchList || item.list || item.listno || 'Uploaded',
        reference: item.reference || item.ref || '',
        surname: item.surname || '',
        name: item.name || item.firstname || '',
        phone1: item.phone || item.mobile || '',
        phone2: '',
        address: item.address || '',
        location: item.location || item.city || '',
        surveyDate: '',
        feasible: 'Feasible',
        worksStatus: 'Not Started',
        overbudgetStatus: 'Not Started',
        reason: '',
        photos: [],
        drawings: [],
        boq: {},
        totals: { est: 0, over: 0, claim: 0, cert: 0 }
      }));

      setRecords([...newRecords, ...records], { action: `bulk uploaded ${newRecords.length} records`, targetRef: file.name });
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTargetBatchList('');
  };

  const deleteRecord = (id: string) => {
    const rec = records.find(r => r.id === id);
    if (window.confirm(`Are you sure you want to PERMANENTLY delete record ${rec?.reference || 'this line'}?`)) {
      setRecords(records.filter(r => r.id !== id), { action: 'permanently deleted record', targetRef: rec?.reference || id });
    }
  };

  const openFile = (file: FileData) => {
    const win = window.open();
    if (win) {
      if (file.mimeType === 'application/pdf') {
        win.document.write(`<iframe src="${file.dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
      } else {
        win.document.write(`<img src="${file.dataUrl}" style="max-width:100%; height:auto;" />`);
      }
      win.document.title = file.name;
    }
  };

  const uniqueLists = ['All', ...Array.from(new Set(records.map(r => r.listNo)))].sort();

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto">
      {/* Documentation Viewer Modal */}
      {viewingFiles && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-8 backdrop-blur-md">
          <div className="bg-white w-full max-w-5xl max-h-[85vh] rounded-[32px] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg text-white"><FileSearch className="w-5 h-5" /></div>
                <div>
                  <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Documentation Browser</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{viewingFiles.title}</p>
                </div>
              </div>
              <button onClick={() => setViewingFiles(null)} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-slate-900/20 active:scale-95 transition-all">Close Viewer</button>
            </div>
            <div className="flex-1 overflow-auto p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {viewingFiles.items.map((file, i) => (
                <div key={i} className="group relative border border-slate-100 rounded-[24px] overflow-hidden bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all flex flex-col p-2">
                  <div className="w-full h-48 rounded-[18px] overflow-hidden bg-slate-100 flex items-center justify-center">
                    {file.mimeType.startsWith('image/') ? (
                      <img src={file.dataUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={file.name} />
                    ) : (
                      <div className="text-slate-300 flex flex-col items-center gap-2">
                        <FileText className="w-16 h-16" />
                        <span className="text-[9px] font-black uppercase tracking-widest">PDF Document</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-4">
                      <span className="text-xs font-black text-slate-700 truncate block">{file.name}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{file.mimeType.split('/')[1]}</span>
                    </div>
                    <button 
                      onClick={() => openFile(file)}
                      className="p-3 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-slate-900/10"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Register Controls */}
      <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px] space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 italic">Registry Search</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ref, Surname, Address..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all text-sm border-slate-100 border"
            />
          </div>
        </div>

        <div className="w-40 space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Batch Filter</label>
          <select 
            value={listFilter}
            onChange={(e) => setListFilter(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 rounded-2xl font-bold outline-none border border-slate-100 appearance-none text-sm cursor-pointer"
          >
            {uniqueLists.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div className="w-40 space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Feasibility</label>
          <select 
            value={feasibilityFilter}
            onChange={(e) => setFeasibilityFilter(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 rounded-2xl font-bold outline-none border border-slate-100 appearance-none text-sm cursor-pointer"
          >
            <option value="All">All Projects</option>
            <option value="Feasible">Feasible</option>
            <option value="Not Feasible">Not Feasible</option>
            <option value="Low Lying">Low Lying</option>
          </select>
        </div>

        <div className="h-10 w-px bg-slate-100 hidden lg:block" />

        <div className="flex-1 min-w-[200px] space-y-2">
           <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 italic">Target Batch ID</label>
           <div className="relative">
             <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
             <input 
               type="text"
               value={targetBatchList}
               onChange={(e) => setTargetBatchList(e.target.value)}
               placeholder="List No for new records..."
               className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 border-dashed rounded-2xl font-bold outline-none focus:bg-white transition-all text-sm"
             />
           </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
            title="Populate list from CSV"
          >
            <UploadCloud className="w-4 h-4" />
            Bulk Import
          </button>
          <input type="file" ref={fileInputRef} onChange={handleBulkUpload} accept=".csv" className="hidden" />
          
          <button 
            onClick={addNewRow}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-blue-600/10 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Line
          </button>
        </div>
      </div>

      {/* Main Registry Table */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1600px] table-fixed">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[9px] font-black uppercase tracking-[0.15em] border-b border-slate-100">
                <th className="px-4 py-5 w-16 text-center">List</th>
                <th className="px-4 py-5 w-32">Ref Code</th>
                <th className="px-4 py-5 w-48">Stakeholder</th>
                <th className="px-4 py-5 w-56">Site Address</th>
                <th className="px-4 py-5 w-32 text-center">Status of Works</th>
                <th className="px-4 py-5 w-32 text-center">Overbudget Status</th>
                <th className="px-4 py-5 w-28 text-center">Feasibility</th>
                <th className="px-4 py-5 w-28 text-center">Doc.</th>
                <th className="px-4 py-5 w-24 text-center">BOQ</th>
                <th className="px-4 py-5 w-16 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRecords.map((rec) => (
                <tr key={rec.id} className="group hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-4">
                    <input type="text" value={rec.listNo} onChange={(e) => updateRecord(rec.id, 'listNo', e.target.value)} className="w-full text-center bg-transparent font-black text-blue-600 outline-none text-[11px] hover:bg-white focus:bg-white rounded px-1 transition-all" />
                  </td>
                  <td className="px-4 py-4">
                    <input type="text" value={rec.reference} onChange={(e) => updateRecord(rec.id, 'reference', e.target.value)} className="w-full bg-transparent font-black text-slate-800 outline-none text-[11px] tracking-tight hover:bg-white focus:bg-white rounded px-1 transition-all" placeholder="HC/XXX" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-0.5">
                      <input type="text" value={rec.surname} onChange={(e) => updateRecord(rec.id, 'surname', e.target.value)} className="w-full bg-transparent font-black text-slate-700 outline-none text-[11px] uppercase hover:bg-white focus:bg-white rounded px-1 transition-all" placeholder="SURNAME" />
                      <input type="text" value={rec.name} onChange={(e) => updateRecord(rec.id, 'name', e.target.value)} className="w-full bg-transparent text-slate-400 outline-none text-[9px] font-bold hover:bg-white focus:bg-white rounded px-1 transition-all" placeholder="First Name" />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-0.5">
                      <input type="text" value={rec.address} onChange={(e) => updateRecord(rec.id, 'address', e.target.value)} className="w-full bg-transparent font-semibold text-slate-600 outline-none text-[11px] truncate hover:bg-white focus:bg-white rounded px-1 transition-all" placeholder="Street Address" />
                      <input type="text" value={rec.location} onChange={(e) => updateRecord(rec.id, 'location', e.target.value)} className="w-full bg-transparent text-slate-400 outline-none text-[8px] font-black uppercase tracking-tight hover:bg-white focus:bg-white rounded px-1 transition-all" placeholder="CITY" />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <select 
                      value={rec.worksStatus || 'Not Started'} 
                      onChange={(e) => updateRecord(rec.id, 'worksStatus', e.target.value as WorksStatus)}
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-black uppercase tracking-tighter outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer group-hover:bg-white"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="Ongoing">Ongoing</option>
                      <option value="Completed">Completed</option>
                      <option value="Claimed">Claimed</option>
                      <option value="Certified">Certified</option>
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <select 
                      value={rec.overbudgetStatus || 'Not Started'} 
                      onChange={(e) => updateRecord(rec.id, 'overbudgetStatus', e.target.value as OverbudgetStatus)}
                      className="w-full bg-orange-50 border border-orange-100 rounded-lg px-2 py-1.5 text-[10px] font-black uppercase tracking-tighter outline-none focus:ring-2 focus:ring-orange-500 transition-all cursor-pointer text-orange-700 group-hover:bg-white"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="Ongoing">Ongoing</option>
                      <option value="Completed">Completed</option>
                      <option value="Claimed">Claimed</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <select value={rec.feasible} onChange={(e) => updateRecord(rec.id, 'feasible', e.target.value as FeasibilityStatus)} className={`w-full bg-transparent font-black outline-none text-[9px] uppercase tracking-tighter text-center cursor-pointer ${rec.feasible === 'Feasible' ? 'text-emerald-600' : rec.feasible === 'Low Lying' ? 'text-amber-500' : 'text-red-500'}`}>
                      <option value="Feasible">Feasible</option>
                      <option value="Not Feasible">Not Feasible</option>
                      <option value="Low Lying">Low Lying</option>
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <label className="p-1 hover:bg-blue-100 text-slate-300 hover:text-blue-600 rounded cursor-pointer relative transition-colors">
                        <Camera className="w-3.5 h-3.5" />
                        <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFileUpload(rec.id, 'photos', e.target.files)} />
                        {rec.photos.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-blue-600 rounded-full border border-white" />}
                      </label>
                      <label className="p-1 hover:bg-indigo-100 text-slate-300 hover:text-indigo-600 rounded cursor-pointer relative transition-colors">
                        <FileText className="w-3.5 h-3.5" />
                        <input type="file" multiple accept="application/pdf" className="hidden" onChange={(e) => handleFileUpload(rec.id, 'drawings', e.target.files)} />
                        {rec.drawings.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-indigo-600 rounded-full border border-white" />}
                      </label>
                      <button onClick={() => setViewingFiles({title: `Docs: ${rec.reference}`, items: [...rec.photos, ...rec.drawings]})} className="text-[8px] font-black text-slate-400 hover:text-blue-600 transition-colors">({rec.photos.length + rec.drawings.length})</button>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button onClick={() => onOpenBOQ(rec.reference)} className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95">Schedule</button>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button 
                      onClick={() => deleteRecord(rec.id)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-20 text-center text-slate-300 font-black uppercase tracking-[0.2em] italic">No records found matching criteria</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MainTable;
