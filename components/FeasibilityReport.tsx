import React from 'react';
import { DataService } from '../services/store';

const FeasibilityReport: React.FC = () => {
    const assets = DataService.getAssets();
    const employees = DataService.getEmployees();
    const requests = DataService.getRequests();

    const stats = {
        totalAssets: assets.length,
        inStock: assets.filter(a => a.status === 'In Stock').length,
        allocated: assets.filter(a => a.status === 'Allocated').length,
        faulty: assets.filter(a => a.status === 'Faulty').length,
        offboarding: employees.filter(e => e.department === 'Exiting').length
    };

    return (
        <div className="bg-slate-100 min-h-screen p-8">
            <div className="max-w-[210mm] mx-auto bg-white shadow-2xl p-12 min-h-[297mm] print:shadow-none print:m-0 print:w-full">
                
                {/* Header */}
                <div className="flex justify-between items-end border-b-8 border-teal-600 pb-8 mb-10">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-teal-50 rounded-2xl flex items-center justify-center p-2 border border-teal-100">
                            <img 
                                src="rain_1.png" 
                                alt="RAIN Logo" 
                                className="w-full h-full object-contain" 
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                                }}
                            />
                            <i className="fa-solid fa-cloud-showers-heavy text-4xl text-teal-600 hidden fallback-icon"></i>
                        </div>
                        <div>
                            <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">RAIN</h1>
                            <p className="text-lg font-black text-teal-600 uppercase tracking-[0.3em] mt-2">Systems Logistics</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-black text-slate-800 text-sm">RELEASE: OCT 2025</p>
                        <p className="text-xs font-mono text-slate-400 mt-1 uppercase">Serial: RAIN-REP-4491-01</p>
                        <button onClick={() => window.print()} className="mt-4 bg-teal-600 text-white px-6 py-2 rounded-xl text-xs font-black print:hidden hover:bg-teal-700 shadow-xl shadow-teal-600/20 transition-all uppercase tracking-widest">
                            <i className="fa-solid fa-file-export mr-2"></i> Export PDF
                        </button>
                    </div>
                </div>

                {/* 1. Executive Summary */}
                <section className="mb-12">
                    <h2 className="text-2xl font-black text-slate-900 border-l-4 border-teal-600 pl-4 mb-6 uppercase tracking-tight">1. Infrastructure Overview</h2>
                    <p className="text-slate-700 text-justify leading-relaxed mb-8 font-medium text-sm">
                        The **RAIN (Resource Asset Inventory Network)** platform represents a fundamental shift in hardware lifecycle management. By unifying HR directory synchronization with automated IT fulfillment, the RAIN ecosystem eliminates deployment lag. This report summarizes the verification of {stats.totalAssets} unique assets currently indexed within the primary RAIN ledger.
                    </p>
                    <div className="grid grid-cols-4 gap-6 text-center">
                        <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl">
                            <div className="text-3xl font-black text-teal-400 leading-none">{stats.totalAssets}</div>
                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mt-2">Total Ledger</div>
                        </div>
                        <div className="p-6 bg-teal-600 rounded-3xl shadow-xl shadow-teal-600/10">
                            <div className="text-3xl font-black text-white leading-none">{stats.allocated}</div>
                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-100 mt-2">Active Fleet</div>
                        </div>
                        <div className="p-6 bg-white rounded-3xl border-2 border-slate-100">
                            <div className="text-3xl font-black text-slate-800 leading-none">{stats.inStock}</div>
                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">Available</div>
                        </div>
                        <div className="p-6 bg-red-50 rounded-3xl border border-red-100">
                            <div className="text-3xl font-black text-red-600 leading-none">{stats.faulty}</div>
                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-red-400 mt-2">Quarantine</div>
                        </div>
                    </div>
                </section>

                {/* 2. Offboarding Scenarios */}
                <section className="mb-12 break-inside-avoid">
                    <h2 className="text-2xl font-black text-slate-900 border-l-4 border-teal-600 pl-4 mb-6 uppercase tracking-tight">2. Offboarding Chain of Custody</h2>
                    <div className="overflow-hidden rounded-3xl border border-slate-200">
                        <table className="w-full text-[11px] text-left border-collapse">
                            <thead className="bg-slate-900 text-white">
                                <tr>
                                    <th className="p-4 font-black uppercase tracking-widest">Employee Profile</th>
                                    <th className="p-4 font-black uppercase tracking-widest text-center">Lifecycle Phase</th>
                                    <th className="p-4 font-black uppercase tracking-widest">Asset Assessment</th>
                                    <th className="p-4 font-black uppercase tracking-widest text-right">RAIN Execution</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {employees.filter(e => e.department === 'Exiting').map((emp) => {
                                    const req = requests.find(r => r.employeeId === emp.id);
                                    return (
                                        <tr key={emp.id} className="hover:bg-teal-50/20 transition-colors">
                                            <td className="p-4">
                                                <div className="font-black text-slate-800 leading-none mb-1 uppercase">{emp.firstName} {emp.lastName}</div>
                                                <div className="font-mono text-[9px] text-slate-400">{emp.employeeId}</div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-tighter shadow-sm border ${
                                                    req?.status === 'Returned' ? 'bg-emerald-500 text-white border-emerald-600' :
                                                    req?.status === 'Pending' ? 'bg-orange-500 text-white border-orange-600' : 
                                                    'bg-teal-600 text-white border-teal-700'
                                                }`}>
                                                    {req?.status || 'Active'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-600 font-bold italic">{req?.justification || 'Standard Inventory Return'}</td>
                                            <td className="p-4 text-right">
                                                <span className="font-mono text-[10px] bg-slate-100 px-2 py-1 rounded text-teal-700 font-black">
                                                    {req?.status === 'Returned' ? 'SIG: VERIFIED' : 'LOG: QUEUED'}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* 3. SWOT Analysis */}
                <section className="mb-12 break-inside-avoid">
                    <h2 className="text-2xl font-black text-slate-900 border-l-4 border-teal-600 pl-4 mb-6 uppercase tracking-tight">3. Strategic Feasibility</h2>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-teal-50/50 border-2 border-teal-100 p-6 rounded-[2rem] relative overflow-hidden">
                            <div className="absolute top-4 right-4 text-teal-200/30 text-4xl"><i className="fa-solid fa-shield-halved"></i></div>
                            <h4 className="font-black text-teal-800 text-xs mb-4 uppercase tracking-[0.2em]">Platform Strengths</h4>
                            <ul className="space-y-3 text-[11px] text-teal-900 font-bold">
                                <li className="flex items-start gap-2"><i className="fa-solid fa-check-circle mt-0.5 text-teal-600"></i> Full RAIN synchronization across HR/IT.</li>
                                <li className="flex items-start gap-2"><i className="fa-solid fa-check-circle mt-0.5 text-teal-600"></i> Digital signature verified UAT process.</li>
                                <li className="flex items-start gap-2"><i className="fa-solid fa-check-circle mt-0.5 text-teal-600"></i> Real-time inventory heatmapping.</li>
                            </ul>
                        </div>
                        <div className="bg-red-50 border-2 border-red-100 p-6 rounded-[2rem] relative overflow-hidden">
                            <div className="absolute top-4 right-4 text-red-200/30 text-4xl"><i className="fa-solid fa-triangle-exclamation"></i></div>
                            <h4 className="font-black text-red-800 text-xs mb-4 uppercase tracking-[0.2em]">Critical Risks</h4>
                            <ul className="space-y-3 text-[11px] text-red-900 font-bold">
                                <li className="flex items-start gap-2"><i className="fa-solid fa-circle-exclamation mt-0.5 text-red-600"></i> Physical hardware damage inspection lag.</li>
                                <li className="flex items-start gap-2"><i className="fa-solid fa-circle-exclamation mt-0.5 text-red-600"></i> Dependency on IT BAU physical presence.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <div className="text-center text-[10px] text-slate-300 mt-20 pt-10 border-t border-slate-100 font-mono tracking-[0.5em] uppercase">
                    Document Securely Generated by RAIN Systems v4.0
                </div>
            </div>
        </div>
    );
};

export default FeasibilityReport;