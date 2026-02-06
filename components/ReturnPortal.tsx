
import React, { useState, useEffect, useRef } from 'react';
import { DataService, AuthService } from '../services/store';
import { Asset, Employee, ReturnRecord, RequestStatus, AssetStatus, ITEngineer } from '../types';
import { useNavigate } from 'react-router-dom';

const ReturnPortal: React.FC = () => {
    const navigate = useNavigate();
    const user = AuthService.getCurrentUser();
    const [engineers, setEngineers] = useState<ITEngineer[]>([]);

    useEffect(() => {
        if (!user || (user.role !== 'IT' && user.role !== 'PowerIT')) {
            navigate('/login');
            return;
        }
        setEngineers(DataService.getWitnesses().filter(e => e.active));
    }, [user?.username, navigate]);

    const [searchQuery, setSearchQuery] = useState('');
    const [foundAsset, setFoundAsset] = useState<Asset | null>(null);
    const [linkedEmployee, setLinkedEmployee] = useState<Employee | null>(null);
    
    const [condition, setCondition] = useState<'Good' | 'Damaged' | 'Faulty'>('Good');
    const [remarks, setRemarks] = useState('');
    const [photo, setPhoto] = useState<string>('');
    const [submitted, setSubmitted] = useState(false);
    
    const [selectedItEngId, setSelectedItEngId] = useState('');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // Checklist State
    const [checkPoints, setCheckPoints] = useState({
        screen: false,
        keyboard: false,
        ports: false,
        topLid: false,
        bottomCase: false
    });

    const handleSearch = () => {
        const assets = DataService.getAssets();
        const asset = assets.find(a => 
            (a.assetTag.toLowerCase() === searchQuery.toLowerCase() || 
             a.serialNumber.toLowerCase() === searchQuery.toLowerCase())
        );

        if (asset && (asset.assignedTo || asset.status === AssetStatus.ALLOCATED || asset.status === AssetStatus.RESERVED)) {
            setFoundAsset(asset);
            const emp = DataService.getEmployees().find(e => e.id === asset.assignedTo || e.employeeId === asset.assignedTo);
            setLinkedEmployee(emp || null);
        } else {
            setFoundAsset(null);
            setLinkedEmployee(null);
            alert("ASSET NOT FOUND IN ACTIVE DEPLOYMENT: Ensure the asset is currently allocated to a user.");
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPhoto(reader.result as string);
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
    const clearSignature = () => canvasRef.current?.getContext('2d')?.clearRect(0, 0, 600, 150);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!foundAsset || !linkedEmployee) return;
        if (!selectedItEngId) return alert("Select witnessing IT Engineer.");
        if (!Object.values(checkPoints).every(v => v)) return alert("Physical verification checklist must be completed.");

        const engineer = engineers.find(e => e.id === selectedItEngId);
        const record: ReturnRecord = {
            id: `ret-${Date.now()}`,
            assetId: foundAsset.id,
            employeeId: linkedEmployee.id,
            returnDate: new Date().toISOString(),
            condition,
            remarks,
            photo,
            processedBy: user?.username || 'System',
            itEngineerId: engineer!.id,
            itEngineerName: engineer!.name,
            itSignature: canvasRef.current?.toDataURL()
        };

        DataService.processReturn(record);
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[3rem] shadow-2xl border-4 border-teal-600 animate-[fadeIn_0.5s] text-center">
                <div className="w-24 h-24 bg-teal-600 text-white rounded-full flex items-center justify-center mb-8 shadow-xl shadow-teal-500/20">
                    <i className="fa-solid fa-cloud-check text-4xl"></i>
                </div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">RAIN Ledger Updated</h2>
                <p className="text-slate-500 mt-4 mb-10 max-w-md font-medium text-lg">
                    Asset <strong>{foundAsset?.assetTag}</strong> has been successfully returned and de-provisioned from {linkedEmployee?.firstName}.
                </p>
                <button onClick={() => window.location.reload()} className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20">
                    Process New Return
                </button>
            </div>
        );
    }

    if (!user || (user.role !== 'IT' && user.role !== 'PowerIT')) return null;

    return (
        <div className="space-y-10 animate-[fadeIn_0.3s_ease-out]">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-2 border-slate-200 pb-8">
                <div>
                   <div className="flex items-center gap-4 mb-3">
                     <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-700 shadow-xl">
                         <img src="rain_1.png" alt="RAIN" className="w-8 h-8 object-contain" />
                     </div>
                     <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Returns Desk</h1>
                   </div>
                   <p className="text-slate-500 font-medium max-w-xl">Release inventory custody and perform physical audit logs for offboarding or loan cycles.</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative group">
                        <input 
                            type="text" 
                            className="w-80 pl-12 pr-4 py-5 bg-white border-2 border-slate-200 rounded-2xl focus:border-teal-500 outline-none font-black text-slate-800 shadow-sm transition-all"
                            placeholder="Scan Asset Tag / SN..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        <i className="fa-solid fa-qrcode absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
                    </div>
                    <button onClick={handleSearch} className="bg-teal-600 text-white px-8 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-teal-700 shadow-xl shadow-teal-600/20 active:scale-95 transition-all">
                        Fetch Record
                    </button>
                </div>
            </header>

            {!foundAsset ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] p-24 text-center">
                    <i className="fa-solid fa-box-open text-6xl text-slate-200 mb-6"></i>
                    <h3 className="text-2xl font-black text-slate-300 uppercase tracking-[0.2em] italic">Awaiting Asset Signal</h3>
                    <p className="text-slate-400 mt-2 font-medium">Scan an active asset to initiate the diagnostic return flow.</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Diagnostic Sidebar */}
                    <div className="space-y-8">
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white border border-slate-800 shadow-2xl relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform">
                                <i className="fa-solid fa-laptop text-[10rem]"></i>
                            </div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-4">Linked Subject</p>
                                <h3 className="text-2xl font-black tracking-tighter leading-none">{linkedEmployee?.firstName} {linkedEmployee?.lastName}</h3>
                                <p className="text-xs text-slate-400 mt-2 uppercase font-bold tracking-widest">{linkedEmployee?.department} | {linkedEmployee?.role}</p>
                                <div className="mt-8 pt-8 border-t border-slate-800 space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-[10px] font-black text-slate-500 uppercase">Model</span>
                                        <span className="text-xs font-bold">{foundAsset.model}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[10px] font-black text-slate-500 uppercase">Tag</span>
                                        <span className="text-xs font-mono text-teal-400">{foundAsset.assetTag}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Verification Checklist</h4>
                            <div className="space-y-3">
                                {Object.keys(checkPoints).map((key) => (
                                    <label key={key} className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-white hover:border-teal-300 transition-all group">
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${checkPoints[key as keyof typeof checkPoints] ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-200 bg-white'}`}>
                                            <i className={`fa-solid fa-check text-[10px] ${checkPoints[key as keyof typeof checkPoints] ? 'block' : 'hidden'}`}></i>
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            className="hidden" 
                                            checked={checkPoints[key as keyof typeof checkPoints]} 
                                            onChange={e => setCheckPoints({...checkPoints, [key]: e.target.checked})} 
                                        />
                                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{key.replace(/([A-Z])/g, ' $1')} Verified</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Form Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm space-y-8">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Condition Assessment</label>
                                <div className="flex gap-4">
                                    {['Good', 'Damaged', 'Faulty'].map((status) => (
                                        <label key={status} className={`flex-1 p-6 rounded-2xl border-2 text-center cursor-pointer transition-all font-black uppercase text-xs tracking-widest ${condition === status ? 'bg-teal-600 border-teal-600 text-white shadow-xl shadow-teal-600/20' : 'bg-white border-slate-100 text-slate-400 hover:border-teal-200'}`}>
                                            <input type="radio" className="hidden" value={status} checked={condition === status} onChange={() => setCondition(status as any)} />
                                            {status}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Audit Photo (Evidence)</label>
                                    <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center bg-slate-50/50 hover:bg-white transition-all group relative h-48 flex items-center justify-center">
                                        {photo ? (
                                            <>
                                                <img src={photo} alt="Return Evidence" className="h-full w-full object-cover rounded-2xl" />
                                                <button onClick={() => setPhoto('')} className="absolute top-2 right-2 bg-red-600 text-white w-8 h-8 rounded-full shadow-xl">X</button>
                                            </>
                                        ) : (
                                            <div className="py-4">
                                                <i className="fa-solid fa-camera text-4xl text-slate-200 group-hover:text-teal-500 transition-colors"></i>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Upload visual state</p>
                                                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Administrative Notes</label>
                                    <textarea 
                                        required 
                                        className="w-full h-48 border-2 border-slate-100 bg-slate-50/50 rounded-3xl p-6 outline-none focus:bg-white focus:border-teal-500 transition-all font-medium text-slate-700"
                                        placeholder="Note missing chargers, screen scratches, or software anomalies..."
                                        value={remarks}
                                        onChange={e => setRemarks(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white">
                                <div className="grid md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <label className="block text-[10px] font-black text-teal-400 uppercase tracking-widest">IT Witness ID</label>
                                        <select 
                                            className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-5 text-teal-400 font-black outline-none focus:border-teal-500 transition-all"
                                            value={selectedItEngId}
                                            onChange={e => setSelectedItEngId(e.target.value)}
                                        >
                                            <option value="">Select Witness...</option>
                                            {engineers.map(eng => <option key={eng.id} value={eng.id}>{eng.name} ({eng.id})</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black text-teal-400 uppercase tracking-widest flex justify-between">
                                            <span>Digital Sign-off</span>
                                            <button type="button" onClick={clearSignature} className="text-red-400">Clear</button>
                                        </label>
                                        <div className="bg-white rounded-2xl overflow-hidden shadow-inner h-32">
                                            <canvas ref={canvasRef} width={600} height={150} className="w-full h-full cursor-crosshair" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-teal-600 text-white py-6 rounded-[2rem] font-black uppercase text-lg tracking-[0.2em] shadow-2xl shadow-teal-600/30 hover:bg-teal-500 active:scale-[0.98] transition-all">
                                Submit Return
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
};

export default ReturnPortal;
