import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings, 
  Trash2, 
  Plus, 
  FileSpreadsheet, 
  RotateCcw, 
  Check, 
  Store, 
  Apple, 
  Building2, 
  ShieldAlert,
  Search,
  Users,
  KeyRound,
  UserCheck,
  Filter,
  Calendar,
  Scale
} from 'lucide-react';
import { DB, subscribeToDataChanges } from '../services/db';

export function AdminPanel({ onRecordSaved }) {
  const [activeSubTab, setActiveSubTab] = useState('registros');
  const [registros, setRegistros] = useState([]);
  const [productos, setProductos] = useState([]);
  const [puestos, setPuestos] = useState([]);
  const [naves, setNaves] = useState([]);
  const [users, setUsers] = useState([]);

  // Filtros de auditoría
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPracticanteAdmin, setFilterPracticanteAdmin] = useState('todos');
  const [filterRangoAdmin, setFilterRangoAdmin] = useState('todos');

  // Formularios de nuevos catálogos
  const [newFrutaNombre, setNewFrutaNombre] = useState('');
  const [newFrutaIcono, setNewFrutaIcono] = useState('🍎');
  const [newPuestoNumero, setNewPuestoNumero] = useState('');
  const [newPuestoComerciante, setNewPuestoComerciante] = useState('');

  // Formulario nuevo Practicante / Usuario
  const [newUserNombre, setNewUserNombre] = useState('');
  const [newUserPin, setNewUserPin] = useState('');
  const [newUserRol, setNewUserRol] = useState('REGISTRADOR');

  useEffect(() => {
    loadData();
    const unsub = subscribeToDataChanges(loadData);
    return () => unsub();
  }, []);

  const loadData = () => {
    setRegistros(DB.getRegistros());
    setProductos(DB.getProductos());
    setPuestos(DB.getPuestos());
    setNaves(DB.getNaves());
    setUsers(DB.getUsers());
  };

  const handleDeleteRecord = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este registro de pesaje?')) {
      DB.deleteRegistro(id);
      if (onRecordSaved) onRecordSaved();
    }
  };

  const handleAddFruta = (e) => {
    e.preventDefault();
    if (!newFrutaNombre.trim()) return;
    DB.saveProducto({
      naveId: 'nave-1',
      nombre: newFrutaNombre.trim(),
      icono: newFrutaIcono.trim() || '🍎',
      color: '#4E7C27'
    });
    setNewFrutaNombre('');
    setNewFrutaIcono('🍎');
  };

  const handleAddPuesto = (e) => {
    e.preventDefault();
    if (!newPuestoNumero.trim()) return;
    DB.savePuesto({
      numero: newPuestoNumero.startsWith('Puesto') ? newPuestoNumero : `Puesto ${newPuestoNumero}`,
      comerciante: newPuestoComerciante.trim() || 'Comerciante Nave Frutos Tropicales',
      naveId: 'nave-1',
      sector: 'Pasillo Principal'
    });
    setNewPuestoNumero('');
    setNewPuestoComerciante('');
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUserNombre.trim() || !newUserPin.trim()) return;

    if (newUserPin.length < 4) {
      alert('El PIN debe tener al menos 4 dígitos');
      return;
    }

    DB.saveUser({
      nombre: newUserNombre.trim(),
      pin: newUserPin.trim(),
      rol: newUserRol
    });

    setNewUserNombre('');
    setNewUserPin('');
    setNewUserRol('REGISTRADOR');
  };

  const handleDeleteUser = (id) => {
    if (id === 'usr-admin') {
      alert('No se puede eliminar el usuario Administrador Principal');
      return;
    }
    if (window.confirm('¿Deseas revocar el acceso a este Practicante / Registrador?')) {
      DB.deleteUser(id);
    }
  };

  const handleResetSeedData = () => {
    if (window.confirm('⚠️ ¿Deseas restablecer todos los datos iniciales de prueba? Se restaurará el catálogo y los registros semilla.')) {
      DB.resetData();
      if (onRecordSaved) onRecordSaved();
    }
  };

  // Lista única de Practicantes para el filtro
  const registradorList = useMemo(() => {
    const set = new Set(users.map(u => u.nombre));
    registros.forEach(r => {
      if (r.registrador) set.add(r.registrador);
    });
    return Array.from(set);
  }, [users, registros]);

  // Filtrado estricto de auditoría por Practicante y Fecha
  const filteredAuditoria = useMemo(() => {
    let list = [...registros];

    // Filtro por Rango Temporal
    const now = new Date();
    if (filterRangoAdmin === 'hoy') {
      const todayStr = now.toISOString().slice(0, 10);
      list = list.filter(r => r.fecha.slice(0, 10) === todayStr);
    } else if (filterRangoAdmin === '7dias') {
      const past7 = new Date();
      past7.setDate(now.getDate() - 7);
      list = list.filter(r => new Date(r.fecha) >= past7);
    } else if (filterRangoAdmin === '30dias') {
      const past30 = new Date();
      past30.setDate(now.getDate() - 30);
      list = list.filter(r => new Date(r.fecha) >= past30);
    }

    // Filtro por Practicante
    if (filterPracticanteAdmin !== 'todos') {
      list = list.filter(r => r.registrador === filterPracticanteAdmin);
    }

    // Buscador general de texto
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(r => (
        r.puestoNumero.toLowerCase().includes(q) ||
        r.productoNombre.toLowerCase().includes(q) ||
        r.registrador.toLowerCase().includes(q) ||
        (r.observacion && r.observacion.toLowerCase().includes(q))
      ));
    }

    return list;
  }, [registros, filterRangoAdmin, filterPracticanteAdmin, searchTerm]);

  // Resumen Estadístico por Practicante para el Administrador
  const statsPracticantes = useMemo(() => {
    const map = {};
    users.forEach(u => {
      map[u.nombre] = { nombre: u.nombre, pin: u.pin, rol: u.rol, id: u.id, totalKg: 0, totalPesajes: 0, ultimaFecha: null };
    });

    registros.forEach(r => {
      if (!map[r.registrador]) {
        map[r.registrador] = { nombre: r.registrador, pin: 'N/A', rol: 'REGISTRADOR', id: r.registrador, totalKg: 0, totalPesajes: 0, ultimaFecha: null };
      }
      map[r.registrador].totalKg += (r.pesoKg || 0);
      map[r.registrador].totalPesajes += 1;
      
      const rDate = new Date(r.fecha);
      if (!map[r.registrador].ultimaFecha || rDate > map[r.registrador].ultimaFecha) {
        map[r.registrador].ultimaFecha = rDate;
      }
    });

    return Object.values(map);
  }, [users, registros]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Encabezado Panel Admin */}
      <div className="bg-reaprovecha-brown text-white p-6 rounded-3xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-reaprovecha-orange-light">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">Panel de Control de Administración</h1>
            <p className="text-xs text-white/70">Gestión de catálogos del mercado, auditoría de pesajes, control de practicantes y exportación.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => DB.exportToExcel(filteredAuditoria)}
            className="px-4 py-2.5 bg-reaprovecha-green hover:bg-reaprovecha-green-dark text-white rounded-xl font-bold text-xs flex items-center space-x-2 transition-all shadow-md"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel (Filtro Actual)</span>
          </button>

          <button
            onClick={handleResetSeedData}
            className="px-4 py-2.5 bg-white/10 hover:bg-red-600 text-white rounded-xl font-bold text-xs flex items-center space-x-2 transition-all border border-white/20"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restablecer Datos Semilla</span>
          </button>
        </div>
      </div>

      {/* Sub-navegación del Admin */}
      <div className="flex space-x-2 border-b border-gray-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('registros')}
          className={`px-5 py-2.5 rounded-2xl font-extrabold text-xs transition-all shrink-0 ${
            activeSubTab === 'registros'
              ? 'bg-reaprovecha-green text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Auditoría de Pesajes ({filteredAuditoria.length})
        </button>

        <button
          onClick={() => setActiveSubTab('practicantes')}
          className={`px-5 py-2.5 rounded-2xl font-extrabold text-xs transition-all shrink-0 ${
            activeSubTab === 'practicantes'
              ? 'bg-reaprovecha-green text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Practicantes & Control ({statsPracticantes.length})
        </button>

        <button
          onClick={() => setActiveSubTab('frutas')}
          className={`px-5 py-2.5 rounded-2xl font-extrabold text-xs transition-all shrink-0 ${
            activeSubTab === 'frutas'
              ? 'bg-reaprovecha-green text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Catálogo de Frutas ({productos.length})
        </button>

        <button
          onClick={() => setActiveSubTab('puestos')}
          className={`px-5 py-2.5 rounded-2xl font-extrabold text-xs transition-all shrink-0 ${
            activeSubTab === 'puestos'
              ? 'bg-reaprovecha-green text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Gestión de Puestos ({puestos.length})
        </button>
      </div>

      {/* SUBTAB 1: AUDITORÍA DE REGISTROS CON FILTROS POR PRACTICANTE Y FECHA */}
      {activeSubTab === 'registros' && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-lg text-reaprovecha-brown">Auditoría Estricta de Pesajes</h3>
              <p className="text-xs text-gray-500">Filtra por practicante específico y rango de fecha para revisar el trabajo realizado.</p>
            </div>

            {/* Buscador */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar puesto, fruta..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-reaprovecha-green outline-none"
              />
            </div>
          </div>

          {/* Barra de Filtros de Auditoría */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div>
              <label className="block text-[11px] font-extrabold text-gray-600 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <Users className="w-3.5 h-3.5 text-reaprovecha-green" />
                <span>Filtrar por Practicante / Registrador</span>
              </label>
              <select
                value={filterPracticanteAdmin}
                onChange={(e) => setFilterPracticanteAdmin(e.target.value)}
                className="w-full p-2.5 text-xs font-semibold rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-reaprovecha-green"
              >
                <option value="todos">Todos los Practicantes</option>
                {registradorList.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-gray-600 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-reaprovecha-orange" />
                <span>Filtrar por Fecha</span>
              </label>
              <select
                value={filterRangoAdmin}
                onChange={(e) => setFilterRangoAdmin(e.target.value)}
                className="w-full p-2.5 text-xs font-semibold rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-reaprovecha-green"
              >
                <option value="todos">Todo el Histórico</option>
                <option value="hoy">Hoy</option>
                <option value="7dias">Últimos 7 días</option>
                <option value="30dias">Últimos 30 días</option>
              </select>
            </div>
          </div>

          {/* Tabla de Resultados */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-gray-100 text-gray-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-2">Fecha y Hora</th>
                  <th className="py-3 px-2">Practicante</th>
                  <th className="py-3 px-2">Puesto</th>
                  <th className="py-3 px-2">Fruta</th>
                  <th className="py-3 px-2 text-right">Peso (kg)</th>
                  <th className="py-3 px-2">Destino</th>
                  <th className="py-3 px-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAuditoria.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400 font-medium">
                      No se encontraron registros para el practicante o fecha seleccionada.
                    </td>
                  </tr>
                ) : (
                  filteredAuditoria.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50/80">
                      <td className="py-3 px-2 text-gray-600 font-medium">
                        {new Date(r.fecha).toLocaleString('es-EC')}
                      </td>
                      <td className="py-3 px-2 font-bold text-reaprovecha-green">
                        {r.registrador}
                      </td>
                      <td className="py-3 px-2 font-bold text-reaprovecha-brown">{r.puestoNumero}</td>
                      <td className="py-3 px-2 font-bold text-gray-800">
                        {r.productoIcono} {r.productoNombre}
                      </td>
                      <td className="py-3 px-2 font-black text-reaprovecha-green text-right text-sm">
                        {r.pesoKg} kg
                      </td>
                      <td className="py-3 px-2">
                        <span className="bg-gray-100 text-gray-700 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                          {r.estadoNombre || r.estado}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => handleDeleteRecord(r.id)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: CONTROL DE PRACTICANTES Y TARJETAS DE RENDIMIENTO */}
      {activeSubTab === 'practicantes' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Formulario Agregar Practicante */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-fit space-y-4">
              <h3 className="font-extrabold text-base text-reaprovecha-brown flex items-center space-x-2">
                <Users className="w-5 h-5 text-reaprovecha-green" />
                <span>Registrar Nuevo Practicante</span>
              </h3>

              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre Completo / Identificador</label>
                  <input
                    type="text"
                    value={newUserNombre}
                    onChange={(e) => setNewUserNombre(e.target.value)}
                    placeholder="Ej. Practicante Mateo (Turno Mañana)"
                    className="w-full p-3 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-reaprovecha-green outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">PIN de Acceso Móvil (mínimo 4 dígitos)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={newUserPin}
                    onChange={(e) => setNewUserPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ej. 4321"
                    className="w-full p-3 rounded-xl border border-gray-200 text-xs font-mono font-bold focus:ring-2 focus:ring-reaprovecha-green outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Rol de Permisos</label>
                  <select
                    value={newUserRol}
                    onChange={(e) => setNewUserRol(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-reaprovecha-green outline-none bg-white"
                  >
                    <option value="REGISTRADOR">Registrador (Pesaje en Campo)</option>
                    <option value="ADMIN">Administrador (Control Total)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-reaprovecha-green text-white font-bold text-xs rounded-xl shadow-md hover:bg-reaprovecha-green-dark transition-all flex items-center justify-center space-x-2"
                >
                  <UserCheck className="w-4 h-4 text-reaprovecha-orange-light" />
                  <span>Crear Practicante y Activar PIN</span>
                </button>
              </form>
            </div>

            {/* Tarjetas Rendimiento de Practicantes */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
              <h3 className="font-extrabold text-base text-reaprovecha-brown">Control Estricto de Desempeño por Practicante</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {statsPracticantes.map(p => (
                  <div key={p.id} className="p-5 border border-gray-100 bg-gray-50/80 rounded-2xl space-y-3 relative overflow-hidden">
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-reaprovecha-green-soft rounded-xl flex items-center justify-center text-reaprovecha-green font-bold text-xs">
                          {p.nombre.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs text-gray-800">{p.nombre}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            p.rol === 'ADMIN' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {p.rol}
                          </span>
                        </div>
                      </div>

                      {p.id !== 'usr-admin' && (
                        <button
                          onClick={() => handleDeleteUser(p.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-200/60 text-xs">
                      <div>
                        <span className="text-[10px] font-semibold text-gray-400 uppercase">Total Pesado</span>
                        <p className="font-black text-reaprovecha-green text-sm">{p.totalKg.toFixed(1)} kg</p>
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold text-gray-400 uppercase">Pesajes Registrados</span>
                        <p className="font-bold text-reaprovecha-brown text-sm">{p.totalPesajes} pesajes</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-gray-500">
                      <span className="flex items-center space-x-1 font-mono font-bold text-reaprovecha-orange">
                        <KeyRound className="w-3 h-3" />
                        <span>PIN: {p.pin}</span>
                      </span>

                      <span>
                        Último: {p.ultimaFecha ? p.ultimaFecha.toLocaleDateString('es-EC', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Sin pesajes'}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setFilterPracticanteAdmin(p.nombre);
                        setActiveSubTab('registros');
                      }}
                      className="w-full mt-2 py-1.5 bg-white hover:bg-reaprovecha-green hover:text-white text-reaprovecha-green border border-reaprovecha-green/30 rounded-xl text-xs font-bold transition-all text-center"
                    >
                      Ver Pesajes de {p.nombre.split(' ')[0]}
                    </button>

                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: CATÁLOGO DE FRUTAS */}
      {activeSubTab === 'frutas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-fit space-y-4">
            <h3 className="font-extrabold text-base text-reaprovecha-brown flex items-center space-x-2">
              <Plus className="w-5 h-5 text-reaprovecha-green" />
              <span>Agregar Fruta al Catálogo</span>
            </h3>

            <form onSubmit={handleAddFruta} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre de Fruta / Producto</label>
                <input
                  type="text"
                  value={newFrutaNombre}
                  onChange={(e) => setNewFrutaNombre(e.target.value)}
                  placeholder="Ej. Toronja, Guayaba, Carambola..."
                  className="w-full p-3 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-reaprovecha-green outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Ícono / Emoji</label>
                <input
                  type="text"
                  value={newFrutaIcono}
                  onChange={(e) => setNewFrutaIcono(e.target.value)}
                  placeholder="Ej. 🍊"
                  className="w-full p-3 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-reaprovecha-green outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-reaprovecha-green text-white font-bold text-xs rounded-xl shadow-md hover:bg-reaprovecha-green-dark transition-all"
              >
                Guardar Nueva Fruta
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-extrabold text-base text-reaprovecha-brown mb-4">Frutas Registradas en Nave Frutos Tropicales</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {productos.map(p => (
                <div key={p.id} className="p-3 border border-gray-100 bg-gray-50 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{p.icono}</span>
                    <div>
                      <h4 className="font-bold text-xs text-gray-800">{p.nombre}</h4>
                      <p className="text-[10px] text-gray-400">ID: {p.id}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => DB.deleteProducto(p.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: GESTIÓN DE PUESTOS */}
      {activeSubTab === 'puestos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-fit space-y-4">
            <h3 className="font-extrabold text-base text-reaprovecha-brown flex items-center space-x-2">
              <Store className="w-5 h-5 text-reaprovecha-orange" />
              <span>Agregar Puesto del Mercado</span>
            </h3>

            <form onSubmit={handleAddPuesto} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Número de Puesto</label>
                <input
                  type="text"
                  value={newPuestoNumero}
                  onChange={(e) => setNewPuestoNumero(e.target.value)}
                  placeholder="Ej. 16, Puesto 16..."
                  className="w-full p-3 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-reaprovecha-green outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre / Identificador Comerciante</label>
                <input
                  type="text"
                  value={newPuestoComerciante}
                  onChange={(e) => setNewPuestoComerciante(e.target.value)}
                  placeholder="Ej. Comerciante Sector C"
                  className="w-full p-3 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-reaprovecha-green outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-reaprovecha-orange text-white font-bold text-xs rounded-xl shadow-md hover:bg-orange-600 transition-all"
              >
                Guardar Puesto
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-extrabold text-base text-reaprovecha-brown mb-4">Puestos Catastrados en Nave Frutos Tropicales</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {puestos.map(p => (
                <div key={p.id} className="p-3.5 border border-gray-100 bg-gray-50 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-reaprovecha-brown">{p.numero}</h4>
                    <p className="text-xs text-gray-500 font-medium">{p.comerciante}</p>
                  </div>

                  <button
                    onClick={() => DB.deletePuesto(p.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
