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

  // Agrupar puestos por Lado A (Izquierdo / Puestos 1-10) y Lado B (Derecho / Puestos 11-20)
  const { puestosLadoA, puestosLadoB } = useMemo(() => {
    const ladoA = [];
    const ladoB = [];

    puestos.forEach((p, idx) => {
      // Si el número del puesto o su índice está en la primera mitad (1-10)
      if (idx < 10) {
        ladoA.push(p);
      } else {
        ladoB.push(p);
      }
    });

    return { puestosLadoA: ladoA, puestosLadoB: ladoB };
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

  const renderMapPin = (puesto) => {
    const stat = puestosStatsMap[puesto.id] || { countHoy: 0, totalKgHoy: 0, ultimosProductos: [] };
    const isPesado = stat.countHoy > 0;
    const puestoNumOnly = puesto.numero.replace(/\D/g, '') || puesto.numero;

    return (
      <div key={puesto.id} className="relative group flex flex-col items-center">
        {/* Tooltip Emergente al pasar el cursor o presionar */}
        <div className="absolute bottom-full mb-3 hidden group-hover:flex flex-col items-center z-40 w-48 pointer-events-none animate-fadeIn">
          <div className="bg-slate-900 text-white text-xs p-3 rounded-2xl shadow-2xl border border-slate-700 space-y-1 text-center w-full">
            <div className="flex items-center justify-center space-x-1 font-black text-amber-400">
              <Store className="w-3.5 h-3.5" />
              <span>{puesto.numero}</span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium truncate">{puesto.comerciante}</p>
            {isPesado ? (
              <div className="bg-emerald-950/80 text-emerald-300 px-2 py-1 rounded-xl text-[10px] font-extrabold flex items-center justify-center space-x-1 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Hoy: {stat.totalKgHoy.toFixed(1)} kg</span>
              </div>
            ) : (
              <div className="bg-amber-950/80 text-amber-300 px-2 py-1 rounded-xl text-[10px] font-extrabold flex items-center justify-center space-x-1 border border-amber-500/30">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Pendiente de Pesar</span>
              </div>
            )}
            <p className="text-[9px] text-emerald-400 font-bold tracking-wider pt-0.5 uppercase">Tocar para registrar peso</p>
          </div>
          {/* Flecha del Tooltip */}
          <div className="w-2.5 h-2.5 bg-slate-900 transform rotate-45 -mt-1.5 border-r border-b border-slate-700" />
        </div>

        {/* Pin de Ubicación 3D Interactivo */}
        <button
          onClick={() => handleOpenPuestoForm(puesto)}
          className="relative group cursor-pointer focus:outline-none flex flex-col items-center transform transition-all duration-300 hover:scale-125 hover:-translate-y-2 z-20"
        >
          {/* Sombra proyectada 3D en el piso */}
          <div className="w-6 h-2 bg-slate-900/30 rounded-full filter blur-[1.5px] transition-all group-hover:w-8 group-hover:bg-slate-900/40 translate-y-11" />

          {/* Cuerpo del Pin (Forma de gota de mapa 3D) */}
          <div className={`w-11 h-11 rounded-t-full rounded-br-full transform -rotate-45 shadow-xl border-2 transition-all flex items-center justify-center relative ${
            isPesado
              ? 'bg-gradient-to-tr from-emerald-600 via-emerald-500 to-emerald-400 text-white border-white ring-4 ring-emerald-400/40 hover:ring-emerald-400/80'
              : 'bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 text-slate-950 border-white ring-4 ring-amber-300/50 hover:ring-amber-400/90 animate-pulse'
          }`}>
            
            {/* Contenido interior (rotado 45° para quedar derecho) */}
            <div className="transform rotate-45 flex flex-col items-center justify-center">
              <span className="text-[11px] font-black leading-none tracking-tighter">
                {puestoNumOnly}
              </span>
              <span className="text-[9px]">
                {isPesado ? '✓' : '•'}
              </span>
            </div>

            {/* Badge de pulso animado para puestos pesados hoy */}
            {isPesado && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-300 ring-2 ring-white animate-ping" />
            )}
          </div>

          {/* Etiqueta flotante inferior con el número de puesto */}
          <span className={`mt-2 px-2 py-0.5 rounded-md text-[10px] font-black shadow-md border uppercase tracking-wider ${
            isPesado 
              ? 'bg-emerald-900 text-emerald-100 border-emerald-600' 
              : 'bg-slate-900 text-amber-300 border-slate-700'
          }`}>
            P-{puestoNumOnly}
          </span>
        </button>
      </div>
    );
  };

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
                Nave de Frutos Tropicales - Pasillo Único (10 Puestos a cada lado). Toca cualquier puesto para pesar.
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

      {/* LIENZO VECTORIAL DEL MAPA INTERACTIVO SIG (ESTILO GIS CON PINES 3D) */}
      <div className="bg-slate-200/80 p-4 sm:p-8 rounded-3xl border-4 border-slate-300 shadow-2xl space-y-8 relative overflow-hidden select-none">
        
        {/* Marca de Agua de Fondo del Mapa SIG */}
        <div className="absolute top-4 right-6 text-slate-400/30 font-black text-2xl sm:text-4xl pointer-events-none uppercase tracking-widest flex items-center space-x-2">
          <MapPin className="w-8 h-8 text-slate-400/40" />
          <span>MAPA SIG NAVE FRUTOS TROPICALES</span>
        </div>

        {/* ÁREA SUPERIOR: LADO A (Puestos 01 al 10 - Pines de Ubicación) */}
        <div className="space-y-3 relative z-10">
          <div className="flex items-center space-x-2 text-xs font-black text-emerald-950 uppercase tracking-wider bg-emerald-100/90 backdrop-blur-md px-4 py-2 rounded-xl border border-emerald-300 w-fit shadow-sm">
            <Building2 className="w-4 h-4 text-emerald-700" />
            <span>LADO A - PUESTOS 01 AL 10 (SECTOR IZQUIERDO)</span>
          </div>

          {/* Cuadrícula Georreferenciada de Pines de Lado A */}
          <div className="bg-slate-100/90 p-4 sm:p-6 rounded-3xl border border-slate-300 shadow-inner grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-3 sm:gap-4 items-center justify-items-center">
            {puestosLadoA.filter(isPuestoVisible).map(renderMapPin)}
          </div>
        </div>

        {/* CALLE / CORREDOR DEL PASILLO CENTRAL (ESTILO VÍA PRINCIPAL GIS DE LA IMAGEN) */}
        <div className="my-4 py-6 px-6 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 rounded-3xl border-4 border-amber-600/80 text-amber-950 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl relative overflow-hidden">
          
          {/* Marcación de carril discontinuo central */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-amber-700/40 pointer-events-none" />

          {/* Señalización de Entrada */}
          <div className="flex items-center space-x-2 text-xs font-black tracking-widest uppercase relative z-10">
            <span className="bg-amber-950 text-amber-300 px-3 py-1.5 rounded-xl shadow-md border border-amber-700 flex items-center space-x-1">
              <span>⬅️ ENTRADA PRINCIPAL</span>
            </span>
            <span className="hidden lg:inline text-amber-900 font-extrabold">| PASILLO CENTRAL DE NAVE</span>
          </div>

          {/* Banner identificador del croquis */}
          <div className="bg-white/90 backdrop-blur-md px-5 py-2 rounded-2xl shadow-md border border-amber-600/50 text-amber-950 font-black text-xs uppercase tracking-wider flex items-center space-x-2 relative z-10">
            <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
            <span>VÍA DE CIRCULACIÓN PEATONAL Y MONTACARGAS</span>
          </div>

          {/* Señalización de Salida */}
          <div className="flex items-center space-x-2 text-xs font-black tracking-widest uppercase relative z-10">
            <span className="hidden lg:inline text-amber-900 font-extrabold">ZONA DE CARGA |</span>
            <span className="bg-amber-950 text-amber-300 px-3 py-1.5 rounded-xl shadow-md border border-amber-700 flex items-center space-x-1">
              <span>SALIDA Y CISTERNA ➡️</span>
            </span>
          </div>
        </div>

        {/* ÁREA INFERIOR: LADO B (Puestos 11 al 20 - Pines de Ubicación) */}
        <div className="space-y-3 relative z-10">
          <div className="flex items-center space-x-2 text-xs font-black text-amber-950 uppercase tracking-wider bg-amber-100/90 backdrop-blur-md px-4 py-2 rounded-xl border border-amber-300 w-fit shadow-sm">
            <Building2 className="w-4 h-4 text-amber-700" />
            <span>LADO B - PUESTOS 11 AL 20 (SECTOR DERECHO)</span>
          </div>

          {/* Cuadrícula Georreferenciada de Pines de Lado B */}
          <div className="bg-slate-100/90 p-4 sm:p-6 rounded-3xl border border-slate-300 shadow-inner grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-3 sm:gap-4 items-center justify-items-center">
            {puestosLadoB.filter(isPuestoVisible).map(renderMapPin)}
          </div>
        </div>

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
                initialPuestoId={selectedPuestoForForm.id}
                isPuestoFixed={true}
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
