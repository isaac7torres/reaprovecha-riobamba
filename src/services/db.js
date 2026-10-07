import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import { 
  INITIAL_NAVES, 
  INITIAL_PRODUCTOS, 
  INITIAL_PUESTOS, 
  INITIAL_REGISTROS, 
  INITIAL_USERS 
} from '../types/initialData';

const STORAGE_KEYS = {
  NAVES: 'reaprovecha_naves_v1',
  PRODUCTOS: 'reaprovecha_productos_v1',
  PUESTOS: 'reaprovecha_puestos_v1',
  REGISTROS: 'reaprovecha_registros_v1',
  USERS: 'reaprovecha_users_v1',
};

// Determinar el servidor backend de red local
const getApiBaseUrl = () => {
  const host = window.location.hostname || 'localhost';
  return `http://${host}:3001/api`;
};

// Cliente de Supabase para Producción en la Nube
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Listeners reactivos de la UI
const listeners = new Set();
const notifyListeners = () => listeners.forEach(cb => cb());

export const subscribeToDataChanges = (callback) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

// Inicializar almacenamiento local con datos semilla si no existen
const initStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.NAVES)) {
    localStorage.setItem(STORAGE_KEYS.NAVES, JSON.stringify(INITIAL_NAVES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTOS)) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTOS, JSON.stringify(INITIAL_PRODUCTOS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PUESTOS)) {
    localStorage.setItem(STORAGE_KEYS.PUESTOS, JSON.stringify(INITIAL_PUESTOS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.REGISTROS)) {
    localStorage.setItem(STORAGE_KEYS.REGISTROS, JSON.stringify(INITIAL_REGISTROS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  }
};

initStorage();

// Sincronización en Tiempo Real con Supabase en Producción Vercel
if (supabase) {
  // Cargar datos iniciales de Supabase al arrancar
  const fetchCloudRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('registros_desperdicios')
        .select('*')
        .order('fecha', { ascending: false });

      if (!error && data && data.length > 0) {
        localStorage.setItem(STORAGE_KEYS.REGISTROS, JSON.stringify(data));
        notifyListeners();
      }
    } catch (err) {
      console.warn('Error cargando registros de Supabase:', err);
    }
  };

  fetchCloudRecords();

  // Escuchar cambios en tiempo real desde Supabase WebSockets
  supabase
    .channel('realtime_registros')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'registros_desperdicios' }, (payload) => {
      fetchCloudRecords();
    })
    .subscribe();
}

// Escuchar eventos en Tiempo Real desde Servidor Local (SSE fallback para desarrollo local)
let eventSource = null;
const initRealtimeSSE = () => {
  if (supabase) return; // Si Supabase está activo en Vercel, no se usa SSE local
  try {
    const sseUrl = `${getApiBaseUrl()}/events`;
    eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.naves) localStorage.setItem(STORAGE_KEYS.NAVES, JSON.stringify(data.naves));
        if (data.productos) localStorage.setItem(STORAGE_KEYS.PRODUCTOS, JSON.stringify(data.productos));
        if (data.puestos) localStorage.setItem(STORAGE_KEYS.PUESTOS, JSON.stringify(data.puestos));
        if (data.registros) localStorage.setItem(STORAGE_KEYS.REGISTROS, JSON.stringify(data.registros));
        if (data.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
        
        notifyListeners();
      } catch (err) {
        console.warn('Error procesando SSE:', err);
      }
    };

    eventSource.onerror = (err) => {
      eventSource.close();
    };
  } catch (err) {}
};

if (typeof window !== 'undefined') {
  initRealtimeSSE();
}

