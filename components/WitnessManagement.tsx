
import React, { useState, useEffect } from 'react';
import { DataService, AuthService } from '../services/store';
import { ITEngineer } from '../types';
import { useNavigate } from 'react-router-dom';

const WitnessManagement: React.FC = () => {
  const navigate = useNavigate();
  const user = AuthService.getCurrentUser();
  const [engineers, setEngineers] = useState<ITEngineer[]>([]);
  const [formData, setFormData] = useState<ITEngineer>({ id: '', name: '', email: '', active: true });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'PowerIT') {
        navigate('/login');
        return;
    }
    loadData();
  }, [user?.username, navigate]);

  const loadData = () => {
    setEngineers(DataService.getWitnesses());
  };

  const handleCreate = () => {
      setFormData({ id: `IT-${Date.now()}`, name: '', email: '', active: true });
      setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
      DataService.deleteWitness(id);
      loadData();
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      DataService.saveWitness(formData);
      setIsModalOpen(false);
      loadData();
  };

  return (
    <div className="space-y-8 animate-[fadeIn_0.3s]">
        <header className="flex justify-between items-end">
            <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Deploy-Engineer Configuration</h1>
                <p className="text-slate-500 font-medium mt-1">Manage Authorized IT Handover Engineers</p>
            </div>
            <button onClick={handleCreate} className="bg-teal-600 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl">
                <i className="fa-solid fa-plus mr-2"></i> Add Deploy-Engineer
            </button>
        </header>

        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                    <tr>
                        <th className="p-5">Engineer Name</th>
                        <th className="p-5">ID Ref</th>
                        <th className="p-5 text-right">Status</th>
                        <th className="p-5 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {engineers.map(eng => (
                        <tr key={eng.id} className="text-xs">
                            <td className="p-5 font-bold">{eng.name}</td>
                            <td className="p-5 font-mono text-slate-500">{eng.id}</td>
                            <td className="p-5 text-right">
                                <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${eng.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{eng.active ? 'Active' : 'Inactive'}</span>
                            </td>
                            <td className="p-5 text-right">
                                <button onClick={() => handleDelete(eng.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><i className="fa-solid fa-trash"></i></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-[2rem] p-8 w-full max-w-md">
                    <h3 className="text-xl font-black mb-6">Add Deploy-Engineer</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400">Name</label>
                            <input required className="w-full border rounded-xl p-3 text-sm font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400">ID Reference</label>
                            <input required className="w-full border rounded-xl p-3 text-sm font-bold" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} />
                        </div>
                        <button type="submit" className="w-full bg-teal-600 text-white font-black uppercase text-xs py-4 rounded-xl shadow-lg mt-4">Save Configuration</button>
                        <button type="button" onClick={() => setIsModalOpen(false)} className="w-full bg-slate-100 text-slate-600 font-black uppercase text-xs py-3 rounded-xl mt-2">Cancel</button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default WitnessManagement;
