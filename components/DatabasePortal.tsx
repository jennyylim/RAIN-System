
import React, { useState, useEffect } from 'react';
import { DataService, AuthService } from '../services/store';
import { Asset, AssetStatus, RequestStatus, Employee, AssetRequest } from '../types';
import { useNavigate } from 'react-router-dom';

const DatabasePortal: React.FC = () => {
  const navigate = useNavigate();
  const user = AuthService.getCurrentUser();
  const [activeTab, setActiveTab] = useState<'assets' | 'staff' | 'allocations' | 'uat'>('assets');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [requests, setRequests] = useState<AssetRequest[]>([]);

  // Print Logic State
  const [printReq, setPrintReq] = useState<AssetRequest | null>(null);
  const [printEmployee, setPrintEmployee] = useState<Employee | null>(null);
  const [printAsset, setPrintAsset] = useState<Asset | null>(null);
  
  // Download Modal
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedReqForDownload, setSelectedReqForDownload] = useState<AssetRequest | null>(null);

  useEffect(() => {
    if (!user || (user.role !== 'IT' && user.role !== 'PowerIT')) {
        navigate('/login');
        return;
    }
    refreshData();
  }, [user?.username, navigate]);

  const refreshData = () => {
      setAssets(DataService.getAssets());
      setEmployees(DataService.getEmployees());
      setRequests(DataService.getRequests());
  };

  // Metrics
  const totalAssets = assets.length;
  const assignedAssets = assets.filter(a => a.status === AssetStatus.ALLOCATED).length;
  const reservedAssets = assets.filter(a => a.status === AssetStatus.RESERVED).length;
  const inStockAssets = assets.filter(a => a.status === AssetStatus.IN_STOCK).length;

  // Filter Logic
  const filteredAssets = assets.filter(a => 
    a.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.hostname && a.hostname.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredStaff = employees.filter(e => 
    e.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Combined Allocation Data for Search (Allocated + Reserved)
  const allocations = assets
    .filter(a => a.assignedTo && (a.status === AssetStatus.ALLOCATED || a.status === AssetStatus.RESERVED))
    .map(a => {
        const emp = employees.find(e => e.id === a.assignedTo || e.employeeId === a.assignedTo);
        return { asset: a, employee: emp };
    })
    .filter(item => 
        item.employee?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.employee?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.asset.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.asset.hostname && item.asset.hostname.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const filteredUAT = requests.filter(r => 
    r.status === RequestStatus.COMPLETED &&
    (r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
     r.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
     r.requestedLaptopModel.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openDownloadModal = (req: AssetRequest) => {
    setSelectedReqForDownload(req);
    setShowDownloadModal(true);
  };

  const handleDownloadPDF = () => {
    if (!selectedReqForDownload) return;
    
    // Prepare data for print view
    const emp = employees.find(e => e.id === selectedReqForDownload.employeeId || e.employeeId === selectedReqForDownload.employeeId);
    const asset = assets.find(a => a.id === selectedReqForDownload.assignedAssetId);

    setPrintReq(selectedReqForDownload);
    setPrintEmployee(emp || null);
    setPrintAsset(asset || null);

    // Close modal
    setShowDownloadModal(false);

    // Trigger Print
    setTimeout(() => {
        window.print();
        // Reset state after a delay to ensure print dialog has opened (optional, keeping it populated is fine too)
    }, 500);
  };

  const handleDownloadImage = () => {
      if (!selectedReqForDownload?.handoverPhoto) {
          alert("No photo evidence available for this record.");
          return;
      }
      const link = document.createElement('a');
      link.href = selectedReqForDownload.handoverPhoto;
      link.download = `UAF_Evidence_${selectedReqForDownload.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShowDownloadModal(false);
  };

  if (!user || (user.role !== 'IT' && user.role !== 'PowerIT')) return null;

  return (
    <div className="space-y-8 animate-[fadeIn_0.3s] print:m-0 print:p-0">
        
      {/* --- HIDDEN PRINT TEMPLATE --- */}
      {/* Only visible during print execution via CSS media query */}
      {printReq && (
         <div className="hidden print:block p-8 border border-slate-300 bg-white absolute top-0 left-0 w-full z-[9999]">
             <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
                <div className="flex items-center gap-4">
                    <img src="rain_1.png" className="w-16 h-16 object-contain grayscale" alt="RAIN" />
                    <div>
                        <h1 className="text-2xl font-black text-black tracking-tighter uppercase">Hardware Acceptance Form (UAF)</h1>
                        <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">Digital Chain of Custody Record</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs font-mono font-bold text-black">REF: {printReq.id}</p>
                    <p className="text-xs font-mono font-bold text-black">{new Date().toLocaleDateString()}</p>
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-2 border border-slate-300">
                        <p className="text-[10px] font-black uppercase text-slate-500">Employee Name</p>
                        <p className="font-bold text-sm text-black">{printEmployee?.firstName} {printEmployee?.lastName}</p>
                    </div>
                    <div className="p-2 border border-slate-300">
                        <p className="text-[10px] font-black uppercase text-slate-500">Employee ID</p>
                        <p className="font-bold text-sm text-black">{printEmployee?.employeeId}</p>
                    </div>
                    <div className="p-2 border border-slate-300">
                        <p className="text-[10px] font-black uppercase text-slate-500">Department</p>
                        <p className="font-bold text-sm text-black">{printEmployee?.department}</p>
                    </div>
                    <div className="p-2 border border-slate-300">
                        <p className="text-[10px] font-black uppercase text-slate-500">Location</p>
                        <p className="font-bold text-sm text-black">{printEmployee?.officeLocation}</p>
                    </div>
             </div>

             <div className="mb-6 p-4 border-2 border-black bg-slate-50">
                <h3 className="text-xs font-black uppercase tracking-widest mb-2 border-b border-black pb-1">Asset Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Model</p>
                        <p className="font-bold text-lg text-black">{printAsset?.model || printReq.requestedLaptopModel}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Asset Tag</p>
                        <p className="font-bold text-lg text-black">{printAsset?.assetTag || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Serial Number</p>
                        <p className="font-mono text-sm text-black">{printAsset?.serialNumber || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Handover Date</p>
                        <p className="font-mono text-sm text-black">{printReq.signedDate ? new Date(printReq.signedDate).toLocaleDateString() : 'PENDING'}</p>
                    </div>
                </div>
             </div>

             <div className="mt-8 pt-8 border-t border-slate-300">
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Employee Signature</p>
                        {printReq.signedUAT ? <img src={printReq.signedUAT} className="h-16 border border-slate-300" alt="Sig" /> : <div className="h-16 border border-dashed border-slate-300"></div>}
                        <p className="text-[9px] mt-1 text-slate-400">By signing, I accept responsibility for the hardware listed above.</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Deployment Engineer</p>
                        <div className="h-16 flex items-end">
                            <p className="font-bold text-sm text-black border-b border-black pb-1 w-full">{printReq.handoverItEngineerName} ({printReq.handoverItEngineerId})</p>
                        </div>
                    </div>
                </div>
             </div>

             <div className="mt-10 text-center text-[9px] text-slate-400 font-mono uppercase">
                Generated by RAIN Asset Management System (Archive Copy)
             </div>
         </div>
      )}
      {/* --- END PRINT TEMPLATE --- */}

      <div className="print:hidden">
        <header className="flex flex-col md:flex-row justify-between items-end border-b-2 border-slate-200 pb-8 gap-4">
            <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Central Registry</h1>
            <p className="text-slate-500 font-medium">Enterprise Asset Ledger & UAF Archives</p>
            <div className="flex gap-4 mt-4">
                <div className="bg-slate-900 text-white px-4 py-2 rounded-xl">
                    <span className="text-[10px] font-black uppercase tracking-widest block text-slate-400">Total Assets</span>
                    <span className="text-2xl font-black leading-none">{totalAssets}</span>
                </div>
                <div className="bg-emerald-600 text-white px-4 py-2 rounded-xl">
                    <span className="text-[10px] font-black uppercase tracking-widest block text-emerald-200">Deployed</span>
                    <span className="text-2xl font-black leading-none">{assignedAssets}</span>
                </div>
                <div className="bg-amber-500 text-white px-4 py-2 rounded-xl">
                    <span className="text-[10px] font-black uppercase tracking-widest block text-amber-100">Reserved</span>
                    <span className="text-2xl font-black leading-none">{reservedAssets}</span>
                </div>
                <div className="bg-teal-600 text-white px-4 py-2 rounded-xl">
                    <span className="text-[10px] font-black uppercase tracking-widest block text-teal-200">In Stock</span>
                    <span className="text-2xl font-black leading-none">{inStockAssets}</span>
                </div>
            </div>
            </div>
            <div className="flex flex-col items-end gap-4 w-full md:w-auto">
                <div className="relative w-full md:w-96">
                    <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input 
                        type="text" 
                        placeholder="Search by Name, Tag, or Hostname..." 
                        className="w-full pl-10 pr-4 py-3 bg-slate-100 border-none rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal-500 transition-all shadow-inner"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
                    <button onClick={() => setActiveTab('assets')} className={`flex-1 md:flex-none px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'assets' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400'}`}>Fleet</button>
                    <button onClick={() => setActiveTab('allocations')} className={`flex-1 md:flex-none px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'allocations' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400'}`}>Allocations</button>
                    <button onClick={() => setActiveTab('staff')} className={`flex-1 md:flex-none px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'staff' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400'}`}>Staff</button>
                    <button onClick={() => setActiveTab('uat')} className={`flex-1 md:flex-none px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'uat' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400'}`}>UAF Logs</button>
                </div>
            </div>
        </header>

        {activeTab === 'assets' && (
            <div className="grid grid-cols-1 gap-6">
                {filteredAssets.length === 0 ? <p className="text-center text-slate-400 italic font-bold">No assets found matching query.</p> :
                filteredAssets.map(asset => {
                    const assignedEmp = employees.find(e => e.id === asset.assignedTo || e.employeeId === asset.assignedTo);
                    return (
                        <div key={asset.id} className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm flex flex-col md:flex-row gap-8 items-center group hover:border-teal-500 transition-all">
                            <div className="w-48 h-48 bg-slate-50 rounded-[2.5rem] flex items-center justify-center p-6 border border-slate-100 group-hover:bg-teal-50/30 transition-colors relative overflow-hidden">
                                <i className={`fa-solid ${asset.type === 'Tablet' ? 'fa-tablet-screen-button' : 'fa-laptop'} text-5xl text-slate-200 group-hover:text-teal-500 transition-colors`}></i>
                            </div>
                            <div className="flex-1 space-y-4 w-full">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="bg-slate-900 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{asset.brand}</span>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1">{asset.model}</h3>
                                        <p className="font-mono text-xs text-teal-600 font-black uppercase mt-1">TAG: {asset.assetTag}</p>
                                    </div>
                                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border ${asset.status === AssetStatus.IN_STOCK ? 'bg-teal-50 border-teal-100 text-teal-600' : asset.status === AssetStatus.ALLOCATED ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : asset.status === AssetStatus.RESERVED ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                                        {asset.status}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-50">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase">Specifications</p>
                                        <p className="text-xs font-bold text-slate-700 mt-1">{asset.specs}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase">Vendor / PO</p>
                                        <p className="text-xs font-bold text-slate-700 mt-1">{asset.vendor} <span className="block text-[9px] text-slate-400 font-mono">{asset.poNumber}</span></p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase">Network Ident</p>
                                        <p className="text-xs font-mono font-black text-slate-600 mt-1 uppercase">{asset.hostname || 'UNPROVISIONED'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase">Custodian</p>
                                        <p className="text-xs font-bold text-slate-700 mt-1">{assignedEmp ? `${assignedEmp.firstName} ${assignedEmp.lastName}` : (asset.assignedTo || 'IT STORAGE')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}

        {activeTab === 'allocations' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-teal-600 text-white text-[10px] font-black uppercase tracking-widest">
                        <tr>
                            <th className="p-6">Employee Profile</th>
                            <th className="p-6">Assigned Asset</th>
                            <th className="p-6">Technical Identifiers</th>
                            <th className="p-6 text-right">Allocation Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {allocations.length === 0 ? <tr><td colSpan={4} className="p-10 text-center text-slate-400 font-bold italic">No active or reserved allocations found.</td></tr> :
                        allocations.map((item, idx) => (
                            <tr key={idx} className="hover:bg-teal-50/20 transition-colors">
                                <td className="p-6">
                                    <div className="font-black text-slate-900 text-sm">{item.employee?.firstName} {item.employee?.lastName}</div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">{item.employee?.department} | {item.employee?.employeeId}</div>
                                </td>
                                <td className="p-6">
                                    <div className="font-black text-slate-800 text-sm">{item.asset.model}</div>
                                    <div className="text-[10px] text-teal-600 font-bold uppercase mt-1">TAG: {item.asset.assetTag}</div>
                                </td>
                                <td className="p-6">
                                    <div className="font-mono text-xs font-bold text-slate-700">HOST: {item.asset.hostname || '---'}</div>
                                    <div className="font-mono text-[10px] text-slate-400 mt-1">SN: {item.asset.serialNumber}</div>
                                </td>
                                <td className="p-6 text-right">
                                    {item.asset.status === AssetStatus.ALLOCATED ? (
                                        <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                                            Active Deployment
                                        </span>
                                    ) : (
                                        <span className="bg-amber-100 text-amber-700 border border-amber-200 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                                            Reserved / Pending
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {activeTab === 'staff' && (
            <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                        <tr>
                            <th className="p-5">Subject (ID)</th>
                            <th className="p-5">Reporting Officer (RO)</th>
                            <th className="p-5">Assigned Hardware</th>
                            <th className="p-5">Lifecycle Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredStaff.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-slate-400 font-bold italic">No staff found.</td></tr> :
                        filteredStaff.map(e => {
                            const assignedAsset = assets.find(a => a.assignedTo === e.id || a.assignedTo === e.employeeId);
                            return (
                                <tr key={e.id} className="text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                                    <td className="p-5">
                                        <div className="font-black text-slate-900">{e.firstName} {e.lastName}</div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">{e.employeeId} | {e.role}</div>
                                    </td>
                                    <td className="p-5">
                                        <div className="font-bold">{e.reportingOfficerName}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">{e.reportingOfficerRole}</div>
                                    </td>
                                    <td className="p-5">
                                        {assignedAsset ? (
                                            <div>
                                                <div className="font-black text-slate-800 text-[10px] uppercase">{assignedAsset.model}</div>
                                                <div className="flex gap-2 mt-1">
                                                    <span className="text-slate-500 font-mono text-[9px] border border-slate-200 px-1 rounded bg-slate-50">{assignedAsset.assetTag}</span>
                                                    {assignedAsset.status === AssetStatus.RESERVED && (
                                                        <span className="text-amber-600 font-black text-[8px] bg-amber-50 px-1 rounded uppercase tracking-wider border border-amber-100">Reserved</span>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-slate-300 italic text-[10px] font-bold">Unassigned</span>
                                        )}
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm border ${
                                            e.status === 'New' ? 'bg-teal-500 text-white border-teal-600' :
                                            e.status === 'Promoted' ? 'bg-orange-500 text-white border-orange-600' :
                                            'bg-slate-900 text-white border-slate-700'
                                        }`}>
                                            {e.status}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        )}

        {activeTab === 'uat' && (
            <div className="grid grid-cols-1 gap-4">
                {filteredUAT.length === 0 ? <p className="text-center text-slate-400 italic font-bold">No signed UAF forms found.</p> :
                filteredUAT.map(req => {
                    const emp = employees.find(e => e.id === req.employeeId || e.employeeId === req.employeeId);
                    const asset = assets.find(a => a.id === req.assignedAssetId);
                    return (
                        <div key={req.id} className="bg-white border-l-4 border-teal-500 rounded-r-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 hover:shadow-md transition-all">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-2 py-0.5 rounded uppercase">REQ: {req.id}</span>
                                    <span className="text-[10px] text-teal-600 font-bold uppercase tracking-widest"><i className="fa-solid fa-clock mr-1"></i> {req.signedDate ? new Date(req.signedDate).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                <h3 className="text-xl font-black text-slate-900">{emp?.firstName} {emp?.lastName}</h3>
                                <p className="text-xs font-medium text-slate-500 uppercase">{emp?.department} — {req.type}</p>
                                <div className="mt-4 flex gap-4">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase">Asset Tag</p>
                                        <p className="text-xs font-mono font-bold text-slate-800">{asset?.assetTag || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase">Model</p>
                                        <p className="text-xs font-bold text-slate-800">{req.requestedLaptopModel}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                {req.signedUAT && (
                                    <div className="text-center">
                                        <img src={req.signedUAT} alt="Sig" className="h-12 border border-slate-200 rounded bg-white p-1" />
                                        <p className="text-[8px] font-black text-slate-400 uppercase mt-1">Digital Sig</p>
                                    </div>
                                )}
                                {req.handoverPhoto && (
                                    <div className="text-center group cursor-pointer relative">
                                        <img src={req.handoverPhoto} alt="Proof" className="h-12 w-12 object-cover border border-slate-200 rounded-lg" />
                                        <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center rounded-lg text-white text-[8px] font-black uppercase">View</div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase mt-1">Proof</p>
                                    </div>
                                )}
                            </div>
                            <div className="text-right">
                                <button onClick={() => openDownloadModal(req)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-teal-600 transition-colors">
                                    <i className="fa-solid fa-download mr-2"></i> Download
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        )}
      </div>

      {/* Download Selection Modal */}
      {showDownloadModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm border border-slate-200 shadow-2xl animate-[fadeIn_0.2s]">
                  <h3 className="text-xl font-black uppercase tracking-tight mb-6 text-center">Download Options</h3>
                  <div className="space-y-4">
                      <button onClick={handleDownloadPDF} className="w-full bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-between group">
                          <span>UAF Form (PDF)</span>
                          <i className="fa-solid fa-file-pdf text-lg text-slate-400 group-hover:text-white transition-colors"></i>
                      </button>
                      <button onClick={handleDownloadImage} disabled={!selectedReqForDownload?.handoverPhoto} className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white p-4 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-between group">
                          <span>Photo Evidence (JPG)</span>
                          <i className="fa-solid fa-image text-lg text-teal-200 group-hover:text-white transition-colors"></i>
                      </button>
                  </div>
                  <button onClick={() => setShowDownloadModal(false)} className="w-full mt-6 text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest">Cancel</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default DatabasePortal;
