# 🚀 Guía de Despliegue a Producción (Costo $0 USD)

Esta guía explica cómo desplegar la aplicación **REAPROVECHA** en la nube de manera gratuita y permanente.

---

## 1. Despliegue del Frontend en Vercel (Gratis)

1. **Subir el código a GitHub**:
   - Crear un repositorio público o privado en GitHub (ej. `reaprovecha-riobamba`).
   - Subir el código del proyecto.

2. **Vincular con Vercel**:
   - Ingresa a [Vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
   - Haz clic en **"Add New" -> "Project"**.
   - Selecciona el repositorio `reaprovecha-riobamba`.
   - Vercel detectará automáticamente que es un proyecto **Vite / React**.
   - Haz clic en **"Deploy"**.

¡Listo! En menos de 1 minuto tendrás una URL pública HTTPS (ej. `https://reaprovecha-riobamba.vercel.app`) accesible desde cualquier teléfono celular o laptop.

---

## 2. Configurar Base de Datos Supabase (Opcional para Nube Gratuita)

La aplicación funciona de inmediato con almacenamiento local inteligente. Para sincronizar los datos de todos los estudiantes practicantes en una base de datos PostgreSQL centralizada en la nube:

1. Crea una cuenta gratuita en [Supabase.com](https://supabase.com).
2. Crea un nuevo proyecto llamado `reaprovecha_db`.
3. En la sección **SQL Editor**, ejecuta la siguiente instrucción para crear la tabla de registros:

```sql
CREATE TABLE registros_desperdicios (
  id TEXT PRIMARY KEY,
  fecha TIMESTAMPTZ DEFAULT NOW(),
  naveId TEXT,
  naveNombre TEXT,
  puestoId TEXT,
  puestoNumero TEXT,
  productoId TEXT,
  productoNombre TEXT,
  productoIcono TEXT,
  pesoKg NUMERIC,
  estado TEXT,
  estadoNombre TEXT,
  registrador TEXT,
  observacion TEXT
);
```

4. Obtén las variables de entorno desde **Settings -> API**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

5. Agrega estas 2 variables de entorno en el panel de **Vercel (Environment Variables)** y vuelve a desplegar.

---

## 🔑 Credenciales y PINs por Defecto

- **Modo Registrador (Ingreso de Pesos)**: PIN `1234`
- **Modo Administrador (Catálogos y Auditoría)**: PIN `9999`
- **Modo Libre / Público (Dashboard)**: Sin PIN (Acceso Abierto)
