
import React, { useState, useEffect } from 'react';
import { DataService, AuthService } from '../services/store';
import { Employee, EmployeeStatus } from '../types';
import { useNavigate } from 'react-router-dom';

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const user = AuthService.getCurrentUser();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const initialFormState: Employee = {
      id: '',
      employeeId: '',
      firstName: '',
      lastName: '',
      email: '',
      privateEmail: '',
      handphone: '',
      department: 'Engineering',
      role: '',
      officeLocation: 'HQ',
      status: 'New',
      dateJoined: new Date().toISOString().split('T')[0],
      isActive: true,
      reportingOfficerName: '',
      reportingOfficerId: '',
      reportingOfficerRole: '',
      reportingOfficerHp: '',
      reportingOfficerEmail: '',
      reportingOfficerDivision: '',
      reportingOfficerLocation: ''
  };
  const [formData, setFormData] = useState<Employee>(initialFormState);

  useEffect(() => {
    // Access allowed for HR and PowerIT
    if (!user || (user.role !== 'PowerIT' && user.role !== 'HR')) {
        navigate('/login');
        return;
    }
    loadEmployees();
  }, [user?.username, navigate]);

  const loadEmployees = () => {
    setEmployees(DataService.getEmployees());
  };

  const handleEdit = (emp: Employee) => {
    setFormData(emp);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this user? This cannot be undone.')) {
        DataService.deleteEmployee(id);
        loadEmployees();
    }
  };

  const handleCreate = () => {
    setFormData({
        ...initialFormState, 
        id: `emp-${Date.now()}`,
        employeeId: `EMP${Math.floor(1000 + Math.random() * 9000)}`
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    DataService.saveEmployee(formData);
    setIsModalOpen(false);
    loadEmployees();
    alert('User record updated successfully in RAIN Database.');
  };

  const filtered = employees.filter(e => 
      e.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user || (user.role !== 'PowerIT' && user.role !== 'HR')) return null;

  return (
    <div className="space-y-8 animate-[fadeIn_0.3s]">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Staff Administration</h1>
          <p className="text-slate-500 font-medium mt-1">Personnel Database Management</p>
        </div>
        <div className="flex gap-4">
             <div className="relative">
                <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input 
                    type="text" 
                    placeholder="Search personnel..." 
                    className="pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-teal-500 shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button onClick={handleCreate} className="bg-teal-600 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-teal-600/20 hover:bg-teal-700 transition-all">
                <i className="fa-solid fa-user-plus mr-2"></i> Create User
            </button>
        </div>
      </header>

      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
            <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                <tr>
                    <th className="p-5">Employee</th>
                    <th className="p-5">Role / Dept</th>
                    <th className="p-5">Contact</th>
                    <th className="p-5 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {filtered.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors text-xs">
                        <td className="p-5">
                            <div className="font-black text-slate-900">{emp.firstName} {emp.lastName}</div>
                            <div className="font-mono text-[10px] text-slate-400">{emp.employeeId}</div>
                        </td>
                        <td className="p-5">
                            <div className="font-bold text-slate-700">{emp.role}</div>
                            <div className="text-[10px] text-slate-500 uppercase">{emp.department}</div>
                        </td>
                        <td className="p-5 font-medium text-slate-600">
                            <div>{emp.email}</div>
                            <div className="text-[10px] text-slate-400">{emp.handphone}</div>
                        </td>
                        <td className="p-5 text-right space-x-2">
                            <button onClick={() => handleEdit(emp)} className="text-teal-600 hover:bg-teal-50 px-3 py-1 rounded-lg border border-teal-100 font-bold">Edit</button>
                            <button onClick={() => handleDelete(emp.id)} className="text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg border border-red-100 font-bold">Delete</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl p-10 border border-slate-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">
                        {formData.id.includes('new') ? 'Onboard New User' : 'Edit User Profile'}
                    </h2>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-red-500 transition-colors">
                        <i className="fa-solid fa-circle-xmark text-3xl"></i>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase text-teal-600 tracking-widest border-b border-slate-100 pb-2">Identity</h3>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">First Name</label>
                            <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-700 outline-none focus:border-teal-500"
                                value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Last Name</label>
                            <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-700 outline-none focus:border-teal-500"
                                value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Employee ID</label>
                            <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-700 outline-none focus:border-teal-500"
                                value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Status</label>
                            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-700 outline-none focus:border-teal-500"
                                value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as EmployeeStatus})}>
                                <option>New</option>
                                <option>Current</option>
                                <option>Promoted</option>
                                <option>Offboard</option>
                                <option>Secure User</option>
                            </select>
                        </div>
                    </div>

                    {/* Role Info */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase text-teal-600 tracking-widest border-b border-slate-100 pb-2">Organizational</h3>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Department</label>
                            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-700 outline-none focus:border-teal-500"
                                value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
                                <option>Engineering</option>
                                <option>Sales</option>
                                <option>Marketing</option>
                                <option>Finance</option>
                                <option>Logistics</option>
                                <option>Architect Central</option>
                                <option>HR</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Role Title</label>
                            <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-700 outline-none focus:border-teal-500"
                                value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} />
                        </div>
                         <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Office Location</label>
                            <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-700 outline-none focus:border-teal-500"
                                value={formData.officeLocation} onChange={e => setFormData({...formData, officeLocation: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Official Email</label>
                            <input required type="email" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-700 outline-none focus:border-teal-500"
                                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        </div>
                    </div>

                     {/* Reporting Officer */}
                    <div className="md:col-span-2 space-y-4">
                         <h3 className="text-xs font-black uppercase text-teal-600 tracking-widest border-b border-slate-100 pb-2">Reporting Structure</h3>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Manager Name</label>
                                <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-700 outline-none focus:border-teal-500"
                                    value={formData.reportingOfficerName} onChange={e => setFormData({...formData, reportingOfficerName: e.target.value})} />
                            </div>
                             <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Manager Email</label>
                                <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-700 outline-none focus:border-teal-500"
                                    value={formData.reportingOfficerEmail} onChange={e => setFormData({...formData, reportingOfficerEmail: e.target.value})} />
                            </div>
                         </div>
                    </div>

                    <div className="md:col-span-2 pt-6 flex gap-4">
                         <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 font-black uppercase text-xs py-4 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                         <button type="submit" className="flex-1 bg-teal-600 text-white font-black uppercase text-xs py-4 rounded-xl shadow-xl hover:bg-teal-700 transition-colors">Save User Record</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
