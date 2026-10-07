import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, AreaChart, Area
} from 'recharts';
import { 
  Scale, 
  TrendingUp, 
  Apple, 
  Store, 
  Filter, 
  Factory, 
  Zap, 
  Leaf, 
  FileSpreadsheet,
  Layers,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { DB, subscribeToDataChanges } from '../services/db';

export function PublicDashboard() {
  const [registros, setRegistros] = useState([]);
  const [naves, setNaves] = useState([]);
  const [productos, setProductos] = useState([]);
  const [puestos, setPuestos] = useState([]);
  const [users, setUsers] = useState([]);

  // Filtros state
  const [filterRango, setFilterRango] = useState('7dias');
  const [filterNave, setFilterNave] = useState('todas');
  const [filterFruta, setFilterFruta] = useState('todas');
  const [filterPuesto, setFilterPuesto] = useState('todos');
  const [filterRegistrador, setFilterRegistrador] = useState('todos');

  useEffect(() => {
    loadAllData();
    const unsubscribe = subscribeToDataChanges(loadAllData);
    return () => unsubscribe();
  }, []);

  const loadAllData = () => {
    setRegistros(DB.getRegistros());
    setNaves(DB.getNaves());
    setProductos(DB.getProductos());
    setPuestos(DB.getPuestos());
    setUsers(DB.getUsers());
  };

  // Listado de nombres únicos de registradores que han ingresado pesajes
  const registradorList = useMemo(() => {
    const set = new Set(users.map(u => u.nombre));
    registros.forEach(r => {
      if (r.registrador) set.add(r.registrador);
    });
    return Array.from(set);
  }, [users, registros]);

  // Filtrado reactivo de registros
  const filteredRecords = useMemo(() => {
    let list = [...registros];

    // Filtro por Fecha
    const now = new Date();
    if (filterRango === 'hoy') {
      const todayStr = now.toISOString().slice(0, 10);
      list = list.filter(r => r.fecha.slice(0, 10) === todayStr);
    } else if (filterRango === '7dias') {
      const past7 = new Date();
      past7.setDate(now.getDate() - 7);
      list = list.filter(r => new Date(r.fecha) >= past7);
    } else if (filterRango === '30dias') {
      const past30 = new Date();
      past30.setDate(now.getDate() - 30);
      list = list.filter(r => new Date(r.fecha) >= past30);
    }

    // Filtro por Nave
    if (filterNave !== 'todas') {
      list = list.filter(r => r.naveId === filterNave);
    }

    // Filtro por Fruta
    if (filterFruta !== 'todas') {
      list = list.filter(r => r.productoId === filterFruta);
    }

    // Filtro por Puesto
    if (filterPuesto !== 'todos') {
      list = list.filter(r => r.puestoId === filterPuesto);
    }

    // Filtro por Practicante / Registrador
    if (filterRegistrador !== 'todos') {
      list = list.filter(r => r.registrador === filterRegistrador);
    }

    return list;
  }, [registros, filterRango, filterNave, filterFruta, filterPuesto, filterRegistrador]);

  // KPIs
  const stats = useMemo(() => {
    const totalKg = filteredRecords.reduce((acc, r) => acc + (r.pesoKg || 0), 0);
    const totalToneladas = (totalKg / 1000).toFixed(2);
    const totalPesajes = filteredRecords.length;

    // Agrupación por fruta
    const byFruta = {};
    filteredRecords.forEach(r => {
      byFruta[r.productoNombre] = (byFruta[r.productoNombre] || 0) + r.pesoKg;
    });

    let topFruta = { nombre: 'N/A', kg: 0, pct: 0 };
    Object.entries(byFruta).forEach(([nombre, kg]) => {
      if (kg > topFruta.kg) {
        topFruta = { 
          nombre, 
          kg: parseFloat(kg.toFixed(1)), 
          pct: totalKg > 0 ? ((kg / totalKg) * 100).toFixed(1) : 0 
        };
      }
    });

    // Agrupación por puesto
    const byPuesto = {};
    filteredRecords.forEach(r => {
      byPuesto[r.puestoNumero] = (byPuesto[r.puestoNumero] || 0) + r.pesoKg;
    });

    let topPuesto = { numero: 'N/A', kg: 0 };
    Object.entries(byPuesto).forEach(([numero, kg]) => {
      if (kg > topPuesto.kg) {
        topPuesto = { numero, kg: parseFloat(kg.toFixed(1)) };
      }
    });

    // Proyecciones de Reaprovechamiento
    const conservasEstimadasKg = (totalKg * 0.58).toFixed(1);
    const cerdosEstimadosKg = (totalKg * 0.32).toFixed(1);
    const compostEstimadoKg = (totalKg * 0.10).toFixed(1);
    const co2EvitadoKg = (totalKg * 1.9).toFixed(1);

    return {
      totalKg: parseFloat(totalKg.toFixed(1)),
      totalToneladas,
      totalPesajes,
      topFruta,
      topPuesto,
      conservasEstimadasKg,
      cerdosEstimadosKg,
      compostEstimadoKg,
      co2EvitadoKg
    };
  }, [filteredRecords]);

  // Datos para Gráficos
  const chartDataFrutas = useMemo(() => {
    const map = {};
    filteredRecords.forEach(r => {
      map[r.productoNombre] = (map[r.productoNombre] || 0) + r.pesoKg;
    });
    return Object.entries(map)
      .map(([nombre, peso]) => ({ nombre, peso: parseFloat(peso.toFixed(1)) }))
      .sort((a, b) => b.peso - a.peso)
      .slice(0, 8);
  }, [filteredRecords]);

  const chartDataDiaria = useMemo(() => {
    const map = {};
    filteredRecords.forEach(r => {
      const dateKey = new Date(r.fecha).toLocaleDateString('es-EC', { month: 'short', day: 'numeric' });
      map[dateKey] = (map[dateKey] || 0) + r.pesoKg;
    });
    return Object.entries(map).map(([fecha, peso]) => ({ fecha, peso: parseFloat(peso.toFixed(1)) }));
  }, [filteredRecords]);

  const chartDataEstado = useMemo(() => {
    const map = {
      'Conservas / Mermelada': 0,
      'Alimento Cerdos': 0,
      'Compost': 0
    };
    filteredRecords.forEach(r => {
      if (r.estado === 'conservas') map['Conservas / Mermelada'] += r.pesoKg;
      else if (r.estado === 'animales') map['Alimento Cerdos'] += r.pesoKg;
      else map['Compost'] += r.pesoKg;
    });
    return [
      { name: 'Conservas / Mermelada', value: parseFloat(map['Conservas / Mermelada'].toFixed(1)), color: '#4E7C27' },
      { name: 'Alimento Cerdos', value: parseFloat(map['Alimento Cerdos'].toFixed(1)), color: '#F39C12' },
      { name: 'Compost', value: parseFloat(map['Compost'].toFixed(1)), color: '#D32F2F' },
    ];
  }, [filteredRecords]);

  const COLORS_PALETTE = ['#4E7C27', '#E67E22', '#D32F2F', '#F1C40F', '#8E44AD', '#16A085', '#2980B9', '#D35400'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Encabezado del Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-reaprovecha-green-soft shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-reaprovecha-brown">
              Tablero Interactivo de Merma Orgánica
            </h1>
            <span className="bg-reaprovecha-green text-white text-xs px-2.5 py-1 rounded-full font-bold flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-reaprovecha-orange-light" />
              <span>Tiempo Real</span>
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Visualización y recolección de desechos frutícolas para políticas de conservación e industrialización.
          </p>
        </div>

        <button
          onClick={() => DB.exportToExcel(filteredRecords)}
          className="inline-flex items-center space-x-2 bg-reaprovecha-green-soft text-reaprovecha-green hover:bg-reaprovecha-green hover:text-white px-4 py-2.5 rounded-2xl font-bold text-xs transition-all border border-reaprovecha-green/30"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Exportar Datos (Excel/CSV)</span>
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center space-x-2 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-reaprovecha-green" />
          <span>Filtros de Análisis</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Rango de Fecha */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">Rango Temporal</label>
            <select
              value={filterRango}
              onChange={(e) => setFilterRango(e.target.value)}
              className="w-full p-2.5 text-xs font-semibold rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-reaprovecha-green"
            >
              <option value="hoy">Hoy</option>
              <option value="7dias">Últimos 7 días</option>
              <option value="30dias">Últimos 30 días</option>
              <option value="todos">Todo el Histórico</option>
            </select>
          </div>

          {/* Practicante / Registrador */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">Practicante / Registrador</label>
            <select
              value={filterRegistrador}
              onChange={(e) => setFilterRegistrador(e.target.value)}
              className="w-full p-2.5 text-xs font-semibold rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-reaprovecha-green"
            >
              <option value="todos">Todos los Practicantes</option>
              {registradorList.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Nave */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">Nave del Mercado</label>
            <select
              value={filterNave}
              onChange={(e) => setFilterNave(e.target.value)}
              className="w-full p-2.5 text-xs font-semibold rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-reaprovecha-green"
            >
              <option value="todas">Todas las Naves</option>
              {naves.map(n => (
                <option key={n.id} value={n.id}>{n.nombre}</option>
              ))}
            </select>
          </div>

          {/* Fruta */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">Tipo de Fruta</label>
            <select
              value={filterFruta}
              onChange={(e) => setFilterFruta(e.target.value)}
              className="w-full p-2.5 text-xs font-semibold rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-reaprovecha-green"
            >
              <option value="todas">Todas las Frutas</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>{p.icono} {p.nombre}</option>
              ))}
            </select>
          </div>

          {/* Puesto */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">Número de Puesto</label>
            <select
              value={filterPuesto}
              onChange={(e) => setFilterPuesto(e.target.value)}
              className="w-full p-2.5 text-xs font-semibold rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-reaprovecha-green"
            >
              <option value="todos">Todos los Puestos</option>
              {puestos.map(p => (
                <option key={p.id} value={p.id}>{p.numero} ({p.comerciante})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tarjetas KPI Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1: Total Peso */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-reaprovecha-green-soft relative overflow-hidden">
          <div className="w-12 h-12 bg-reaprovecha-green-soft rounded-2xl flex items-center justify-center text-reaprovecha-green mb-3">
            <Scale className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Residuos Pesados</p>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-reaprovecha-brown">{stats.totalKg}</span>
            <span className="text-sm font-bold text-reaprovecha-green">kg</span>
          </div>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Equivalente a <strong className="text-reaprovecha-green">{stats.totalToneladas} Toneladas</strong>
          </p>
        </div>

        {/* KPI 2: Total Registros */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-reaprovecha-orange-soft relative overflow-hidden">
          <div className="w-12 h-12 bg-reaprovecha-orange-soft rounded-2xl flex items-center justify-center text-reaprovecha-orange mb-3">
            <TrendingUp className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mediciones Realizadas</p>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-reaprovecha-brown">{stats.totalPesajes}</span>
            <span className="text-xs font-bold text-reaprovecha-orange">pesajes</span>
          </div>
          <p className="text-xs text-gray-500 mt-1 font-medium">Muestra estadística en campo</p>
        </div>

        {/* KPI 3: Mayor Merma */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-reaprovecha-red-soft relative overflow-hidden">
          <div className="w-12 h-12 bg-reaprovecha-red-soft rounded-2xl flex items-center justify-center text-reaprovecha-red mb-3">
            <Apple className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fruta de Mayor Merma</p>
          <div className="mt-1">
            <span className="text-2xl font-black text-reaprovecha-brown truncate block">{stats.topFruta.nombre}</span>
          </div>
          <p className="text-xs text-reaprovecha-red mt-1 font-bold">
            {stats.topFruta.kg} kg ({stats.topFruta.pct}% del total)
          </p>
        </div>

        {/* KPI 4: Mayor Puesto */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-700 mb-3">
            <Store className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Puesto con Mayor Merma</p>
          <div className="mt-1">
            <span className="text-2xl font-black text-reaprovecha-brown">{stats.topPuesto.numero}</span>
          </div>
          <p className="text-xs text-gray-600 mt-1 font-bold">
            {stats.topPuesto.kg} kg acumulados
          </p>
        </div>
      </div>

      {/* Estimador de Conservas y Revalorización */}
      <div className="bg-gradient-to-br from-reaprovecha-green via-reaprovecha-green-dark to-reaprovecha-brown text-white p-7 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl">
              <Factory className="w-7 h-7 text-reaprovecha-orange-light" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold tracking-tight">Proyección de Revalorización e Industrialización</h3>
              <p className="text-xs text-white/80">Impacto potencial estimado si se procesan los residuos en conservas y derivados</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <div className="flex items-center space-x-2 text-reaprovecha-orange-light text-xs font-bold mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Mermeladas / Conservas</span>
              </div>
              <p className="text-2xl font-black">{stats.conservasEstimadasKg} kg</p>
              <p className="text-[11px] text-white/70 mt-1">Potencial producción industrial</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <div className="flex items-center space-x-2 text-amber-300 text-xs font-bold mb-1">
                <Zap className="w-4 h-4" />
                <span>Alimento Porcino</span>
              </div>
              <p className="text-2xl font-black">{stats.cerdosEstimadosKg} kg</p>
              <p className="text-[11px] text-white/70 mt-1">Ración nutritiva para cerdos</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <div className="flex items-center space-x-2 text-emerald-300 text-xs font-bold mb-1">
                <Leaf className="w-4 h-4" />
                <span>Biocompost Orgánico</span>
              </div>
              <p className="text-2xl font-black">{stats.compostEstimadoKg} kg</p>
              <p className="text-[11px] text-white/70 mt-1">Abono fértil para el campo</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <div className="flex items-center space-x-2 text-sky-300 text-xs font-bold mb-1">
                <Leaf className="w-4 h-4" />
                <span>CO₂ Evitado</span>
              </div>
              <p className="text-2xl font-black">{stats.co2EvitadoKg} kg</p>
              <p className="text-[11px] text-white/70 mt-1">Mitigación ambiental</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos Interactivos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico 1: Frutas más desperdiciadas */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-extrabold text-base text-reaprovecha-brown mb-4 flex items-center space-x-2">
            <Apple className="w-5 h-5 text-reaprovecha-red" />
            <span>Volumen de Desperdicio por Tipo de Fruta (kg)</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataFrutas}>
                <XAxis dataKey="nombre" tick={{ fontSize: 11 }} interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(val) => [`${val} kg`, 'Peso Total']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="peso" radius={[8, 8, 0, 0]}>
                  {chartDataFrutas.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_PALETTE[index % COLORS_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Evolución Temporal */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-extrabold text-base text-reaprovecha-brown mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-reaprovecha-green" />
            <span>Evolución Diaria de Desperdicios (kg)</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartDataDiaria}>
                <defs>
                  <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4E7C27" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4E7C27" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val) => [`${val} kg`, 'Desecho del Día']} />
                <Area type="monotone" dataKey="peso" stroke="#4E7C27" strokeWidth={3} fillOpacity={1} fill="url(#colorPeso)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 3: Estado y Destino */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-extrabold text-base text-reaprovecha-brown mb-4 flex items-center space-x-2">
            <Layers className="w-5 h-5 text-reaprovecha-orange" />
            <span>Distribución por Estado y Destino de la Fruta</span>
          </h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartDataEstado}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartDataEstado.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`${val} kg`, 'Total']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-4 text-xs font-semibold mt-2">
            {chartDataEstado.map(e => (
              <div key={e.name} className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: e.color }} />
                <span>{e.name} ({e.value} kg)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabla en vivo de Últimos Registros */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <h3 className="font-extrabold text-base text-reaprovecha-brown mb-4 flex items-center justify-between">
            <span>Últimos Pesajes Registrados</span>
            <span className="text-xs text-gray-400 font-normal">Mostrando los 6 más recientes</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2">Fecha</th>
                  <th className="py-2">Registrador</th>
                  <th className="py-2">Puesto</th>
                  <th className="py-2">Fruta</th>
                  <th className="py-2 text-right">Peso (kg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecords.slice(0, 6).map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/80">
                    <td className="py-2.5 text-gray-500 font-medium">
                      {new Date(r.fecha).toLocaleDateString('es-EC', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 font-bold text-reaprovecha-green">
                      {r.registrador}
                    </td>
                    <td className="py-2.5 font-bold text-gray-800">{r.puestoNumero}</td>
                    <td className="py-2.5 font-semibold text-gray-700">
                      {r.productoIcono} {r.productoNombre}
                    </td>
                    <td className="py-2.5 font-black text-reaprovecha-green text-right">
                      {r.pesoKg} kg
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
