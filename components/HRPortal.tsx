
import React, { useState, useEffect } from 'react';
import { DataService, AuthService } from '../services/store';
import { RequestStatus, AssetStatus, COLLECTION_SLOTS, Employee, AssetRequest, EmployeeStatus, SOFTWARE_CATALOG, HARDWARE_ACCESSORIES } from '../types';
import { useNavigate } from 'react-router-dom';

const HRPortal: React.FC = () => {
  const navigate = useNavigate();
  const user = AuthService.getCurrentUser();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [requests, setRequests] = useState<AssetRequest[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'directory' | 'request'>('directory');
  
  // Date Logic
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];
  
  const maxDateObj = new Date(today);
  maxDateObj.setMonth(maxDateObj.getMonth() + 3);
  const maxDate = maxDateObj.toISOString().split('T')[0];

  useEffect(() => {
    if (!user || (user.role !== 'HR' && user.role !== 'PowerIT')) {
        navigate('/login');
        return;
    }
    refreshData();
  }, [user?.username, navigate]);

  const refreshData = () => {
    setEmployees(DataService.getEmployees());
    setRequests(DataService.getRequests());
    setAssets(DataService.getAssets());
  };

  const [formData, setFormData] = useState({
    employeeId: '',
    status: 'New' as EmployeeStatus,
    model: 'Dell Latitude 7350',
    collectionDate: minDate,
    collectionTime: '09:00 AM',
    software: [] as string[],
    hardware: [] as string[],
    othersHardware: ''
  });

  const handleSoftwareToggle = (name: string) => {
    setFormData(prev => ({
      ...prev,
      software: prev.software.includes(name) ? prev.software.filter(s => s !== name) : [...prev.software, name]
    }));
  };

  const handleHardwareToggle = (name: string) => {
    setFormData(prev => ({
      ...prev,
      hardware: prev.hardware.includes(name) ? prev.hardware.filter(h => h !== name) : [...prev.hardware, name]
    }));
  };

  const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;
  const isPublicHoliday = (dateStr: string) => {
      // Mock Public Holidays
      const holidays = ['2025-12-25', '2025-01-01', '2025-08-09', '2025-05-01'];
      return holidays.includes(dateStr);
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.employeeId === formData.employeeId);
    if (!emp) return alert("Select a valid employee.");

    // Strict Date Validation
    const selectedDate = new Date(formData.collectionDate);
    const dateStr = formData.collectionDate;

    // Check bounds
    const todayZero = new Date(); todayZero.setHours(0,0,0,0);
    const diffTime = selectedDate.getTime() - todayZero.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (diffDays < 1) return alert("Booking must be made at least 1 day in advance.");
    if (selectedDate > maxDateObj) return alert("Booking cannot be more than 3 months in advance.");

    // Check Weekend
    if (isWeekend(selectedDate)) return alert("Collections cannot be scheduled on weekends.");
    
    // Check Holiday
    if (isPublicHoliday(dateStr)) return alert("Selected date is a Public Holiday.");

    const req: AssetRequest = {
      id: `req-${Date.now()}`,
      type: formData.status === 'Promoted' ? 'UPGRADE_PROMOTION' : (formData.status === 'Secure User' ? 'SECURE_SETUP' : 'INDIVIDUAL'),
      employeeId: emp.id, 
      requestedLaptopModel: formData.model,
      requiredSoftware: formData.software,
      requiredHardware: formData.hardware,
      othersHardware: formData.othersHardware,
      collectionDate: formData.collectionDate,
      collectionTime: formData.collectionTime,
      status: RequestStatus.PENDING
    };

    DataService.saveRequest(req);
    alert(`BROADCAST SUCCESS: Request for ${emp.firstName} broadcasted to Fleet Control. Status: REQUEST PENDING.`);
    setActiveTab('directory');
    refreshData();
  };

  const getEmployeeAssetStatus = (emp: Employee) => {
    const myAssets = assets.filter(a => a.assignedTo === emp.id || a.assignedTo === emp.employeeId);
    if (myAssets.some(a => a.status === AssetStatus.ALLOCATED)) {
      const tag = myAssets.find(a => a.status === AssetStatus.ALLOCATED)?.assetTag;
      return { label: `Allocated: ${tag}`, color: 'bg-emerald-600 text-white shadow-emerald-200' };
    }
    
    const myRequests = requests.filter(r => r.employeeId === emp.id || r.employeeId === emp.employeeId);
    const activeReq = myRequests.find(r => r.status !== RequestStatus.COMPLETED && r.status !== RequestStatus.RETURNED);
    
    if (activeReq) {
      if (activeReq.status === RequestStatus.READY_FOR_COLLECTION) {
        return { label: 'Hardware Locked', color: 'bg-amber-500 text-white shadow-amber-200 animate-pulse' };
      }
      return { label: 'Request Pending', color: 'bg-indigo-600 text-white shadow-indigo-200' };
    }
    
    return { label: 'No Active Assets', color: 'bg-slate-100 text-slate-400 border-slate-200' };
  };

  const getEmployeeRequests = (emp: Employee) => {
    return requests.filter(r => r.employeeId === emp.id || r.employeeId === emp.employeeId);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 flex">
          <button onClick={() => { setActiveTab('directory'); refreshData(); }} className={`px-8 py-5 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'directory' ? 'bg-white border-b-2 border-teal-600 text-teal-600' : 'text-slate-400'}`}>
            <i className="fa-solid fa-address-book mr-2"></i> Staff Directory
          </button>
          <button onClick={() => setActiveTab('request')} className={`px-8 py-5 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'request' ? 'bg-white border-b-2 border-teal-600 text-teal-600' : 'text-slate-400'}`}>
            <i className="fa-solid fa-plus-circle mr-2"></i> New Asset Request
          </button>
        </div>

        <div className="p-10">
          {activeTab === 'directory' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase italic">Personnel Hub</h2>
                <div className="flex gap-4">
                  <button onClick={() => { DataService.bulkImportEmployees(); refreshData(); }} className="bg-slate-100 text-slate-600 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest border border-slate-200 hover:bg-slate-200">
                    <i className="fa-solid fa-file-import mr-2"></i> Bulk Import (100)
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto custom-scrollbar border border-slate-100 rounded-3xl">
                <table className="w-full text-left">
                  <thead className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 bg-slate-50/50">
                    <tr>
                      <th className="p-6">Staff Profile</th>
                      <th className="p-6">Provisioning Status</th>
                      <th className="p-6">Requested Manifest</th>
                      <th className="p-6">Reporting Officer</th>
                      <th className="p-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {employees.map(emp => {
                      const status = getEmployeeAssetStatus(emp);
                      const myRequests = getEmployeeRequests(emp);
                      const latestReq = myRequests[myRequests.length - 1];
                      return (
                        <tr key={emp.id} className="group hover:bg-teal-50/20 transition-colors">
                          <td className="p-6">
                            <div className="font-black text-slate-800 leading-none">{emp.firstName} {emp.lastName}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">{emp.employeeId} | {emp.role}</div>
                            <div className="text-[9px] text-teal-600 font-mono mt-1">{emp.email}</div>
                          </td>
                          <td className="p-6">
                            <span className={`${status.color} text-[10px] font-black uppercase px-4 py-2 rounded-xl shadow-lg tracking-tight inline-block`}>
                                {status.label}
                            </span>
                          </td>
                          <td className="p-6">
                            {latestReq ? (
                              <div className="space-y-1">
                                <div className="text-[10px] font-black text-slate-700 uppercase">HW: {latestReq.requestedLaptopModel}</div>
                                <div className="flex flex-wrap gap-1">
                                  {latestReq.requiredSoftware?.map(s => (
                                    <span key={s} className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 uppercase font-black">{s}</span>
                                  ))}
                                  {latestReq.requiredHardware?.map(h => (
                                    <span key={h} className="text-[8px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100 uppercase font-black">{h}</span>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-300 italic font-bold">No manifest found</span>
                            )}
                          </td>
                          <td className="p-6">
                            <div className="text-[11px] font-bold text-slate-700">{emp.reportingOfficerName}</div>
                            <div className="text-[9px] text-slate-400 font-mono">{emp.department}</div>
                          </td>
                          <td className="p-6 text-right">
                            <button className="border-2 border-slate-100 text-slate-300 text-[10px] font-black uppercase px-4 py-2 rounded-xl group-hover:border-red-100 group-hover:text-red-500 transition-all">Archive</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'request' && (
            <form onSubmit={handleSubmitRequest} className="max-w-4xl mx-auto space-y-10 animate-[fadeIn_0.3s]">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Select Target Employee</label>
                <select required className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:border-teal-300 transition-all shadow-sm"
                  value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})}>
                  <option value="">Select Target Employee...</option>
                  {employees.map(e => <option key={e.id} value={e.employeeId}>{e.firstName} {e.lastName} ({e.employeeId}) - {e.department}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deployment Context</label>
                  <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-700 outline-none"
                    value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as EmployeeStatus})}>
                    <option value="New">Onboarding / Individual Standard</option>
                    <option value="Promoted">Upgrade / Promotion Exchange</option>
                    <option value="Secure User">Secure / High-Clearance Node</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hardware Blueprint</label>
                  <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-700 outline-none"
                    value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})}>
                    <option>Dell Latitude 7350</option>
                    <option>HP EliteBook 640 G11</option>
                    <option>MacBook Pro 14</option>
                    <option>Lenovo ThinkBook 14 Gen 8</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-4 block">Software Requirements</label>
                <div className="bg-slate-50 p-6 rounded-3xl grid grid-cols-4 gap-4 border border-slate-100">
                  {SOFTWARE_CATALOG.map(item => (
                    <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${formData.software.includes(item.name) ? 'bg-teal-600 border-teal-600 text-white shadow-sm' : 'bg-white border-slate-200'}`}>
                        <i className={`fa-solid fa-check text-[10px] ${formData.software.includes(item.name) ? 'block' : 'hidden'}`}></i>
                      </div>
                      <input type="checkbox" className="hidden" checked={formData.software.includes(item.name)} onChange={() => handleSoftwareToggle(item.name)} />
                      <span className="text-[11px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{item.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-4 block">Hardware Accessories</label>
                <div className="bg-slate-50 p-6 rounded-3xl grid grid-cols-3 gap-4 border border-slate-100">
                  {HARDWARE_ACCESSORIES.map(item => (
                    <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${formData.hardware.includes(item.name) ? 'bg-teal-600 border-teal-600 text-white shadow-sm' : 'bg-white border-slate-200'}`}>
                        <i className={`fa-solid fa-check text-[10px] ${formData.hardware.includes(item.name) ? 'block' : 'hidden'}`}></i>
                      </div>
                      <input type="checkbox" className="hidden" checked={formData.hardware.includes(item.name)} onChange={() => handleHardwareToggle(item.name)} />
                      <span className="text-[11px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{item.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block">Handover Date (Mon-Fri only, +1 Day)</label>
                    <input 
                        type="date" 
                        required 
                        min={minDate}
                        max={maxDate}
                        className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none focus:border-teal-300 shadow-sm invalid:border-red-300"
                        value={formData.collectionDate} 
                        onChange={e => setFormData({...formData, collectionDate: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block">Preparation Window</label>
                    <select className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none focus:border-teal-300"
                      value={formData.collectionTime} onChange={e => setFormData({...formData, collectionTime: e.target.value})}>
                      {COLLECTION_SLOTS.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white py-6 rounded-[2.5rem] font-black uppercase text-lg tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95">
                Confirm Appointment & Broadcast <i className="fa-solid fa-paper-plane"></i>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default HRPortal;
