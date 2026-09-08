import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DemoGuideModal from './components/DemoGuideModal';
import StakeholderModal from './components/StakeholderModal';

import Dashboard from './pages/Dashboard';
import IdempotencyDemo from './pages/IdempotencyDemo';
import CreateOrder from './pages/CreateOrder';
import TestHarnessPage from './pages/TestHarnessPage';
import TestResultsPage from './pages/TestResultsPage';
import TraceExplorer from './pages/TraceExplorer';
import TransactionTimeline from './pages/TransactionTimeline';
import TenantManagement from './pages/TenantManagement';
import AuditLogs from './pages/AuditLogs';
import ArchitecturePage from './pages/ArchitecturePage';
import APIDocsPage from './pages/APIDocsPage';
import LimitationsPage from './pages/LimitationsPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [activeTenant, setActiveTenant] = useState(localStorage.getItem('activeTenant') || 'org_001');
  const [activeRole, setActiveRole] = useState(localStorage.getItem('activeRole') || 'ADMIN');

  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isStakeholderModalOpen, setIsStakeholderModalOpen] = useState(false);
  const [demoStep, setDemoStep] = useState(1);

  const handleSelectDemoStep = (step, page) => {
    setDemoStep(step);
    setCurrentPage(page);
    setIsDemoModalOpen(false);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'demo':
        return <IdempotencyDemo />;
      case 'create_order':
        return <CreateOrder />;
      case 'harness':
        return <TestHarnessPage onTestComplete={() => setCurrentPage('results')} />;
      case 'results':
        return <TestResultsPage />;
      case 'traces':
        return <TraceExplorer />;
      case 'timeline':
        return <TransactionTimeline />;
      case 'tenants':
        return <TenantManagement />;
      case 'audit':
        return <AuditLogs />;
      case 'architecture':
        return <ArchitecturePage />;
      case 'apidocs':
        return <APIDocsPage />;
      case 'limitations':
        return <LimitationsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTenant={activeTenant}
        setActiveTenant={setActiveTenant}
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        onOpenDemoModal={() => setIsDemoModalOpen(true)}
        onOpenStakeholderModal={() => setIsStakeholderModalOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <main className="flex-1 p-6 overflow-y-auto bg-slate-950">
          {renderPage()}
        </main>
      </div>

      <DemoGuideModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        currentStep={demoStep}
        onSelectStep={handleSelectDemoStep}
      />

      <StakeholderModal
        isOpen={isStakeholderModalOpen}
        onClose={() => setIsStakeholderModalOpen(false)}
      />
    </div>
  );
}
