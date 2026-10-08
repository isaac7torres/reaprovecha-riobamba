import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Scale, 
  Store, 
  PlusCircle, 
  Sparkles, 
  Search, 
  Filter, 
  Building2,
  ChevronRight,
  X,
  Info,
  Apple
} from 'lucide-react';
import { DB } from '../services/db';
import { RegisterForm } from './RegisterForm';

export function InteractiveMarketMap({ currentUser, onRecordSaved }) {
  const [selectedPuestoForForm, setSelectedPuestoForForm] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [filterEstadoPuesto, setFilterEstadoPuesto] = useState('todos'); // 'todos' | 'pesados' | 'pendientes'
  const [searchMapText, setSearchMapText] = useState('');

  const naves = DB.getNaves();
  const puestos = DB.getPuestos();
  const registros = DB.getRegistros();
  const productos = DB.getProductos();

  // Calcular pesajes acumulados HOY por cada puesto
  const todayStr = new Date().toISOString().slice(0, 10);

  const puestosStatsMap = useMemo(() => {
    const map = {};
    puestos.forEach(p => {
      map[p.id] = {
        totalKgHoy: 0,
        countHoy: 0,
        ultimosProductos: [],
        ultimoRegistro: null
      };
    });

    registros.forEach(r => {
      const isToday = r.fecha && r.fecha.slice(0, 10) === todayStr;
      if (isToday && map[r.puestoId]) {
        map[r.puestoId].totalKgHoy += (r.pesoKg || 0);
        map[r.puestoId].countHoy += 1;
        if (!map[r.puestoId].ultimoRegistro) {
          map[r.puestoId].ultimoRegistro = r;
        }
        if (!map[r.puestoId].ultimosProductos.includes(r.productoIcono)) {
          map[r.puestoId].ultimosProductos.push(r.productoIcono);
        }
      }
    });

    return map;
  }, [puestos, registros, todayStr]);

  // Agrupar puestos por Pasillos / Sectores del Plano de la Nave
  const pasillosMap = useMemo(() => {
    const groups = {
      'Pasillo 1 - Frutas de Gran Volumen (Naranja, Banano, Mandarina)': [],
      'Pasillo 2 - Frutas Tropicales (Piña, Maracuyá, Papaya, Mango)': [],
      'Pasillo 3 - Cítricos y Melones (Sandía, Granadilla, Limón)': []
    };

    puestos.forEach((p, idx) => {
      if (idx < 5) {
        groups['Pasillo 1 - Frutas de Gran Volumen (Naranja, Banano, Mandarina)'].push(p);
      } else if (idx < 10) {
        groups['Pasillo 2 - Frutas Tropicales (Piña, Maracuyá, Papaya, Mango)'].push(p);
      } else {
        groups['Pasillo 3 - Cítricos y Melones (Sandía, Granadilla, Limón)'].push(p);
      }
    });

    return groups;
  }, [puestos]);

  const handleOpenPuestoForm = (puesto) => {
    setSelectedPuestoForForm(puesto);
    setIsFormModalOpen(true);
  };

  // Filtrado de puestos en el mapa
  const isPuestoVisible = (puesto) => {
    const stat = puestosStatsMap[puesto.id] || { countHoy: 0 };
    const isPesado = stat.countHoy > 0;

    if (filterEstadoPuesto === 'pesados' && !isPesado) return false;
    if (filterEstadoPuesto === 'pendientes' && isPesado) return false;

    if (searchMapText.trim()) {
      const q = searchMapText.toLowerCase();
      return (
        puesto.numero.toLowerCase().includes(q) ||
        puesto.comerciante.toLowerCase().includes(q) ||
        puesto.sector.toLowerCase().includes(q)
      );
    }

    return true;
  };

  // Contadores globales del mapa para hoy
  const totalPuestos = puestos.length;
  const puestosPesadosHoyCount = Object.values(puestosStatsMap).filter(s => s.countHoy > 0).length;
  const puestosPendientesCount = totalPuestos - puestosPesadosHoyCount;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn pb-24">
      
      {/* Encabezado del Mapa SIG Interactivo */}
      <div className="bg-white p-6 rounded-3xl border border-reaprovecha-green-soft shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-reaprovecha-green-soft rounded-2xl flex items-center justify-center text-reaprovecha-green">
              <MapPin className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-reaprovecha-brown">
                Mapa Georreferenciado de Puestos (SIG 2D)
              </h1>
              <p className="text-xs text-gray-500">
                Nave de Frutos Tropicales - Toca cualquier puesto en el mapa para ingresar su peso.
              </p>
            </div>
          </div>
        </div>

        {/* Leyenda de Colores */}
        <div className="flex items-center space-x-4 bg-gray-50 p-3 rounded-2xl border border-gray-100 text-xs font-bold">
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 animate-pulse" />
            <span className="text-emerald-900">Pesado Hoy ({puestosPesadosHoyCount})</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-400 ring-4 ring-amber-100" />
            <span className="text-amber-900">Pendiente ({puestosPendientesCount})</span>
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtro de Estado en el Mapa */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilterEstadoPuesto('todos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterEstadoPuesto === 'todos'
                ? 'bg-reaprovecha-brown text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos ({totalPuestos})
          </button>

          <button
            onClick={() => setFilterEstadoPuesto('pendientes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterEstadoPuesto === 'pendientes'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pendientes ({puestosPendientesCount})
          </button>

          <button
            onClick={() => setFilterEstadoPuesto('pesados')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterEstadoPuesto === 'pesados'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pesados Hoy ({puestosPesadosHoyCount})
          </button>
        </div>

        {/* Buscador de Puesto */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchMapText}
            onChange={(e) => setSearchMapText(e.target.value)}
            placeholder="Buscar puesto o comerciante..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-reaprovecha-green outline-none"
          />
        </div>
      </div>

      {/* PLANO ARQUITECTÓNICO INTERACTIVO 2D DE LA NAVE DE FRUTOS TROPICALES */}
      <div className="bg-emerald-950/5 p-6 rounded-3xl border-2 border-emerald-800/20 shadow-inner space-y-8 relative overflow-hidden">
        
        {/* Marca de Agua de la Nave */}
        <div className="absolute top-4 right-6 text-emerald-900/10 font-black text-4xl pointer-events-none select-none uppercase tracking-widest">
          PLANO NAVE TROPICAL
        </div>

        {Object.entries(pasillosMap).map(([pasilloNombre, puestosPasillo]) => (
          <div key={pasilloNombre} className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-extrabold text-emerald-900 uppercase tracking-wider bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl border border-emerald-900/10 w-fit">
              <Building2 className="w-4 h-4 text-reaprovecha-green" />
              <span>{pasilloNombre}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {puestosPasillo.filter(isPuestoVisible).map(puesto => {
                const stat = puestosStatsMap[puesto.id] || { countHoy: 0, totalKgHoy: 0, ultimosProductos: [] };
                const isPesado = stat.countHoy > 0;

                return (
                  <button
                    key={puesto.id}
                    onClick={() => handleOpenPuestoForm(puesto)}
                    className={`p-4 rounded-3xl border-2 text-left transition-all relative overflow-hidden group cursor-pointer transform hover:-translate-y-1 shadow-md ${
                      isPesado
                        ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/80 border-emerald-500/80 ring-2 ring-emerald-500/20 hover:border-emerald-600'
                        : 'bg-white border-amber-300/80 hover:border-amber-500 hover:shadow-lg'
                    }`}
                  >
                    {/* Badge de Estado en la Esquina Superior */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center space-x-1 ${
                        isPesado 
                          ? 'bg-emerald-600 text-white shadow-sm' 
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {isPesado ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>PESADO</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>PENDIENTE</span>
                          </>
                        )}
                      </span>

                      <span className="text-xl">
                        {stat.ultimosProductos.length > 0 ? stat.ultimosProductos.join('') : '🍍'}
                      </span>
                    </div>

                    {/* Número de Puesto y Comerciante */}
                    <h4 className="text-lg font-black text-reaprovecha-brown group-hover:text-reaprovecha-green transition-colors">
                      {puesto.numero}
                    </h4>
                    <p className="text-xs text-gray-500 font-medium line-clamp-1">
                      {puesto.comerciante}
                    </p>

                    {/* Peso Acumulado Hoy si ya fue registrado */}
                    {isPesado ? (
                      <div className="mt-3 pt-2 border-t border-emerald-200 flex items-center justify-between">
                        <span className="text-[10px] text-emerald-800 font-bold uppercase">Acumulado Hoy:</span>
                        <span className="text-base font-black text-emerald-700">
                          {stat.totalKgHoy.toFixed(1)} kg
                        </span>
                      </div>
                    ) : (
                      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-reaprovecha-orange font-bold text-xs">
                        <span>Tocar para pesar</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}

                    {/* Efecto decorativo de pulso para pesados */}
                    {isPesado && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

      </div>

      {/* MODAL DE REGISTRO DIRECTO DESDE EL MAPA INTERACTIVO */}
      {isFormModalOpen && selectedPuestoForForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
            
            {/* Header del Modal Mapa */}
            <div className="bg-reaprovecha-green p-5 text-white flex items-center justify-between sticky top-0 z-20 shadow-md">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg">
                    Pesaje Georreferenciado: {selectedPuestoForForm.numero}
                  </h3>
                  <p className="text-xs text-white/80">
                    {selectedPuestoForForm.comerciante} ({selectedPuestoForForm.sector})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Formulario Integrado para el Puesto Seleccionado */}
            <div className="p-4">
              <RegisterForm
                currentUser={currentUser}
                onRecordSaved={() => {
                  if (onRecordSaved) onRecordSaved();
                  setIsFormModalOpen(false);
                }}
              />
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
