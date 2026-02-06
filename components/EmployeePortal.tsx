
import React, { useState, useRef, useEffect } from 'react';
import { DataService, AuthService } from '../services/store';
import { AssetRequest, RequestStatus, ITEngineer, Employee } from '../types';
import { useNavigate } from 'react-router-dom';

const EmployeePortal: React.FC = () => {
  const navigate = useNavigate();
  const user = AuthService.getCurrentUser();
  const [activeReq, setActiveReq] = useState<AssetRequest | null>(null);
  const [employeeData, setEmployeeData] = useState<Employee | null>(null);
  const [syncPhase, setSyncPhase] = useState<'idle' | 'archiving' | 'sql_update' | 'finalizing'>('idle');
  
  const [engineers, setEngineers] = useState<ITEngineer[]>([]);
  const [selectedItEngId, setSelectedItEngId] = useState('');
  const [checklist, setChecklist] = useState({ condition: false, login: false });
  const [uatRemarks, setUatRemarks] = useState('');
  const [handoverPhoto, setHandoverPhoto] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (!user) {
        navigate('/login');
        return;
    }
    setEngineers(DataService.getWitnesses().filter(e => e.active));
    const employees = DataService.getEmployees();
    
    // Simulation logic to get data for demo (in prod this would fetch from API based on user.id)
    const targetId = user.id || 'EMP-UAT-99';
    const me = employees.find(e => e.id === targetId || e.employeeId === targetId || e.email === user.username);
    
    if (me) {
        setEmployeeData(me);
        loadRequest(me.id);
    } else {
         // Fallback for PowerIT demo
        if (employees.length > 0) {
            setEmployeeData(employees[0]);
            loadRequest(employees[0].id);
        }
    }
  }, [user?.username]);

  const loadRequest = (id: string) => {
    const requests = DataService.getRequests();
    const myRequests = requests.filter(r => r.employeeId === id);
    let req = myRequests.find(r => r.status === RequestStatus.READY_FOR_COLLECTION);
    if (!req) req = myRequests.find(r => r.status === RequestStatus.COMPLETED);
    setActiveReq(req || null);
  };

  const handleLogout = () => {
    AuthService.logout();
    navigate('/login');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setHandoverPhoto(reader.result as string);
        reader.readAsDataURL(file);
    }
  };

  const startDrawing = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#000';
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };
  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };
  const stopDrawing = () => setIsDrawing(false);
  const clearSignature = () => canvasRef.current?.getContext('2d')?.clearRect(0, 0, 800, 200);

  const handleSubmitUAT = async () => {
    if (!activeReq) return;
    
    if (!checklist.condition || !checklist.login) {
        alert("Action Required: Please complete the Diagnostic Checkpoints.");
        return;
    }
    if (!canvasRef.current) {
        alert("System Error: Signature pad not initialized.");
        return;
    }

    setSyncPhase('sql_update');

    try {
        const signatureUrl = canvasRef.current.toDataURL();
        
        // Call Backend API
        const response = await fetch('/api/uat/sign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requestId: activeReq.id,
                employeeId: activeReq.employeeId,
                assetId: activeReq.assignedAssetId,
                signatureUrl: signatureUrl,
                photoUrl: handoverPhoto,
                remarks: uatRemarks
            })
        });

        if (response.ok) {
            setSyncPhase('finalizing');
            
            // Handle PDF Download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `RAIN_UAT_${activeReq.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);

            // Update Local State for UI
            const updatedReq: AssetRequest = { 
                ...activeReq, 
                status: RequestStatus.COMPLETED,
                signedDate: new Date().toISOString()
            };
            DataService.saveRequest(updatedReq); // Keep local storage in sync for demo
            setActiveReq(updatedReq);
            alert("UAT Signed & PDF Receipt Generated!");
        } else {
            alert("Server Error: Failed to sign UAT.");
        }
    } catch (error) {
        console.error(error);
        alert("Network Error during UAT submission.");
    } finally {
        setSyncPhase('idle');
    }
  };

  const currentAsset = activeReq?.assignedAssetId ? DataService.getAssets().find(a => a.id === activeReq.assignedAssetId) : null;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 relative">
      {syncPhase !== 'idle' && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex flex-col items-center justify-center text-white text-center p-8">
              <div className="relative w-24 h-24 mb-10">
                <div className="absolute inset-0 border-4 border-teal-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h2 className="text-3xl font-black italic uppercase tracking-[0.2em] mb-4">Syncing to Azure</h2>
              <p className="text-teal-400 font-mono">Generating Secure PDF Receipt...</p>
          </div>
      )}

      <div className="bg-white rounded-[3.5rem] shadow-2xl border border-teal-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 p-8 flex justify-between items-center border-b-8 border-teal-600">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-teal-600 rounded-[1.5rem] flex items-center justify-center p-3 shadow-xl border border-teal-400/30 overflow-hidden">
                <img src="rain_1.png" alt="RAIN" className="w-full h-full object-contain" />
            </div>
            <div className="text-white">
              <h1 className="text-3xl font-black tracking-tighter uppercase italic leading-none">
                   Deployment Gate
              </h1>
              <p className="text-teal-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">User: {user?.name}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="bg-slate-800 hover:bg-red-900 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest border border-slate-700">
             LOGOUT
          </button>
        </div>

        <div className="p-10">
            {!activeReq ? (
                <div className="text-center py-24 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100">
                    <i className="fa-solid fa-cloud-bolt text-5xl text-slate-200 mb-6"></i>
                    <h3 className="text-2xl font-black text-slate-300 uppercase tracking-[0.4em] italic">No Pending Deployments</h3>
                    <p className="text-slate-400 mt-4 max-w-sm mx-auto">There are no assets currently queued for handover to your ID.</p>
                </div>
            ) : (
                <>
                    {activeReq.status === RequestStatus.READY_FOR_COLLECTION && (
                        <div className="space-y-10 animate-[fadeIn_0.3s_ease-out]">
                            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group border-2 border-slate-800">
                                <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:scale-110 transition-transform">
                                    <i className="fa-solid fa-microchip text-[12rem]"></i>
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-6">Provisioned Hardware</p>
                                    <div className="space-y-3">
                                        <p className="text-3xl font-black tracking-tight leading-none italic">{currentAsset?.model || activeReq.requestedLaptopModel}</p>
                                        <div className="flex items-center gap-3 pt-2">
                                            <span className="font-mono text-[10px] text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20 font-black uppercase tracking-widest">
                                                TAG: {currentAsset?.assetTag || 'SYS_PENDING'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-inner">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 ml-1">Diagnostic Checkpoints</h4>
                                <div className="space-y-4">
                                    <label className="flex items-center gap-5 p-5 border-2 border-slate-100 bg-white rounded-2xl cursor-pointer hover:border-teal-300 transition-all">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all ${checklist.condition ? 'bg-teal-600 border-teal-600 text-white shadow-lg' : 'border-slate-200'}`}>
                                            <i className={`fa-solid fa-check text-xs ${checklist.condition ? 'block' : 'hidden'}`}></i>
                                        </div>
                                        <input type="checkbox" className="hidden" checked={checklist.condition} onChange={e => setChecklist({...checklist, condition: e.target.checked})} />
                                        <span className="text-[12px] font-black text-slate-800 uppercase tracking-tight">Cosmetic Audit Verified</span>
                                    </label>
                                    <label className="flex items-center gap-5 p-5 border-2 border-slate-100 bg-white rounded-2xl cursor-pointer hover:border-teal-300 transition-all">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all ${checklist.login ? 'bg-teal-600 border-teal-600 text-white shadow-lg' : 'border-slate-200'}`}>
                                            <i className={`fa-solid fa-check text-xs ${checklist.login ? 'block' : 'hidden'}`}></i>
                                        </div>
                                        <input type="checkbox" className="hidden" checked={checklist.login} onChange={e => setChecklist({...checklist, login: e.target.checked})} />
                                        <span className="text-[12px] font-black text-slate-800 uppercase tracking-tight">Login Successful</span>
                                    </label>
                                </div>
                            </div>

                            <div className="bg-slate-900 rounded-[3.5rem] p-12 text-center shadow-2xl border-4 border-slate-800">
                                <label className="block text-[11px] font-black text-teal-400 uppercase tracking-[0.5em] mb-8 italic">Acceptance Signature</label>
                                <div className="bg-white rounded-2xl overflow-hidden shadow-inner max-w-2xl mx-auto ring-4 ring-teal-500/10">
                                    <canvas ref={canvasRef} width={800} height={200} className="w-full h-44 cursor-crosshair"
                                        onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} />
                                </div>
                                <div className="flex justify-center mt-8">
                                    <button onClick={clearSignature} className="text-[10px] font-black text-red-400 uppercase tracking-[0.3em] border border-red-400/20 px-6 py-2.5 rounded-xl hover:bg-red-500 hover:text-white transition-all">Reset Signature</button>
                                </div>
                            </div>

                            <button onClick={handleSubmitUAT} 
                                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black py-8 rounded-[3rem] shadow-2xl shadow-teal-600/30 transition-all uppercase tracking-[0.3em] text-xl active:scale-[0.98] flex items-center justify-center gap-4">
                                Sign & Download PDF <i className="fa-solid fa-file-pdf"></i>
                            </button>
                        </div>
                    )}

                    {activeReq.status === RequestStatus.COMPLETED && (
                        <div className="text-center py-20">
                             <div className="w-32 h-32 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-emerald-500/30">
                                <i className="fa-solid fa-check-double text-5xl"></i>
                            </div>
                            <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">Handover Finalized</h2>
                            <p className="text-slate-500 mt-6 font-medium text-xl">
                                Asset <strong>{currentAsset?.assetTag}</strong> successfully allocated.
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default EmployeePortal;
