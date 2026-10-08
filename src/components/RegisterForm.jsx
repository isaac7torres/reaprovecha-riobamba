import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  Store, 
  Apple, 
  Building2, 
  CheckCircle, 
  AlertTriangle, 
  Send, 
  Sparkles, 
  Info,
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  X,
  Edit2
} from 'lucide-react';
import { DB } from '../services/db';
import { ESTADOS_DESPERDICIO } from '../types/initialData';

export function RegisterForm({ currentUser, onRecordSaved, initialPuestoId = null, isPuestoFixed = false }) {
  const [naves, setNaves] = useState([]);
  const [productos, setProductos] = useState([]);
  const [puestos, setPuestos] = useState([]);

  // Form State
  const [selectedNave, setSelectedNave] = useState('nave-1');
  const [selectedPuesto, setSelectedPuesto] = useState(initialPuestoId || '');
  const [selectedProducto, setSelectedProducto] = useState('');
  const [pesoKg, setPesoKg] = useState('');
  const [estadoResiduo, setEstadoResiduo] = useState('conservas');
  const [observacion, setObservacion] = useState('');

  // UI state
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal de Confirmación previo al envío
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingRecord, setPendingRecord] = useState(null);

  useEffect(() => {
    loadCatalogos();
  }, [initialPuestoId]);

  const loadCatalogos = () => {
    const navs = DB.getNaves();
    const prods = DB.getProductos();
    const psts = DB.getPuestos();

    setNaves(navs);
    setProductos(prods);
    setPuestos(psts);

    if (initialPuestoId) {
      setSelectedPuesto(initialPuestoId);
    } else if (psts.length > 0 && !selectedPuesto) {
      setSelectedPuesto(psts[0].id);
    }

    if (prods.length > 0 && !selectedProducto) setSelectedProducto(prods[0].id);
  };

  // Validar entrada estricta de números positivos y reemplazar comas por puntos para móviles
  const handlePesoChange = (e) => {
    let val = e.target.value.replace(',', '.');
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setPesoKg(val);
      setErrorMsg('');
    }
  };

  // 1. Abrir Modal de Confirmación antes de enviar
  const handleOpenConfirm = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const activeNave = selectedNave || 'nave-1';
    const activePuesto = selectedPuesto || (puestos.length > 0 ? puestos[0].id : '');
    const activeProducto = selectedProducto || (productos.length > 0 ? productos[0].id : '');

    if (!activeNave) {
      setErrorMsg('Por favor selecciona la Nave del mercado');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!activePuesto) {
      setErrorMsg('Por favor selecciona el Número de Puesto');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!activeProducto) {
      setErrorMsg('Por favor selecciona el tipo de Fruta / Producto');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const numPeso = parseFloat(pesoKg);
    if (isNaN(numPeso) || numPeso <= 0) {
      setErrorMsg('⚠️ El peso ingresado debe ser un número positivo mayor a 0 kg (ej. 12.50)');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (numPeso > 2000) {
      setErrorMsg('⚠️ El peso supera los 2,000 kg. Por favor verifica si ingresaste bien el valor de la balanza.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const naveObj = naves.find(n => n.id === activeNave);
    const puestoObj = puestos.find(p => p.id === activePuesto);
    const prodObj = productos.find(p => p.id === activeProducto);
    const estadoObj = ESTADOS_DESPERDICIO.find(e => e.id === estadoResiduo);

    setPendingRecord({
      naveId: activeNave,
      naveNombre: naveObj?.nombre || 'Nave Frutos Tropicales',
      puestoId: activePuesto,
      puestoNumero: puestoObj?.numero || 'Puesto Sin Número',
      puestoComerciante: puestoObj?.comerciante || '',
      productoId: activeProducto,
      productoNombre: prodObj?.nombre || 'Fruta Genérica',
      productoIcono: prodObj?.icono || '🍎',
      pesoKg: numPeso,
      estado: estadoResiduo,
      estadoNombre: estadoObj?.nombre || 'Sin clasificar',
      registrador: currentUser?.nombre || 'Practicante / Registrador',
      observacion: observacion.trim()
    });

    setConfirmModalOpen(true);
  };

  // 2. Confirmación final para guardar en la BD
  const handleFinalSubmit = async () => {
    if (!pendingRecord) return;
    setIsSubmitting(true);

    try {
      await DB.addRegistro(pendingRecord);

      // Cerrar modal de confirmación
      setConfirmModalOpen(false);

      // Feedback de éxito instantáneo
      const msg = `✅ ¡Registro de ${pendingRecord.pesoKg} kg de ${pendingRecord.productoNombre} guardado correctamente!`;
      setSuccessMsg(msg);
      
      // Limpiar peso y observación
      setPesoKg('');
      setObservacion('');
      setPendingRecord(null);

      if (onRecordSaved) onRecordSaved();

      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Desaparecer mensaje tras 6 segundos
      setTimeout(() => setSuccessMsg(''), 6000);

    } catch (err) {
      console.error('Error guardando registro:', err);
      setErrorMsg('Ocurrió un problema al guardar el registro en la base de datos.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 animate-fadeIn pb-24">
      
      {/* Tarjeta Informativa de Turno */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-reaprovecha-green-soft mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-reaprovecha-green-soft rounded-2xl flex items-center justify-center text-reaprovecha-green">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-reaprovecha-brown">Ingreso de Pesaje en Campo</h2>
            <p className="text-xs text-gray-500">
              Registrador: <strong className="text-reaprovecha-green">{currentUser?.nombre || 'Practicante'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
          <div className="flex items-center space-x-1 text-gray-600">
            <Calendar className="w-3.5 h-3.5 text-reaprovecha-orange" />
            <span>{new Date().toLocaleDateString('es-EC')}</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-600">
            <Clock className="w-3.5 h-3.5 text-reaprovecha-green" />
            <span>{new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>

      {/* Alerta de Éxito Prominente */}
      {successMsg && (
        <div className="mb-6 p-5 bg-emerald-50 border-2 border-emerald-400 text-emerald-900 rounded-3xl font-bold flex items-center space-x-3 shadow-md animate-bounce">
          <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-extrabold">{successMsg}</p>
            <p className="text-xs text-emerald-700 font-normal">Los datos ya se reflejan en el Dashboard interactivo.</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 text-red-800 rounded-2xl font-semibold flex items-center space-x-3 shadow-sm">
          <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Formulario Principal (Sin etiquetas HTML form nativas para evitar bloqueos móviles) */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8 space-y-6">
        
        {/* 1. Selección de Nave */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center space-x-1">
            <Building2 className="w-4 h-4 text-reaprovecha-green" />
            <span>1. Nave del Mercado</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {naves.map(n => (
              <button
                type="button"
                key={n.id}
                onClick={() => setSelectedNave(n.id)}
                disabled={!n.activa}
                className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all flex flex-col justify-between ${
                  selectedNave === n.id
                    ? 'border-reaprovecha-green bg-reaprovecha-green-soft text-reaprovecha-green shadow-sm ring-2 ring-reaprovecha-green/30'
                    : n.activa
                    ? 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                    : 'border-gray-100 bg-gray-50 text-gray-400 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span>{n.nombre}</span>
                  {!n.activa && <span className="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded text-gray-500">Próximamente</span>}
                </div>
                <span className="text-[10px] text-gray-500 font-normal line-clamp-1">{n.descripcion}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Selección de Puesto */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center justify-between">
            <span className="flex items-center space-x-1">
              <Store className="w-4 h-4 text-reaprovecha-orange" />
              <span>2. Número de Puesto del Mercado</span>
            </span>
            {isPuestoFixed && (
              <span className="text-[11px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center space-x-1 border border-emerald-300 shadow-sm">
                <span>🔒 Puesto Fijo (Mapa SIG 2D)</span>
              </span>
            )}
          </label>
          <select
            value={selectedPuesto || initialPuestoId || (puestos.length > 0 ? puestos[0].id : '')}
            onChange={(e) => !isPuestoFixed && setSelectedPuesto(e.target.value)}
            disabled={isPuestoFixed}
            className={`w-full p-3.5 rounded-2xl border font-semibold text-sm shadow-sm transition-all ${
              isPuestoFixed
                ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 font-black cursor-not-allowed ring-2 ring-emerald-500/20'
                : 'bg-white border-gray-300 focus:ring-2 focus:ring-reaprovecha-green focus:border-reaprovecha-green text-gray-800'
            }`}
          >
            {puestos.map(p => (
              <option key={p.id} value={p.id}>
                {p.numero} - {p.comerciante} ({p.sector})
              </option>
            ))}
          </select>
        </div>

        {/* 3. Selección de Tipo de Fruta (Costa Ecuatoriana) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center space-x-1">
            <Apple className="w-4 h-4 text-reaprovecha-red" />
            <span>3. Tipo de Fruta / Producto Tropical</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1 border border-gray-100 rounded-2xl bg-gray-50/50">
            {productos.map(p => {
              const isSelected = (selectedProducto || (productos.length > 0 ? productos[0].id : '')) === p.id;
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setSelectedProducto(p.id)}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-1 ${
                    isSelected
                      ? 'border-reaprovecha-red bg-red-50 text-reaprovecha-red font-bold shadow-sm ring-2 ring-reaprovecha-red/30'
                      : 'border-white bg-white hover:border-gray-200 text-gray-700 shadow-sm'
                  }`}
                >
                  <span className="text-2xl">{p.icono}</span>
                  <span className="text-xs font-semibold">{p.nombre}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Campo de Peso de la Balanza (Teclado Decimal Móvil sin validación HTML5 bloqueante) */}
        <div className="bg-reaprovecha-green-soft/40 p-5 rounded-3xl border border-reaprovecha-green/20">
          <label className="block text-xs font-bold uppercase tracking-wider text-reaprovecha-green mb-2 flex items-center space-x-1">
            <Scale className="w-5 h-5 text-reaprovecha-green" />
            <span>4. Peso Lectura Balanza (en Kilogramos)</span>
          </label>

          <div className="relative rounded-2xl shadow-inner bg-white">
            <input
              type="text"
              inputMode="decimal"
              value={pesoKg}
              onChange={handlePesoChange}
              placeholder="Ejemplo: 15.50"
              className="w-full text-3xl font-extrabold text-reaprovecha-brown pl-5 pr-16 py-4 rounded-2xl border-2 border-reaprovecha-green/40 focus:border-reaprovecha-green focus:ring-4 focus:ring-reaprovecha-green/20 transition-all outline-none"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 font-extrabold text-gray-400 text-xl pointer-events-none">
              kg
            </div>
          </div>
          <p className="text-[11px] text-gray-500 mt-2 flex items-center space-x-1">
            <Info className="w-3.5 h-3.5 text-reaprovecha-green" />
            <span>Ingresa el peso en kg (soporta punto y coma decimal en celulares).</span>
          </p>
        </div>

        {/* 5. Estado / Destino de la Fruta */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
            5. Estado / Potencial de Reaprovechamiento
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {ESTADOS_DESPERDICIO.map(est => (
              <button
                type="button"
                key={est.id}
                onClick={() => setEstadoResiduo(est.id)}
                className={`p-3 rounded-2xl text-xs font-bold border transition-all text-center ${
                  estadoResiduo === est.id
                    ? 'border-reaprovecha-orange bg-reaprovecha-orange-soft text-reaprovecha-orange shadow-sm ring-2 ring-reaprovecha-orange/30'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {est.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* 6. Observaciones Opcionales */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
            6. Observaciones (Opcional)
          </label>
          <input
            type="text"
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            placeholder="Ej. Fruta madura caida, corteza dañada..."
            className="w-full p-3 rounded-2xl border border-gray-200 text-xs focus:ring-2 focus:ring-reaprovecha-green outline-none"
          />
        </div>

        {/* Botón Principal (Abre Modal de Confirmación) */}
        <button
          type="button"
          onClick={handleOpenConfirm}
          className="w-full py-4 bg-reaprovecha-green hover:bg-reaprovecha-green-dark text-white font-extrabold text-base rounded-2xl shadow-xl hover:shadow-2xl transition-all active:scale-98 flex items-center justify-center space-x-2 cursor-pointer"
        >
          <Send className="w-5 h-5 text-reaprovecha-orange-light" />
          <span>Guardar Pesaje en Base de Datos</span>
        </button>
      </div>

      {/* MODAL DE CONFIRMACIÓN DE DATOS ANTES DE ENVIAR */}
      {confirmModalOpen && pendingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 transform transition-all">
            
            {/* Header Modal */}
            <div className="bg-reaprovecha-brown p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 bg-reaprovecha-green rounded-xl flex items-center justify-center text-white">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Confirmar Resumen de Pesaje</h3>
                  <p className="text-[11px] text-white/70">Verifica los datos antes de registrar</p>
                </div>
              </div>
              
              <button 
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumen de Datos Clave */}
            <div className="p-6 space-y-4">
              
              <div className="bg-reaprovecha-green-soft/60 p-4 rounded-2xl border border-reaprovecha-green/30 text-center">
                <span className="text-3xl font-black text-reaprovecha-brown block">
                  {pendingRecord.pesoKg} <span className="text-xl text-reaprovecha-green">kg</span>
                </span>
                <span className="text-xs font-bold text-reaprovecha-green uppercase tracking-wider">
                  Peso Lectura Balanza
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-400 font-semibold block text-[10px] uppercase">Nave</span>
                  <span className="font-bold text-gray-800">{pendingRecord.naveNombre}</span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-400 font-semibold block text-[10px] uppercase">Puesto</span>
                  <span className="font-bold text-reaprovecha-brown">{pendingRecord.puestoNumero}</span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-400 font-semibold block text-[10px] uppercase">Fruta / Producto</span>
                  <span className="font-bold text-gray-800 flex items-center space-x-1">
                    <span>{pendingRecord.productoIcono}</span>
                    <span>{pendingRecord.productoNombre}</span>
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-400 font-semibold block text-[10px] uppercase">Destino</span>
                  <span className="font-bold text-reaprovecha-orange">{pendingRecord.estadoNombre}</span>
                </div>
              </div>

              {pendingRecord.observacion && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                  <span className="text-gray-400 font-semibold block text-[10px] uppercase">Observación</span>
                  <p className="font-medium text-gray-700 italic">"{pendingRecord.observacion}"</p>
                </div>
              )}

              {/* Botones de Acción */}
              <div className="pt-2 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmModalOpen(false)}
                  className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-xs flex items-center justify-center space-x-1.5 transition-all"
                >
                  <Edit2 className="w-4 h-4 text-gray-500" />
                  <span>Volver a Editar</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="py-3 px-4 bg-reaprovecha-green hover:bg-reaprovecha-green-dark text-white font-extrabold rounded-2xl text-xs shadow-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Guardando...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-reaprovecha-orange-light" />
                      <span>Confirmar y Enviar</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
