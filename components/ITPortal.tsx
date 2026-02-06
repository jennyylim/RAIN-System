
import React, { useEffect, useState } from 'react';
import { DataService, AuthService } from '../services/store';
import { Asset, AssetStatus, RequestStatus, AssetRequest, Employee } from '../types';
import { useNavigate } from 'react-router-dom';

const ITPortal: React.FC = () => {
  const navigate = useNavigate();
  const user = AuthService.getCurrentUser();

  // Secure Access Check
  useEffect(() => {
    if (!user) {
        navigate('/login');
        return;
    }
    // Allow IT and PowerIT roles
    if (user.role !== 'IT' && user.role !== 'PowerIT') {
        navigate('/login');
    }
  }, [user?.username, navigate]);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [requests, setRequests] = useState<AssetRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false); // Add/Edit Asset
  const [showImportModal, setShowImportModal] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'inventory' | 'requests'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [notificationMsg, setNotificationMsg] = useState('');
  const [showAllStock, setShowAllStock] = useState(false);

  // Assignment Modal State
  const [selectedReq, setSelectedReq] = useState<AssetRequest | null>(null);
  const [assignHostname, setAssignHostname] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');

  // Asset Modal State
  const initialAsset: Asset = {
      id: '', assetTag: '', brand: 'Dell', model: '', specs: '', serialNumber: '', type: 'Laptop',
      status: AssetStatus.IN_STOCK, purchaseDate: '', vendor: '', poNumber: '', macAddress: '',
      peripherals: { kensingtonLock: false, powerAdapter: true, mouse: false, notebookBag: false, keyboard: false }
  };
  const [assetForm, setAssetForm] = useState<Asset>(initialAsset);
  const [isEditingAsset, setIsEditingAsset] = useState(false);
  const [importText, setImportText] = useState('');

  // Initial Data Load
  useEffect(() => {
    if (user && (user.role === 'IT' || user.role === 'PowerIT')) {
        DataService.checkVendorReturns();
        refreshData();
    }
  }, [user?.username]);

  const refreshData = () => {
    setAssets(DataService.getAssets());
    setRequests(DataService.getRequests());
    setEmployees(DataService.getEmployees());
  };

  const handleEditAsset = (asset: Asset) => {
      setAssetForm(asset);
      setIsEditingAsset(true);
      setShowAssetModal(true);
  };

  const handleAddAsset = () => {
      setAssetForm({
          ...initialAsset,
          id: `ast-${Date.now()}`,
          purchaseDate: new Date().toISOString().split('T')[0]
      });
      setIsEditingAsset(false);
      setShowAssetModal(true);
  };

  const saveAsset = (e: React.FormEvent) => {
      e.preventDefault();
      DataService.saveAsset(assetForm);
      setShowAssetModal(false);
      refreshData();
      setNotificationMsg(isEditingAsset ? 'Asset Updated Successfully' : 'New Asset Added to Fleet');
      setTimeout(() => setNotificationMsg(''), 3000);
  };

  const handleImportAssets = () => {
      if (!importText) return;
      try {
          const lines = importText.split('\n');
          // Simple CSV parse: Tag,Model,SN,Brand
          const newAssets: Asset[] = lines.map((line, idx) => {
              const [tag, model, sn, brand] = line.split(',');
              return {
                  ...initialAsset,
                  id: `imp-${Date.now()}-${idx}`,
                  assetTag: tag?.trim(),
                  model: model?.trim(),
                  serialNumber: sn?.trim(),
                  brand: brand?.trim() || 'Generic',
                  status: AssetStatus.IN_STOCK,
                  purchaseDate: new Date().toISOString().split('T')[0]
              } as Asset;
          }).filter(a => a.assetTag && a.serialNumber);
          
          DataService.bulkImportAssets(newAssets);
          setShowImportModal(false);
          setImportText('');
          refreshData();
          setNotificationMsg(`${newAssets.length} Assets Imported`);
          setTimeout(() => setNotificationMsg(''), 3000);
      } catch (e) {
          alert('Error parsing CSV. Format: Tag,Model,Serial,Brand');
      }
  };

  const openAssignModal = (req: AssetRequest) => {
    setSelectedReq(req);
    const prefix = req.requestedLaptopModel.split(' ')[0] || 'IT';
    const suffix = (req.employeeId || 'USR').toUpperCase().split('-').pop();
    setAssignHostname(req.hostname || `${prefix}-${suffix}`);
    setSelectedAssetId('');
    setShowAllStock(false);
    setShowAssignModal(true);
  };

  const handleAssignAssetExecute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq || !selectedAssetId) {
        alert("Please select a valid asset to continue.");
        return;
    }

    const success = DataService.fulfillRequest(selectedReq.id, selectedAssetId, assignHostname);
    
    if (success) {
      setNotificationMsg(`Fulfillment locked. Request ${selectedReq.id} moved to Ready for Collection.`);
      setShowAssignModal(false);
      refreshData();
      setTimeout(() => setNotificationMsg(''), 4000);
    } else {
      alert("Error: Database constraint failure. Asset might no longer be in stock.");
    }
  };

  // Resolve Employee Name helper
  const getEmployeeName = (id?: string) => {
      if (!id) return 'Unassigned';
      if (id === 'IT STORAGE') return 'IT Storage';
      const emp = employees.find(e => e.id === id || e.employeeId === id);
      return emp ? `${emp.firstName} ${emp.lastName}` : id;
  };

  const filteredAssets = assets.filter(a => 
      a.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.assignedTo && getEmployeeName(a.assignedTo).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getAvailableStock = (model: string) => {
    if (showAllStock) {
        return assets.filter(a => a.status === AssetStatus.IN_STOCK);
    }
    return assets.filter(a => 
      a.status === AssetStatus.IN_STOCK && 
      (a.model.toLowerCase().includes(model.toLowerCase()) || a.brand.toLowerCase().includes(model.toLowerCase()))
    );
  };

  if (!user || (user.role !== 'IT' && user.role !== 'PowerIT')) return null;

  return (
    <div className="space-y-6">
      {notificationMsg && (
          <div className="fixed top-4 right-4 bg-teal-600 text-white px-8 py-5 rounded-[1.5rem] shadow-2xl z-50 animate-[fadeIn_0.5s] border border-teal-500 font-black">
              <i className="fa-solid fa-cloud-check mr-3"></i> {notificationMsg}
          </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Fleet Control</h1>
          <p className="text-slate-500 font-medium italic text-xs">Global Fleet Control & Provisioning Terminal</p>
        </div>
        <div className="flex gap-3">
             <button onClick={handleAddAsset} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                 <i className="fa-solid fa-plus mr-2"></i> Add Asset
             </button>
             <button onClick={() => setShowImportModal(true)} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                 <i className="fa-solid fa-file-import mr-2"></i> Import
             </button>
             {user.role === 'PowerIT' && (
                <div className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border border-purple-200">
                    <i className="fa-solid fa-bolt mr-2"></i> Power User Mode
                </div>
             )}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 flex">
          <button onClick={() => setActiveTab('inventory')} className={`px-8 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-white border-b-2 border-teal-600 text-teal-600 shadow-sm' : 'text-slate-400'}`}>Inventory</button>
          <button onClick={() => setActiveTab('requests')} className={`px-8 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'requests' ? 'bg-white border-b-2 border-teal-600 text-teal-600 shadow-sm' : 'text-slate-400'}`}>Fulfillment {requests.filter(r => r.status === RequestStatus.PENDING).length > 0 && <span className="ml-2 bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full animate-pulse">New</span>}</button>
        </div>

        <div className="p-8">
          {activeTab === 'inventory' && (
            <div className="space-y-4">
               <div className="relative mb-6">
                 <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                 <input type="text" placeholder="Filter fleet records by Tag, Model, or Custodian..." className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
               </div>
               <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="pb-4 pl-2">Asset Tag</th>
                        <th className="pb-4">Model</th>
                        <th className="pb-4">Status</th>
                        <th className="pb-4">Custodian</th>
                        <th className="pb-4 text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-50 font-medium">
                    {filteredAssets.map(asset => (
                        <tr key={asset.id} className="hover:bg-teal-50/30 transition-colors">
                        <td className="py-4 pl-2 font-mono text-slate-400">{asset.assetTag}</td>
                        <td className="py-4 font-bold text-slate-800">{asset.model}</td>
                        <td className="py-4">
                            <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter border ${
                            asset.status === AssetStatus.IN_STOCK ? 'bg-teal-50 text-teal-700 border-teal-100' :
                            asset.status === AssetStatus.RESERVED ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            asset.status === AssetStatus.ALLOCATED ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            asset.status === AssetStatus.FAULTY ? 'bg-red-50 text-red-700 border-red-100' :
                            'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                            {asset.status}
                            </span>
                        </td>
                        <td className="py-4 text-xs font-bold text-slate-700 uppercase">
                            {asset.assignedTo ? (
                                <span className="flex items-center gap-2">
                                    <i className="fa-solid fa-user-tag text-slate-300"></i>
                                    {getEmployeeName(asset.assignedTo)}
                                </span>
                            ) : (
                                <span className="text-slate-300 italic">Unassigned</span>
                            )}
                        </td>
                         <td className="py-4 text-right">
                             <button onClick={() => handleEditAsset(asset)} className="text-slate-400 hover:text-teal-600 transition-colors">
                                 <i className="fa-solid fa-pen-to-square"></i>
                             </button>
                         </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
               </div>
            </div>
          )}

          {activeTab === 'requests' && (
             <div className="space-y-6">
               {requests.filter(r => r.status !== RequestStatus.COMPLETED && r.status !== RequestStatus.RETURNED).length === 0 ? (
                 <div className="text-center py-20 text-slate-300 font-black uppercase tracking-widest italic">
                    No active provisioning requests
                 </div>
               ) : (
                 requests.filter(r => r.status !== RequestStatus.COMPLETED && r.status !== RequestStatus.RETURNED).map(req => {
                   const emp = employees.find(e => e.id === req.employeeId || e.employeeId === req.employeeId);
                   const inStockCount = getAvailableStock(req.requestedLaptopModel).length;
                   return (
                     <div key={req.id} className="border border-slate-100 rounded-[2rem] p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white hover:shadow-xl transition-all border-2">
                        <div className="flex-1">
                          <div className="flex gap-2 mb-4">
                              <span className="bg-slate-900 text-white text-[9px] uppercase font-black px-3 py-1 rounded-full tracking-widest">{req.type || 'INDIVIDUAL'}</span>
                              <span className={`text-[9px] uppercase font-black px-3 py-1 rounded-full border tracking-widest ${req.status === RequestStatus.READY_FOR_COLLECTION ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-teal-100 text-teal-700 border-teal-200'}`}>
                                  {req.status === RequestStatus.READY_FOR_COLLECTION ? 'READY FOR UAT' : req.collectionDate}
                              </span>
                          </div>
                          <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">{emp?.firstName} {emp?.lastName}</h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 mb-4">{emp?.department} | {emp?.role}</p>
                          <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-600">
                            <p><span className="text-slate-400 uppercase text-[9px] block mb-0.5">Asset Requested:</span> {req.requestedLaptopModel}</p>
                            <p><span className="text-slate-400 uppercase text-[9px] block mb-0.5">Stock Available:</span> <span className={inStockCount > 0 ? 'text-teal-600' : 'text-red-500 font-black'}>{inStockCount} Units</span></p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-3">
                          <button onClick={() => openAssignModal(req)} className="bg-teal-600 hover:bg-teal-700 text-white px-10 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-teal-600/20 active:scale-[0.98] transition-all">
                              {req.status === RequestStatus.READY_FOR_COLLECTION ? 'Edit Selection' : 'Provision Hardware'}
                          </button>
                        </div>
                     </div>
                   )
                 })
               )}
             </div>
          )}
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && selectedReq && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s]">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full p-10 border border-slate-200">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Provisioning Terminal</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase mt-1">Request: {selectedReq.requestedLaptopModel}</p>
                </div>
                <button onClick={() => setShowAssignModal(false)} className="text-slate-300 hover:text-red-500 transition-colors"><i className="fa-solid fa-circle-xmark text-2xl"></i></button>
            </div>

            <form onSubmit={handleAssignAssetExecute} className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Mapping (Select Unit)</label>
                    <button type="button" onClick={() => setShowAllStock(!showAllStock)} className="text-[9px] font-black text-teal-600 uppercase tracking-widest border border-teal-100 px-2 py-0.5 rounded-md hover:bg-teal-50 transition-all">
                        {showAllStock ? 'Show Model Matches' : 'Show All In Stock'}
                    </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar p-2 border-2 border-slate-50 rounded-2xl">
                  {getAvailableStock(selectedReq.requestedLaptopModel).length === 0 ? (
                      <div className="p-8 text-center flex flex-col items-center gap-3">
                        <i className="fa-solid fa-triangle-exclamation text-red-500 text-3xl"></i>
                        <p className="text-red-500 font-black text-xs uppercase italic leading-tight">Zero inventory for {selectedReq.requestedLaptopModel}. Select "Show All Stock" to allocate alternative hardware.</p>
                      </div>
                  ) : (
                    getAvailableStock(selectedReq.requestedLaptopModel).map(a => (
                        <label key={a.id} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${selectedAssetId === a.id ? 'bg-teal-50 border-teal-500' : 'bg-white border-slate-100 hover:border-teal-100'}`}>
                          <div>
                            <p className="font-black text-sm text-slate-800">{a.assetTag}</p>
                            <p className="text-[10px] font-mono text-slate-400">SN: {a.serialNumber} | {a.model}</p>
                          </div>
                          <input required type="radio" name="assetSelection" className="w-5 h-5 accent-teal-600" checked={selectedAssetId === a.id} onChange={() => setSelectedAssetId(a.id)} />
                        </label>
                      ))
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Assigned Hostname</label>
                <input required type="text" className="w-full border-2 border-slate-100 bg-slate-50 rounded-2xl p-4 font-mono font-black text-teal-600 outline-none uppercase" value={assignHostname} onChange={e => setAssignHostname(e.target.value.toUpperCase())} />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAssignModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black uppercase text-xs py-5 rounded-2xl transition-colors">Cancel</button>
                <button type="submit" disabled={!selectedAssetId} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-black uppercase text-xs py-5 rounded-2xl shadow-xl shadow-teal-600/20 disabled:opacity-30 transition-all">Assign & Lock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Asset Add/Edit Modal */}
      {showAssetModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
               <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg p-8 border border-slate-200 max-h-[90vh] overflow-y-auto">
                   <div className="flex justify-between items-center mb-6">
                       <h3 className="text-xl font-black uppercase tracking-tight">{isEditingAsset ? 'Edit Asset' : 'Add New Asset'}</h3>
                       <button onClick={() => setShowAssetModal(false)}><i className="fa-solid fa-times text-slate-300 hover:text-red-500"></i></button>
                   </div>
                   <form onSubmit={saveAsset} className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="text-[10px] font-black uppercase text-slate-400">Asset Tag</label>
                               <input required className="w-full border rounded-xl p-3 text-sm font-bold" value={assetForm.assetTag} onChange={e => setAssetForm({...assetForm, assetTag: e.target.value})} />
                           </div>
                           <div>
                               <label className="text-[10px] font-black uppercase text-slate-400">Serial Number</label>
                               <input required className="w-full border rounded-xl p-3 text-sm font-bold" value={assetForm.serialNumber} onChange={e => setAssetForm({...assetForm, serialNumber: e.target.value})} />
                           </div>
                       </div>
                       <div>
                            <label className="text-[10px] font-black uppercase text-slate-400">Model</label>
                            <input required className="w-full border rounded-xl p-3 text-sm font-bold" value={assetForm.model} onChange={e => setAssetForm({...assetForm, model: e.target.value})} />
                       </div>
                       <div>
                            <label className="text-[10px] font-black uppercase text-slate-400">Condition / Status</label>
                            <select className="w-full border rounded-xl p-3 text-sm font-bold" value={assetForm.status} onChange={e => setAssetForm({...assetForm, status: e.target.value as AssetStatus})}>
                                <option value={AssetStatus.IN_STOCK}>Ready for Deployment (In Stock)</option>
                                <option value={AssetStatus.FAULTY}>Faulty (Hold)</option>
                                <option value={AssetStatus.UNDER_REPAIR}>Sent for Repair</option>
                                <option value={AssetStatus.VENDOR_RETURN}>Return to Vendor</option>
                                <option value={AssetStatus.RETIRED}>Retired / Disposal</option>
                            </select>
                       </div>
                       <button type="submit" className="w-full bg-teal-600 text-white font-black uppercase text-xs py-4 rounded-xl shadow-lg mt-4">Save Configuration</button>
                   </form>
               </div>
          </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg p-8 border border-slate-200">
                  <h3 className="text-xl font-black uppercase tracking-tight mb-4">Import Assets</h3>
                  <p className="text-xs text-slate-500 mb-2">Paste CSV Data: AssetTag, Model, Serial, Brand</p>
                  <textarea className="w-full h-40 border border-slate-200 rounded-xl p-4 text-xs font-mono mb-4" placeholder="IT-2025-L001, Dell Latitude, SN12345, Dell" value={importText} onChange={e => setImportText(e.target.value)}></textarea>
                  <div className="flex gap-4">
                      <button onClick={() => setShowImportModal(false)} className="flex-1 bg-slate-100 text-slate-600 font-black uppercase text-xs py-3 rounded-xl">Cancel</button>
                      <button onClick={handleImportAssets} className="flex-1 bg-teal-600 text-white font-black uppercase text-xs py-3 rounded-xl">Process Import</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default ITPortal;