// API de Base de Datos
export const DB = {
  isCloudMode: () => !!supabase,

  resetData: async () => {
    if (!supabase) {
      try {
        await fetch(`${getApiBaseUrl()}/reset`, { method: 'POST' });
      } catch (err) {}
    }
    localStorage.setItem(STORAGE_KEYS.NAVES, JSON.stringify(INITIAL_NAVES));
    localStorage.setItem(STORAGE_KEYS.PRODUCTOS, JSON.stringify(INITIAL_PRODUCTOS));
    localStorage.setItem(STORAGE_KEYS.PUESTOS, JSON.stringify(INITIAL_PUESTOS));
    localStorage.setItem(STORAGE_KEYS.REGISTROS, JSON.stringify(INITIAL_REGISTROS));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    notifyListeners();
  },

  getNaves: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.NAVES) || '[]'),
  
  getProductos: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTOS) || '[]'),

  saveProducto: async (prod) => {
    if (!supabase) {
      try {
        await fetch(`${getApiBaseUrl()}/productos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(prod)
        });
      } catch (err) {}
    }

    const list = DB.getProductos();
    list.push({ ...prod, id: `prod-${Date.now()}` });
    localStorage.setItem(STORAGE_KEYS.PRODUCTOS, JSON.stringify(list));
    notifyListeners();
  },

  deleteProducto: async (id) => {
    if (!supabase) {
      try {
        await fetch(`${getApiBaseUrl()}/productos/${id}`, { method: 'DELETE' });
      } catch (err) {}
    }

    const list = DB.getProductos().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRODUCTOS, JSON.stringify(list));
    notifyListeners();
  },

  getPuestos: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.PUESTOS) || '[]'),

  savePuesto: async (puesto) => {
    if (!supabase) {
      try {
        await fetch(`${getApiBaseUrl()}/puestos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(puesto)
        });
      } catch (err) {}
    }

    const list = DB.getPuestos();
    list.push({ ...puesto, id: `puesto-${Date.now()}` });
    localStorage.setItem(STORAGE_KEYS.PUESTOS, JSON.stringify(list));
    notifyListeners();
  },

  deletePuesto: async (id) => {
    if (!supabase) {
      try {
        await fetch(`${getApiBaseUrl()}/puestos/${id}`, { method: 'DELETE' });
      } catch (err) {}
    }

    const list = DB.getPuestos().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PUESTOS, JSON.stringify(list));
    notifyListeners();
  },

  getRegistros: () => {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTROS) || '[]');
    return raw.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  },

  addRegistro: async (newRecord) => {
    const recordPayload = {
      id: `rec-${Date.now()}`,
      fecha: new Date().toISOString(),
      ...newRecord
    };

    let savedRecord = null;

    // 1. Si Supabase está activo en Vercel, guardar directamente en la Nube
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('registros_desperdicios')
          .insert([recordPayload])
          .select();

        if (!error && data && data.length > 0) {
          savedRecord = data[0];
        } else if (error) {
          console.warn('Error Supabase insert:', error);
        }
      } catch (err) {
        console.warn('Fallback Supabase local:', err);
      }
    } else {
      // 2. Si es desarrollo local con server.js
      try {
        const res = await fetch(`${getApiBaseUrl()}/registros`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRecord)
        });
        const resData = await res.json();
        if (resData.success) {
          savedRecord = resData.record;
        }
      } catch (err) {}
    }

    if (!savedRecord) {
      savedRecord = recordPayload;
    }

    // Actualizar localStorage local como respaldo
    const list = DB.getRegistros();
    list.unshift(savedRecord);
    localStorage.setItem(STORAGE_KEYS.REGISTROS, JSON.stringify(list));

    notifyListeners();
    return savedRecord;
  },

  deleteRegistro: async (id) => {
    if (supabase) {
      try {
        await supabase.from('registros_desperdicios').delete().eq('id', id);
      } catch (err) {}
    } else {
      try {
        await fetch(`${getApiBaseUrl()}/registros/${id}`, { method: 'DELETE' });
      } catch (err) {}
    }

    const list = DB.getRegistros().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.REGISTROS, JSON.stringify(list));
    notifyListeners();
  },

  // GESTIÓN DE PRACTICANTES / USUARIOS Y PINES
  getUsers: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]'),

  saveUser: async (user) => {
    if (!supabase) {
      try {
        await fetch(`${getApiBaseUrl()}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user)
        });
      } catch (err) {}
    }

    const list = DB.getUsers();
    const idx = list.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      list[idx] = user;
    } else {
      list.push({ ...user, id: `usr-${Date.now()}` });
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(list));
    notifyListeners();
  },

  deleteUser: async (id) => {
    if (!supabase) {
      try {
        await fetch(`${getApiBaseUrl()}/users/${id}`, { method: 'DELETE' });
      } catch (err) {}
    }

    const list = DB.getUsers().filter(u => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(list));
    notifyListeners();
  },

  verifyPin: (pin, requiredRole = null) => {
    const users = DB.getUsers();
    const found = users.find(u => u.pin === pin);
    if (!found) return { success: false, message: 'PIN incorrecto' };
    
    if (requiredRole && requiredRole === 'ADMIN' && found.rol !== 'ADMIN') {
      return { success: false, message: 'Este PIN no tiene permisos de Administrador' };
    }
    
    return { success: true, user: found };
  },

  exportToExcel: (filteredRecords = null) => {
    const records = filteredRecords || DB.getRegistros();
    
    const formattedData = records.map(r => ({
      'ID Registro': r.id,
      'Fecha y Hora': new Date(r.fecha).toLocaleString('es-EC'),
      'Nave': r.naveNombre || 'Nave Frutos Tropicales',
      'Puesto N°': r.puestoNumero,
      'Producto / Fruta': r.productoNombre,
      'Peso (kg)': r.pesoKg,
      'Estado / Destino': r.estadoNombre || r.estado,
      'Registrado Por': r.registrador,
      'Observaciones': r.observacion || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Residuo Organico Riobamba');

    const max_widths = [
      { wch: 20 }, { wch: 22 }, { wch: 28 }, { wch: 12 },
      { wch: 20 }, { wch: 12 }, { wch: 32 }, { wch: 25 }, { wch: 35 }
    ];
    worksheet['!cols'] = max_widths;

    const fileName = `REAPROVECHA_Mercado_Riobamba_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }
};
