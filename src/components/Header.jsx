import React from 'react';
import { DB } from '../services/db';
import { 
  BarChart3, 
  PlusCircle, 
  Settings, 
  Lock, 
  CheckCircle2, 
  Smartphone, 
  RotateCcw,
  Sparkles,
  MapPin
} from 'lucide-react';

export function Header({ activeTab, setActiveTab, currentRole, onLockRole, onRequestRoleChange }) {
  return (
    <header className="bg-white border-b border-reaprovecha-green-soft shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo y Nombre del Proyecto */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-12 h-12 bg-white rounded-xl shadow-md p-1 border border-reaprovecha-green/20 flex items-center justify-center overflow-hidden">
              <img 
                src="/logo_reaprovecha.png" 
                alt="Logo REAPROVECHA" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden w-full h-full bg-reaprovecha-green text-white font-bold items-center justify-center text-xs">
                RE
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-reaprovecha-brown">
                  <span className="text-reaprovecha-orange">RE</span>APROVECHA
                </span>
                <span className="bg-reaprovecha-green text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                  v2.0 Mapa SIG
                </span>
                {DB.isCloudMode() ? (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-black flex items-center space-x-1 border border-emerald-300 shadow-sm">
                    <span>☁️ Nube Supabase Activa</span>
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-black flex items-center space-x-1 border border-amber-300 shadow-sm">
                    <span>📱 Modo Local (Sin Nube)</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium">Mercado Mayorista - Nave Frutos Tropicales</p>
            </div>
          </div>

          {/* Navegación Principal (Tabs Desktop) */}
          <nav className="hidden lg:flex space-x-1 bg-gray-100/80 p-1.5 rounded-2xl border border-gray-200">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium text-xs sm:text-sm transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white text-reaprovecha-green shadow-sm font-semibold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-reaprovecha-green" />
              <span>Dashboard Público</span>
            </button>

            <button
              onClick={() => {
                if (currentRole === 'REGISTRADOR' || currentRole === 'ADMIN') {
                  setActiveTab('mapa');
                } else {
                  onRequestRoleChange('REGISTRADOR');
                }
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium text-xs sm:text-sm transition-all ${
                activeTab === 'mapa'
                  ? 'bg-reaprovecha-green text-white shadow-md font-semibold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <MapPin className="w-4 h-4 text-reaprovecha-orange-light animate-pulse" />
              <span>Mapa Interactivo (SIG)</span>
              {currentRole === 'LIBRE' && <Lock className="w-3.5 h-3.5 opacity-60 ml-1" />}
            </button>

            <button
              onClick={() => {
                if (currentRole === 'REGISTRADOR' || currentRole === 'ADMIN') {
                  setActiveTab('register');
                } else {
                  onRequestRoleChange('REGISTRADOR');
                }
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium text-xs sm:text-sm transition-all ${
                activeTab === 'register'
                  ? 'bg-reaprovecha-green text-white shadow-md font-semibold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-reaprovecha-orange-light" />
              <span>Formulario</span>
              {currentRole === 'LIBRE' && <Lock className="w-3.5 h-3.5 opacity-60 ml-1" />}
            </button>

            <button
              onClick={() => {
                if (currentRole === 'ADMIN') {
                  setActiveTab('admin');
                } else {
                  onRequestRoleChange('ADMIN');
                }
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium text-xs sm:text-sm transition-all ${
                activeTab === 'admin'
                  ? 'bg-reaprovecha-brown text-white shadow-md font-semibold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <Settings className="w-4 h-4 text-reaprovecha-orange" />
              <span>Administración</span>
              {currentRole !== 'ADMIN' && <Lock className="w-3.5 h-3.5 opacity-60 ml-1" />}
            </button>
          </nav>

          {/* Selector y Badge de Rol Activo */}
          <div className="flex items-center space-x-3">
            {currentRole === 'LIBRE' && (
              <button
                onClick={() => onRequestRoleChange('REGISTRADOR')}
                className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-reaprovecha-green-soft text-reaprovecha-green font-semibold text-xs sm:text-sm hover:bg-reaprovecha-green hover:text-white transition-all border border-reaprovecha-green/30"
              >
                <Smartphone className="w-4 h-4" />
                <span>Modo Registrador</span>
              </button>
            )}

            {currentRole === 'REGISTRADOR' && (
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Registrador Activo
                </span>
                <button
                  onClick={onLockRole}
                  title="Cerrar sesión de registrador"
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <Lock className="w-4 h-4" />
                </button>
              </div>
            )}

            {currentRole === 'ADMIN' && (
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-600" />
                  Administrador
                </span>
                <button
                  onClick={onLockRole}
                  title="Cerrar modo administrador"
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <Lock className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navegación Móvil Inferior Táctil */}
      <div className="lg:hidden border-t border-gray-200 bg-white flex justify-around p-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-[11px] font-medium ${
            activeTab === 'dashboard' ? 'text-reaprovecha-green font-bold' : 'text-gray-500'
          }`}
        >
          <BarChart3 className="w-5 h-5 mb-0.5" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => {
            if (currentRole === 'REGISTRADOR' || currentRole === 'ADMIN') {
              setActiveTab('mapa');
            } else {
              onRequestRoleChange('REGISTRADOR');
            }
          }}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-[11px] font-medium ${
            activeTab === 'mapa' ? 'text-reaprovecha-green font-bold' : 'text-gray-500'
          }`}
        >
          <MapPin className="w-5 h-5 mb-0.5" />
          <span>Mapa SIG</span>
        </button>

        <button
          onClick={() => {
            if (currentRole === 'REGISTRADOR' || currentRole === 'ADMIN') {
              setActiveTab('register');
            } else {
              onRequestRoleChange('REGISTRADOR');
            }
          }}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-[11px] font-medium ${
            activeTab === 'register' ? 'text-reaprovecha-green font-bold' : 'text-gray-500'
          }`}
        >
          <PlusCircle className="w-5 h-5 mb-0.5" />
          <span>Formulario</span>
        </button>

        <button
          onClick={() => {
            if (currentRole === 'ADMIN') {
              setActiveTab('admin');
            } else {
              onRequestRoleChange('ADMIN');
            }
          }}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-[11px] font-medium ${
            activeTab === 'admin' ? 'text-reaprovecha-brown font-bold' : 'text-gray-500'
          }`}
        >
          <Settings className="w-5 h-5 mb-0.5" />
          <span>Admin</span>
        </button>
      </div>
    </header>
  );
}
