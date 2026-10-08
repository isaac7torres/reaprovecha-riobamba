// Datos iniciales de sembrado para el Mercado Mayorista de Riobamba

export const INITIAL_NAVES = [
  { id: 'nave-1', nombre: 'Nave de Frutos Tropicales', activa: true, descripcion: 'Especializada en frutas de la costa ecuatoriana' },
  { id: 'nave-2', nombre: 'Nave de Hortalizas y Verduras', activa: false, descripcion: 'Próxima expansión - Legumbres y verduras de la sierra' },
  { id: 'nave-3', nombre: 'Nave de Tubérculos y Granos', activa: false, descripcion: 'Próxima expansión - Papas, camotes y mellocos' },
];

export const INITIAL_PRODUCTOS = [
  { id: 'prod-1', naveId: 'nave-1', nombre: 'Naranja', color: '#F39C12', icono: '🍊', rendConservas: 0.60, rendCompost: 0.35 },
  { id: 'prod-2', naveId: 'nave-1', nombre: 'Banano / Guineo', color: '#F1C40F', icono: '🍌', rendConservas: 0.55, rendCompost: 0.40 },
  { id: 'prod-3', naveId: 'nave-1', nombre: 'Piña', color: '#E67E22', icono: '🍍', rendConservas: 0.50, rendCompost: 0.45 },
  { id: 'prod-4', naveId: 'nave-1', nombre: 'Mandarina', color: '#E67E22', icono: '🍊', rendConservas: 0.65, rendCompost: 0.30 },
  { id: 'prod-5', naveId: 'nave-1', nombre: 'Maracuyá', color: '#F39C12', icono: '🟡', rendConservas: 0.45, rendCompost: 0.50 },
  { id: 'prod-6', naveId: 'nave-1', nombre: 'Mango', color: '#E74C3C', icono: '🥭', rendConservas: 0.58, rendCompost: 0.38 },
  { id: 'prod-7', naveId: 'nave-1', nombre: 'Papaya', color: '#E67E22', icono: '🫒', rendConservas: 0.62, rendCompost: 0.35 },
  { id: 'prod-8', naveId: 'nave-1', nombre: 'Melón', color: '#2ECC71', icono: '🍈', rendConservas: 0.55, rendCompost: 0.40 },
  { id: 'prod-9', naveId: 'nave-1', nombre: 'Sandía', color: '#C0392B', icono: '🍉', rendConservas: 0.40, rendCompost: 0.55 },
  { id: 'prod-10', naveId: 'nave-1', nombre: 'Granadilla', color: '#D35400', icono: '🟠', rendConservas: 0.50, rendCompost: 0.45 },
  { id: 'prod-11', naveId: 'nave-1', nombre: 'Limón', color: '#27AE60', icono: '🍋', rendConservas: 0.48, rendCompost: 0.48 },
];

export const INITIAL_PUESTOS = Array.from({ length: 20 }, (_, i) => ({
  id: `puesto-${i + 1}`,
  numero: `Puesto ${String(i + 1).padStart(2, '0')}`,
  naveId: 'nave-1',
  comerciante: `Comerciante ${String(i + 1).padStart(2, '0')} (Sector ${i < 10 ? 'A' : 'B'})`,
  sector: i < 10 ? 'Pasillo Único - Lado A (Izquierdo)' : 'Pasillo Único - Lado B (Derecho)'
}));

export const INITIAL_USERS = [
  { id: 'usr-1', nombre: 'Practicante 1 (Turno Mañana)', pin: '1234', rol: 'REGISTRADOR' },
  { id: 'usr-2', nombre: 'Practicante 2 (Turno Tarde)', pin: '1234', rol: 'REGISTRADOR' },
  { id: 'usr-admin', nombre: 'Administrador REAPROVECHA', pin: '9999', rol: 'ADMIN' },
];

export const ESTADOS_DESPERDICIO = [
  { id: 'conservas', nombre: 'Apto para Conservas / Mermeladas', badgeColor: 'bg-green-100 text-green-800' },
  { id: 'animales', nombre: 'Apto para Alimento Animal (Cerdos)', badgeColor: 'bg-amber-100 text-amber-800' },
  { id: 'compost', nombre: 'Descomposición / Solo Compost', badgeColor: 'bg-red-100 text-red-800' },
];

// Generador de datos semilla realistas para las últimas 2 semanas
const generateSeedRecords = () => {
  const records = [];
  const now = new Date();
  
  // 12 días de registros semilla (desde hace 12 días hasta ayer)
  for (let d = 12; d >= 1; d--) {
    const dailyEntriesCount = 3 + (d % 3);
    for (let j = 0; j < dailyEntriesCount; j++) {
      const recordDate = new Date(now);
      recordDate.setDate(now.getDate() - d);
      
      const prod = INITIAL_PRODUCTOS[(d + j * 2) % INITIAL_PRODUCTOS.length];
      const puesto = INITIAL_PUESTOS[(d * 2 + j) % INITIAL_PUESTOS.length];
      const weight = parseFloat((12.5 + (j * 7.3) + ((d * 3.1) % 25)).toFixed(2));
      const estadoObj = ESTADOS_DESPERDICIO[j % 3];
      
      const recordHour = 7 + (j * 2); // Horario de mercado de 7am a 3pm
      recordDate.setHours(recordHour, (j * 17) % 60, 0);

      records.push({
        id: `rec-seed-${d}-${j}`,
        fecha: recordDate.toISOString(),
        naveId: 'nave-1',
        naveNombre: 'Nave de Frutos Tropicales',
        puestoId: puesto.id,
        puestoNumero: puesto.numero,
        productoId: prod.id,
        productoNombre: prod.nombre,
        productoIcono: prod.icono,
        pesoKg: weight,
        estado: estadoObj.id,
        estadoNombre: estadoObj.nombre,
        registrador: d % 2 === 0 ? 'Practicante 1 (Turno Mañana)' : 'Practicante 2 (Turno Tarde)',
        observacion: weight > 30 ? 'Sobregiro de merma por maduración acelerada' : 'Fruta magullada por transporte'
      });
    }
  }
  return records.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
};

export const INITIAL_REGISTROS = generateSeedRecords();
