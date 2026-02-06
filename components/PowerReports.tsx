
import React, { useState, useEffect } from 'react';
import { DataService, AuthService } from '../services/store';
import { Asset, AssetStatus, Employee } from '../types';
import { useNavigate } from 'react-router-dom';

const PowerReports: React.FC = () => {
    const navigate = useNavigate();
    const user = AuthService.getCurrentUser();
    const [activeReport, setActiveReport] = useState<string>('inventory');
    const [assets, setAssets] = useState<Asset[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);

    useEffect(() => {
        // Allowed for IT and PowerIT
        if (!user || (user.role !== 'PowerIT' && user.role !== 'IT')) {
            navigate('/login');
            return;
        }
        setAssets(DataService.getAssets());
        setEmployees(DataService.getEmployees());
    }, [user?.username, navigate]);

    const getAssignedAssets = () => assets.filter(a => a.status === AssetStatus.ALLOCATED || a.status === AssetStatus.RESERVED);
    const getInStockAssets = () => assets.filter(a => a.status === AssetStatus.IN_STOCK);
    const getRepairAssets = () => assets.filter(a => a.status === AssetStatus.FAULTY || a.status === AssetStatus.UNDER_REPAIR);
    
    const getExpiryAssets = () => {
        const threeMonthsFromNow = new Date();
        threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
        return assets.filter(a => {
            if (!a.expiryDate) return false;
            const exp = new Date(a.expiryDate);
            return exp <= threeMonthsFromNow;
        });
    };

    const handleExport = () => {
        const headers = ['Asset Tag', 'Serial Number', 'Model', 'Status', 'Assigned To', 'Purchase Date', 'Expiry Date'];
        const csvContent = [
            headers.join(','),
            ...assets.map(a => {
                const emp = employees.find(e => e.id === a.assignedTo || e.employeeId === a.assignedTo);
                const assignedName = emp ? `${emp.firstName} ${emp.lastName}` : (a.assignedTo || '');
                return `${a.assetTag},${a.serialNumber},${a.model},${a.status},"${assignedName}",${a.purchaseDate},${a.expiryDate || ''}`;
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `RAIN_Ledger_Export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderTable = (data: Asset[]) => (
        <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-sm">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="p-4">Tag / SN</th>
                        <th className="p-4">Model</th>
                        <th className="p-4">Custodian</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Expiry</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {data.length === 0 ? (
                        <tr><td colSpan={5} className="p-10 text-center text-slate-300 font-bold uppercase italic">No records found for this filter</td></tr>
                    ) : data.map(a => {
                        const emp = employees.find(e => e.id === a.assignedTo || e.employeeId === a.assignedTo);
                        return (
                            <tr key={a.id} className="text-xs hover:bg-slate-50">
                                <td className="p-4">
                                    <div className="font-mono font-black text-teal-600">{a.assetTag}</div>
                                    <div className="text-[9px] text-slate-400">{a.serialNumber}</div>
                                </td>
                                <td className="p-4 font-bold">{a.model}</td>
                                <td className="p-4 font-bold">{emp ? `${emp.firstName} ${emp.lastName}` : '---'}</td>
                                <td className="p-4">
                                    <span className="bg-slate-100 text-[9px] font-black px-2 py-1 rounded uppercase">{a.status}</span>
                                </td>
                                <td className="p-4 text-slate-400 font-mono">{a.expiryDate || 'N/A'}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );

    const reportConfig = [
        { id: 'inventory', label: 'Full Inventory', icon: 'fa-boxes-stacked' },
        { id: 'assigned', label: 'Assigned Fleet', icon: 'fa-user-check' },
        { id: 'stock', label: 'In Store', icon: 'fa-warehouse' },
        { id: 'repair', label: 'Under Repair', icon: 'fa-tools' },
        { id: 'expiry', label: 'Nearing Expiry (3m)', icon: 'fa-hourglass-end' }
    ];

    if (!user || (user.role !== 'PowerIT' && user.role !== 'IT')) return null;

    return (
        <div className="space-y-8 animate-[fadeIn_0.3s]">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Reporting Terminal</h1>
                    <p className="text-slate-500 font-medium mt-1">Global Asset Intelligence & Lifecycle Analytics</p>
                </div>
                <button onClick={handleExport} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-900/10 hover:scale-105 transition-all">
                    <i className="fa-solid fa-file-export mr-2"></i> Export Ledger
                </button>
            </header>

            <div className="grid grid-cols-5 gap-4">
                {reportConfig.map(cfg => (
                    <button 
                        key={cfg.id} 
                        onClick={() => setActiveReport(cfg.id)}
                        className={`flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 transition-all ${activeReport === cfg.id ? 'bg-teal-600 border-teal-600 text-white shadow-xl shadow-teal-600/20' : 'bg-white border-slate-100 text-slate-400 hover:border-teal-100'}`}
                    >
                        <i className={`fa-solid ${cfg.icon} text-2xl mb-3`}></i>
                        <span className="text-[10px] font-black uppercase tracking-widest text-center">{cfg.label}</span>
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-200">
                <div className="mb-8 flex justify-between items-center">
                    <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">
                        {reportConfig.find(c => c.id === activeReport)?.label} Report
                    </h2>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-4 py-1 rounded-full">
                        {assets.length} Total Nodes Monitored
                    </span>
                </div>

                {activeReport === 'inventory' && renderTable(assets)}
                {activeReport === 'assigned' && renderTable(getAssignedAssets())}
                {activeReport === 'stock' && renderTable(getInStockAssets())}
                {activeReport === 'repair' && renderTable(getRepairAssets())}
                {activeReport === 'expiry' && renderTable(getExpiryAssets())}
            </div>
        </div>
    );
};

export default PowerReports;
