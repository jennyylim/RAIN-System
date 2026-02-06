
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HRPortal from './components/HRPortal';
import ITPortal from './components/ITPortal';
import EmployeePortal from './components/EmployeePortal';
import ReturnPortal from './components/ReturnPortal';
import FeasibilityReport from './components/FeasibilityReport';
import DatabasePortal from './components/DatabasePortal';
import LoginPage from './components/LoginPage';
import PowerReports from './components/PowerReports';
import UserManagement from './components/UserManagement';
import WitnessManagement from './components/WitnessManagement';
import ArchitectureDiagram from './components/ArchitectureDiagram';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/employee" element={
          <div className="min-h-screen bg-slate-100 p-4 flex items-center justify-center">
            <EmployeePortal />
          </div>
        } />
        
        {/* Protected Routes inside Layout */}
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/hr" element={<HRPortal />} />
              <Route path="/it" element={<ITPortal />} />
              <Route path="/it/returns" element={<ReturnPortal />} />
              <Route path="/it/report" element={<FeasibilityReport />} />
              <Route path="/it/database" element={<DatabasePortal />} />
              <Route path="/it/reports" element={<PowerReports />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/witness" element={<WitnessManagement />} />
              <Route path="/admin/architecture" element={<ArchitectureDiagram />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </HashRouter>
  );
};

export default App;
