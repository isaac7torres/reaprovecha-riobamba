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

const getApiBaseUrl = () => {
  const host = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : 'localhost';
  return `http://${host}:3001/api`;
};

// Sanitización de Variables de Entorno Supabase
const getSupabaseClient = () => {
  try {
    let url = import.meta.env.VITE_SUPABASE_URL;
    let key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key) return null;

    url = String(url).trim().replace(/^["']|["']$/g, '');
    key = String(key).trim().replace(/^["']|["']$/g, '');

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    if (url.length < 10 || key.length < 10) return null;

    return createClient(url, key);
  } catch (err) {
    console.warn('⚠️ Fallback a local storage:', err);
    return null;
  }
};

export const supabase = getSupabaseClient();

// Listeners reactivos de la UI
const listeners = new Set();
const notifyListeners = () => listeners.forEach(cb => cb());

export const subscribeToDataChanges = (callback) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

// Inicializar almacenamiento local con datos semilla si no existen
const initStorage = () => {
  if (typeof localStorage === 'undefined') return;
  if (!localStorage.getItem(STORAGE_KEYS.NAVES)) {
    localStorage.setItem(STORAGE_KEYS.NAVES, JSON.stringify(INITIAL_NAVES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTOS)) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTOS, JSON.stringify(INITIAL_PRODUCTOS));
  }
  const existingPuestos = localStorage.getItem(STORAGE_KEYS.PUESTOS);
  if (!existingPuestos || JSON.parse(existingPuestos).length < 20) {
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

// Cargar y Sincronizar Nube Supabase
export const fetchCloudRecords = async () => {
  if (!supabase) return;
  try {
    const { data, error } = await supabase
      .from('registros_desperdicios')
      .select('*')
      .order('fecha', { ascending: false });

    if (!error && Array.isArray(data)) {
      if (data.length > 0) {
        localStorage.setItem(STORAGE_KEYS.REGISTROS, JSON.stringify(data));
      }
      notifyListeners();
    }
  } catch (err) {}
};

export const fetchCloudUsers = async () => {
  if (!supabase) return;
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (!error && data && data.length > 0) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data));
      notifyListeners();
    }
  } catch (e) {}
};

if (supabase) {
  fetchCloudRecords();
  fetchCloudUsers();

  setInterval(fetchCloudRecords, 2500);
  setInterval(fetchCloudUsers, 4000);

  if (typeof window !== 'undefined') {
    window.addEventListener('focus', fetchCloudRecords);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') fetchCloudRecords();
    });
  }

  try {
    supabase
      .channel('realtime_registros')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registros_desperdicios' }, () => {
        fetchCloudRecords();
      })
      .subscribe();
  } catch (err) {}
}

// Escuchar eventos en Tiempo Real desde Servidor Local (SSE fallback para desarrollo local)
let eventSource = null;
const initRealtimeSSE = () => {
  if (supabase) return;
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
      } catch (err) {}
    };

    eventSource.onerror = () => {
      if (eventSource) eventSource.close();
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
    const prodObj = { ...prod, id: `prod-${Date.now()}` };
    if (supabase) {
      try {
        await supabase.from('productos').insert([prodObj]);
      } catch (e) {}
    } else {
      try {
        await fetch(`${getApiBaseUrl()}/productos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(prod)
        });
      } catch (err) {}
    }

    const list = DB.getProductos();
    list.push(prodObj);
    localStorage.setItem(STORAGE_KEYS.PRODUCTOS, JSON.stringify(list));
    notifyListeners();
  },

  deleteProducto: async (id) => {
    if (supabase) {
      try {
        await supabase.from('productos').delete().eq('id', id);
      } catch (e) {}
    } else {
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
    const puestoObj = { ...puesto, id: `puesto-${Date.now()}` };
    if (supabase) {
      try {
        await supabase.from('puestos').insert([puestoObj]);
      } catch (e) {}
    } else {
      try {
        await fetch(`${getApiBaseUrl()}/puestos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(puesto)
        });
      } catch (err) {}
    }

    const list = DB.getPuestos();
    list.push(puestoObj);
    localStorage.setItem(STORAGE_KEYS.PUESTOS, JSON.stringify(list));
    notifyListeners();
  },

  deletePuesto: async (id) => {
    if (supabase) {
      try {
        await supabase.from('puestos').delete().eq('id', id);
      } catch (e) {}
    } else {
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
    return raw.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  },

  addRegistro: async (newRecord) => {
    const recordPayload = {
      id: `rec-${Date.now()}`,
      fecha: new Date().toISOString(),
      ...newRecord
    };

    // Objeto estricto sanitizado para Supabase Nube
    const cloudPayload = {
      id: recordPayload.id,
      fecha: recordPayload.fecha,
      naveId: recordPayload.naveId || 'nave-1',
      naveNombre: recordPayload.naveNombre || 'Nave Frutos Tropicales',
      puestoId: recordPayload.puestoId || 'puesto-1',
      puestoNumero: recordPayload.puestoNumero || 'Puesto 01',
      productoId: recordPayload.productoId || 'prod-1',
      productoNombre: recordPayload.productoNombre || 'Fruta',
      productoIcono: recordPayload.productoIcono || '🍎',
      pesoKg: Number(recordPayload.pesoKg) || 0,
      estado: recordPayload.estado || 'conservas',
      estadoNombre: recordPayload.estadoNombre || 'Apto para Conservas',
      registrador: recordPayload.registrador || 'Practicante',
      observacion: recordPayload.observacion || ''
    };

    // 1. Guardar de inmediato en la memoria local para respuesta UI instantánea
    const currentList = DB.getRegistros();
    const updatedList = [recordPayload, ...currentList.filter(r => r.id !== recordPayload.id)];
    localStorage.setItem(STORAGE_KEYS.REGISTROS, JSON.stringify(updatedList));
    notifyListeners();

    // 2. Si Supabase está activo, guardar en la Nube
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('registros_desperdicios')
          .insert([cloudPayload])
          .select();

        if (!error && data && data.length > 0) {
          fetchCloudRecords();
        } else if (error) {
          console.warn('⚠️ Supabase insert error:', error.message || error);
        }
      } catch (err) {
        console.warn('⚠️ Supabase exception:', err);
      }
    } else {
      try {
        await fetch(`${getApiBaseUrl()}/registros`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRecord)
        });
      } catch (err) {}
    }

    return recordPayload;
  },

  deleteRegistro: async (id) => {
    if (supabase) {
      try {
        await supabase.from('registros_desperdicios').delete().eq('id', id);
        fetchCloudRecords();
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

  getUsers: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]'),

  saveUser: async (user) => {
    const userObj = { ...user, id: user.id || `usr-${Date.now()}` };
    if (supabase) {
      try {
        await supabase.from('users').upsert([userObj]);
        fetchCloudUsers();
      } catch (e) {}
    } else {
      try {
        await fetch(`${getApiBaseUrl()}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userObj)
        });
      } catch (err) {}
    }

    const list = DB.getUsers();
    const idx = list.findIndex(u => u.id === userObj.id);
    if (idx >= 0) {
      list[idx] = userObj;
    } else {
      list.push(userObj);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(list));
    notifyListeners();
  },

  deleteUser: async (id) => {
    if (supabase) {
      try {
        await supabase.from('users').delete().eq('id', id);
        fetchCloudUsers();
      } catch (e) {}
    } else {
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
