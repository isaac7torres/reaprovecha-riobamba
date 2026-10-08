import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { 
  INITIAL_NAVES, 
  INITIAL_PRODUCTOS, 
  INITIAL_PUESTOS, 
  INITIAL_REGISTROS, 
  INITIAL_USERS 
} from './src/types/initialData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

app.use(cors());
app.use(express.json());

// Clientes SSE para tiempo real
let sseClients = [];

// Asegurar directorio y archivo
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const getInitialState = () => ({
  naves: INITIAL_NAVES,
  productos: INITIAL_PRODUCTOS,
  puestos: INITIAL_PUESTOS,
  registros: INITIAL_REGISTROS,
  users: INITIAL_USERS
});

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify(getInitialState(), null, 2));
}

const readDB = () => {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error leyendo db.json:', err);
    return getInitialState();
  }
};

const writeDB = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    notifyClients();
  } catch (err) {
    console.error('Error escribiendo en db.json:', err);
  }
};

const notifyClients = () => {
  const data = readDB();
  sseClients.forEach(res => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
};

// --- ENDPOINTS ---

// Server Sent Events (SSE) para actualización en tiempo real entre celular y laptop
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Enviar estado inicial
  res.write(`data: ${JSON.stringify(readDB())}\n\n`);

  sseClients.push(res);

  req.on('close', () => {
    sseClients = sseClients.filter(c => c !== res);
  });
});

// Obtener datos
app.get('/api/data', (req, res) => {
  res.json(readDB());
});

// Agregar registro de pesaje
app.post('/api/registros', (req, res) => {
  const db = readDB();
  const record = {
    id: `rec-${Date.now()}`,
    fecha: new Date().toISOString(),
    ...req.body
  };
  db.registros.unshift(record);
  db.registros.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  writeDB(db);
  console.log(`[SERVIDORES NETWORK] 📦 Nuevo pesaje recibido: ${record.pesoKg} kg de ${record.productoNombre} (Puesto: ${record.puestoNumero})`);
  res.status(201).json({ success: true, record });
});

// Eliminar registro
app.delete('/api/registros/:id', (req, res) => {
  const db = readDB();
  db.registros = db.registros.filter(r => r.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// Catálogo de Frutas
app.post('/api/productos', (req, res) => {
  const db = readDB();
  const prod = { id: `prod-${Date.now()}`, ...req.body };
  db.productos.push(prod);
  writeDB(db);
  res.status(201).json({ success: true, producto: prod });
});

app.delete('/api/productos/:id', (req, res) => {
  const db = readDB();
  db.productos = db.productos.filter(p => p.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// Catálogo de Puestos
app.post('/api/puestos', (req, res) => {
  const db = readDB();
  const puesto = { id: `puesto-${Date.now()}`, ...req.body };
  db.puestos.push(puesto);
  writeDB(db);
  res.status(201).json({ success: true, puesto });
});

app.delete('/api/puestos/:id', (req, res) => {
  const db = readDB();
  db.puestos = db.puestos.filter(p => p.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// Gestión de Usuarios / Practicantes y PINs
app.post('/api/users', (req, res) => {
  const db = readDB();
  const newUser = {
    id: req.body.id || `usr-${Date.now()}`,
    nombre: req.body.nombre,
    pin: req.body.pin,
    rol: req.body.rol || 'REGISTRADOR'
  };

  const existingIdx = db.users.findIndex(u => u.id === newUser.id);
  if (existingIdx >= 0) {
    db.users[existingIdx] = newUser;
  } else {
    db.users.push(newUser);
  }

  writeDB(db);
  console.log(`[SERVIDORES NETWORK] 👤 Nuevo Practicante registrado: ${newUser.nombre} (PIN: ${newUser.pin})`);
  res.status(201).json({ success: true, user: newUser });
});

app.delete('/api/users/:id', (req, res) => {
  const db = readDB();
  db.users = db.users.filter(u => u.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// Restablecer datos semilla
app.post('/api/reset', (req, res) => {
  const initial = getInitialState();
  writeDB(initial);
  res.json({ success: true });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor de Sincronización Red Local ejecutándose en http://0.0.0.0:${PORT}`);
});
