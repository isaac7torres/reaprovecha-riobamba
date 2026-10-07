import React, { useState } from 'react';
import { Header } from './components/Header';
import { PublicDashboard } from './components/PublicDashboard';
import { RegisterForm } from './components/RegisterForm';
import { AdminPanel } from './components/AdminPanel';
import { PinModal } from './components/PinModal';
import { Heart, Scale, Sparkles, Building2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentRole, setCurrentRole] = useState('LIBRE'); // 'LIBRE' | 'REGISTRADOR' | 'ADMIN'
  const [currentUser, setCurrentUser] = useState(null);

  // Modal PIN
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pendingTargetRole, setPendingTargetRole] = useState('REGISTRADOR');

  const handleRequestRoleChange = (requestedRole) => {
    if (currentRole === requestedRole) return;

    if (requestedRole === 'LIBRE') {
      setCurrentRole('LIBRE');
      setCurrentUser(null);
      setActiveTab('dashboard');
    } else {
      setPendingTargetRole(requestedRole);
      setPinModalOpen(true);
    }
  };

  const handlePinSuccess = (user) => {
    setCurrentUser(user);
    setCurrentRole(user.rol === 'ADMIN' ? 'ADMIN' : 'REGISTRADOR');
    setPinModalOpen(false);

    if (user.rol === 'ADMIN') {
      setActiveTab('admin');
    } else {
      setActiveTab('register');
    }
  };

  const handleLockRole = () => {
    setCurrentRole('LIBRE');
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-reaprovecha-bg font-sans">
      
      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRole={currentRole}
        onLockRole={handleLockRole}
        onRequestRoleChange={handleRequestRoleChange}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {activeTab === 'dashboard' && (
          <PublicDashboard />
        )}

        {activeTab === 'register' && (
          <RegisterForm
            currentUser={currentUser}
            onRecordSaved={() => {
              // Notificación opcional o actualización reactiva
            }}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPanel
            onRecordSaved={() => {}}
          />
        )}
      </main>

      {/* Footer Institucional REAPROVECHA */}
      <footer className="bg-white border-t border-gray-200 py-8 text-xs text-gray-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3">
            <img src="/logo_reaprovecha.png" alt="REAPROVECHA" className="w-8 h-8 object-contain" />
            <div>
              <p className="font-bold text-reaprovecha-brown text-sm">
                Proyecto <span className="text-reaprovecha-orange">RE</span>APROVECHA
              </p>
              <p className="text-[11px] text-gray-400">
                Sistema de Gestión y Recolección de Residuos Orgánicos - Mercado Mayorista de Riobamba
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-[11px] font-semibold text-gray-600">
            <span className="flex items-center space-x-1">
              <Building2 className="w-3.5 h-3.5 text-reaprovecha-green" />
              <span>Nave Frutos Tropicales</span>
            </span>
            <span className="flex items-center space-x-1">
              <Scale className="w-3.5 h-3.5 text-reaprovecha-orange" />
              <span>Pesaje Digital kg</span>
            </span>
            <span className="flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-reaprovecha-red" />
              <span>Escalabilidad Hortalizas</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Modal de PIN */}
      <PinModal
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        targetRole={pendingTargetRole}
        onSuccess={handlePinSuccess}
      />
    </div>
  );
}
