
import React, { useState } from 'react';
import { HouseConnectionRecord } from '../types';
import { FileSpreadsheet, CheckCircle2, Circle } from 'lucide-react';
import { BOQ_MASTER } from '../constants';
import { formatCurrency } from '../utils';

interface ExportToolProps {
  records: HouseConnectionRecord[];
}

const ExportTool: React.FC<ExportToolProps> = ({ records }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleAll = () => {
    if (selectedIds.size === records.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(records.map(r => r.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleExport = () => {
    if (selectedIds.size === 0) return alert('Select at least one record');
    
    const selectedRecords = records.filter(r => selectedIds.has(r.id));
    
    // Generate Excel XML 2003 string for multi-sheet support
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>HC Framework Manager</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="sHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="sCurrency">
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
  <Style ss:ID="sSection">
   <Font ss:Bold="1" ss:Size="12" ss:Color="#0F172A"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="sSubsection">
   <Font ss:Bold="1" ss:Size="10" ss:Color="#334155"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="sNote">
   <Font ss:Italic="1" ss:Color="#64748B" ss:Size="10"/>
  </Style>
  <Style ss:ID="sBold">
   <Font ss:Bold="1"/>
  </Style>
  <Style ss:ID="sLabel">
    <Font ss:Bold="1" ss:Color="#475569"/>
  </Style>
 </Styles>

 <Worksheet ss:Name="Master Register">
  <Table>
   <Column ss:Width="50"/>
   <Column ss:Width="100"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="200"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="80"/>
   <Row ss:Height="25" ss:StyleID="sHeader">
    <Cell><Data ss:Type="String">List</Data></Cell>
    <Cell><Data ss:Type="String">Reference</Data></Cell>
    <Cell><Data ss:Type="String">Surname</Data></Cell>
    <Cell><Data ss:Type="String">Name</Data></Cell>
    <Cell><Data ss:Type="String">Address</Data></Cell>
    <Cell><Data ss:Type="String">Estimate (MUR)</Data></Cell>
    <Cell><Data ss:Type="String">Over (MUR)</Data></Cell>
    <Cell><Data ss:Type="String">Claimed (MUR)</Data></Cell>
    <Cell><Data ss:Type="String">Certified (MUR)</Data></Cell>
    <Cell><Data ss:Type="String">Status of Works</Data></Cell>
    <Cell><Data ss:Type="String">Overbudget Status</Data></Cell>
    <Cell><Data ss:Type="String">Feasibility</Data></Cell>
   </Row>`;

    selectedRecords.forEach(r => {
      xml += `
   <Row>
    <Cell><Data ss:Type="String">${r.listNo}</Data></Cell>
    <Cell><Data ss:Type="String">${r.reference}</Data></Cell>
    <Cell><Data ss:Type="String">${r.surname}</Data></Cell>
    <Cell><Data ss:Type="String">${r.name}</Data></Cell>
    <Cell><Data ss:Type="String">${r.address}</Data></Cell>
    <Cell ss:StyleID="sCurrency"><Data ss:Type="Number">${r.totals.est}</Data></Cell>
    <Cell ss:StyleID="sCurrency"><Data ss:Type="Number">${r.totals.over}</Data></Cell>
    <Cell ss:StyleID="sCurrency"><Data ss:Type="Number">${r.totals.claim}</Data></Cell>
    <Cell ss:StyleID="sCurrency"><Data ss:Type="Number">${r.totals.cert}</Data></Cell>
    <Cell><Data ss:Type="String">${r.worksStatus || 'Not Started'}</Data></Cell>
    <Cell><Data ss:Type="String">${r.overbudgetStatus || 'Not Started'}</Data></Cell>
    <Cell><Data ss:Type="String">${r.feasible}</Data></Cell>
   </Row>`;
    });

    xml += `
  </Table>
 </Worksheet>`;

    // Create a worksheet for each selected House Connection
    selectedRecords.forEach(r => {
      const safeName = (r.reference || r.id).replace(/[:\\\/\?\*\[\]]/g, '_').substring(0, 31);
      
      xml += `
 <Worksheet ss:Name="${safeName}">
  <Table>
   <Column ss:Width="60"/> <!-- Bill Ref -->
   <Column ss:Width="250"/> <!-- Description -->
   <Column ss:Width="40"/> <!-- Unit -->
   <Column ss:Width="80"/> <!-- Rate -->
   <Column ss:Width="60"/> <!-- Est Qty -->
   <Column ss:Width="90"/> <!-- Est Amt -->
   <Column ss:Width="60"/> <!-- Over Qty -->
   <Column ss:Width="90"/> <!-- Over Amt -->
   <Column ss:Width="60"/> <!-- Claim Qty -->
   <Column ss:Width="90"/> <!-- Claim Amt -->
   <Column ss:Width="60"/> <!-- Cert Qty -->
   <Column ss:Width="90"/> <!-- Cert Amt -->
   
   <Row ss:Height="20">
    <Cell ss:StyleID="sLabel"><Data ss:Type="String">REFERENCE:</Data></Cell>
    <Cell ss:StyleID="sBold"><Data ss:Type="String">${r.reference}</Data></Cell>
    <Cell ss:Index="5" ss:StyleID="sLabel"><Data ss:Type="String">OWNER:</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="sBold"><Data ss:Type="String">${r.surname} ${r.name}</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:StyleID="sLabel"><Data ss:Type="String">ADDRESS:</Data></Cell>
    <Cell ss:MergeAcross="4" ss:StyleID="sBold"><Data ss:Type="String">${r.address}, ${r.location}</Data></Cell>
   </Row>
   <Row ss:Height="10" />
   
   <Row ss:Height="30" ss:StyleID="sHeader">
    <Cell><Data ss:Type="String">Bill Ref</Data></Cell>
    <Cell><Data ss:Type="String">Description</Data></Cell>
    <Cell><Data ss:Type="String">Unit</Data></Cell>
    <Cell><Data ss:Type="String">Rate</Data></Cell>
    <Cell><Data ss:Type="String">Est Qty</Data></Cell>
    <Cell><Data ss:Type="String">Est Amt</Data></Cell>
    <Cell><Data ss:Type="String">Over Qty</Data></Cell>
    <Cell><Data ss:Type="String">Over Amt</Data></Cell>
    <Cell><Data ss:Type="String">Claim Qty</Data></Cell>
    <Cell><Data ss:Type="String">Claim Amt</Data></Cell>
    <Cell><Data ss:Type="String">Cert Qty</Data></Cell>
    <Cell><Data ss:Type="String">Cert Amt</Data></Cell>
   </Row>`;

      BOQ_MASTER.forEach(m => {
        if (m.kind === 'section' || m.kind === 'group') {
          xml += `
   <Row ss:Height="18" ss:StyleID="sSection">
    <Cell><Data ss:Type="String">${m.bill}</Data></Cell>
    <Cell ss:MergeAcross="10"><Data ss:Type="String">${m.desc}</Data></Cell>
   </Row>`;
        } else if (m.kind === 'subsection') {
          xml += `
   <Row ss:Height="16" ss:StyleID="sSubsection">
    <Cell><Data ss:Type="String">${m.bill}</Data></Cell>
    <Cell ss:MergeAcross="10"><Data ss:Type="String">${m.desc}</Data></Cell>
   </Row>`;
        } else if (m.kind === 'note') {
          xml += `
   <Row ss:StyleID="sNote">
    <Cell><Data ss:Type="String">${m.bill}</Data></Cell>
    <Cell ss:MergeAcross="10"><Data ss:Type="String">${m.desc}</Data></Cell>
   </Row>`;
        } else if (m.kind === 'item') {
          const it = r.boq[m.bill] || { estVal: 0, overVal: 0, claimVal: 0, certVal: 0 };
          const rate = m.rate || 0;
          xml += `
   <Row ss:Height="16">
    <Cell><Data ss:Type="String">${m.bill}</Data></Cell>
    <Cell><Data ss:Type="String">${m.desc}</Data></Cell>
    <Cell><Data ss:Type="String">${m.unit}</Data></Cell>
    <Cell ss:StyleID="sCurrency"><Data ss:Type="Number">${rate}</Data></Cell>
    <Cell><Data ss:Type="Number">${it.estVal || 0}</Data></Cell>
    <Cell ss:StyleID="sCurrency"><Data ss:Type="Number">${(it.estVal || 0) * rate}</Data></Cell>
    <Cell><Data ss:Type="Number">${it.overVal || 0}</Data></Cell>
    <Cell ss:StyleID="sCurrency"><Data ss:Type="Number">${(it.overVal || 0) * rate}</Data></Cell>
    <Cell><Data ss:Type="Number">${it.claimVal || 0}</Data></Cell>
    <Cell ss:StyleID="sCurrency"><Data ss:Type="Number">${(it.claimVal || 0) * rate}</Data></Cell>
    <Cell><Data ss:Type="Number">${it.certVal || 0}</Data></Cell>
    <Cell ss:StyleID="sCurrency"><Data ss:Type="Number">${(it.certVal || 0) * rate}</Data></Cell>
   </Row>`;
        }
      });
      
      // Totals row for the worksheet
      xml += `
   <Row ss:Height="25" ss:StyleID="sBold">
    <Cell ss:MergeAcross="4" ss:StyleID="sLabel" ss:HAlign="Right"><Data ss:Type="String">WORKSHEET TOTALS (MUR):</Data></Cell>
    <Cell ss:StyleID="sCurrency"><Data ss:Type="Number">${r.totals.est}</Data></Cell>
    <Cell ss:Index="8" ss:StyleID="sCurrency"><Data ss:Type="Number">${r.totals.over}</Data></Cell>
    <Cell ss:Index="10" ss:StyleID="sCurrency"><Data ss:Type="Number">${r.totals.claim}</Data></Cell>
    <Cell ss:Index="12" ss:StyleID="sCurrency"><Data ss:Type="Number">${r.totals.cert}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>`;
    });

    xml += `
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HC_Framework_Full_Export_${new Date().toISOString().split('T')[0]}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase">Reporting Engine</h2>
          <p className="text-slate-500 font-medium italic">Full multi-worksheet audit export with complete financial data.</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
        >
          <FileSpreadsheet className="w-5 h-5" />
          Export Live Audit (.xls)
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <button 
            onClick={toggleAll}
            className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest hover:text-blue-600 transition-colors"
          >
            {selectedIds.size === records.length ? <CheckCircle2 className="w-4 h-4 text-blue-600" /> : <Circle className="w-4 h-4" />}
            {selectedIds.size === records.length ? 'Deselect All' : 'Select All Records'}
          </button>
          <div className="text-sm font-bold text-slate-400">
            {selectedIds.size} Selected / {records.length} Total
          </div>
        </div>
        
        <div className="divide-y divide-slate-50">
          {records.map(rec => {
            const isSelected = selectedIds.has(rec.id);
            return (
              <div 
                key={rec.id} 
                onClick={() => toggleOne(rec.id)}
                className={`p-4 flex items-center gap-6 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                  isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-200'
                }`}>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
                <div className="w-20">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase tracking-tighter">{rec.listNo}</span>
                </div>
                <div className="w-32 font-bold text-slate-800 text-sm mono truncate">{rec.reference || 'NO-REF'}</div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-slate-700 uppercase tracking-tight">{rec.surname} {rec.name}</div>
                  <div className="text-[10px] text-slate-400 font-medium truncate max-w-xs">{rec.address}</div>
                </div>
                <div className="grid grid-cols-4 gap-x-4 text-right">
                  <div>
                    <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Est</div>
                    <div className="text-[9px] font-black text-slate-800">{formatCurrency(rec.totals.est)}</div>
                  </div>
                  <div>
                    <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Over</div>
                    <div className="text-[9px] font-black text-orange-600">{formatCurrency(rec.totals.over)}</div>
                  </div>
                  <div>
                    <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Claim</div>
                    <div className="text-[9px] font-black text-indigo-600">{formatCurrency(rec.totals.claim)}</div>
                  </div>
                  <div>
                    <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Cert</div>
                    <div className="text-[9px] font-black text-emerald-600">{formatCurrency(rec.totals.cert)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExportTool;
