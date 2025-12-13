import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import menuRoutes from "./routes/menuRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import carritoRoutes from "./routes/carritoRoutes.js";
import checkoutRoutes from "./routes/checkoutRoutes.js";
import notificacionesRoutes from "./routes/notificacionesRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import clientesRoutes from "./routes/ClientesRoutes.js";

dotenv.config();

const app = express();

// =====================================================
// CONFIGURACIÓN DE CORS MEJORADA
// =====================================================
const corsOptions = {
  origin: function (origin, callback) {
    // Lista de orígenes permitidos
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5500',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5500',
      'https://raices-front-nine.vercel.app', // ✅ Tu frontend en Vercel
    ];

    // Permitir peticiones sin origin (como Postman, Thunder Client)
    if (!origin) return callback(null, true);

    // Verificar si el origin está permitido
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // En desarrollo, permitir cualquier origen
      if (process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        console.log('❌ Origin no permitido:', origin);
        callback(new Error('No permitido por CORS'));
      }
    }
  },
  credentials: true, // Permitir cookies y headers de autenticación
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Aplicar CORS
app.use(cors(corsOptions));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Middleware de logging para debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin || 'No origin'}`);
  next();
});

// ✅ Endpoint básico de salud
app.get("/", (req, res) => {
  res.json({
    message: "✅ API del restaurante funcionando correctamente!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ Endpoint de salud adicional
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    database: "Connected",
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// RUTAS PÚBLICAS (Clientes)
// =====================================================
app.use("/api/menu", menuRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/carrito", carritoRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/notificaciones", notificacionesRoutes);
app.use("/api/clientes", clientesRoutes);

// =====================================================
// RUTAS ADMIN (Panel de Administración)
// =====================================================
app.use("/api/admin", adminRoutes);

// =====================================================
// MANEJO DE ERRORES 404
// =====================================================
app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    path: req.path,
    method: req.method
  });
});

// =====================================================
// MANEJO DE ERRORES GLOBAL
// =====================================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Error interno del servidor",
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Configurar puerto
const PORT = process.env.PORT || 3000;

// ✅ Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Servidor online en puerto ${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`${'='.repeat(60)}\n`);
  
  console.log(`📋 RUTAS PÚBLICAS (Clientes):`);
  console.log(`   - GET  / (health check)`);
  console.log(`   - GET  /health`);
  console.log(`   - GET  /api/menu/*`);
  console.log(`   - POST /api/auth/registro`);
  console.log(`   - POST /api/auth/login`);
  console.log(`   - GET  /api/auth/cliente/:id`);
  console.log(`   - GET  /api/auth/datos-formulario`);
  console.log(`   - GET  /api/carrito/:clienteId`);
  console.log(`   - POST /api/carrito`);
  console.log(`   - POST /api/checkout/procesar`);
  console.log(`   - GET  /api/notificaciones/:clienteId`);
  console.log(`   - GET  /api/clientes`);
  console.log();
  
  console.log(`🔐 RUTAS ADMIN (Panel de Administración):`);
  console.log(`   - POST /api/admin/login`);
  console.log(`   - GET  /api/admin/verificar`);
  console.log(`   - POST /api/admin/logout`);
  console.log(`   - GET  /api/admin/dashboard`);
  console.log(`   - GET  /api/admin/empleados`);
  console.log(`   - POST /api/admin/empleados`);
  console.log(`   - PUT  /api/admin/empleados/:id`);
  console.log();
  
  console.log(`📊 RUTAS DE DATOS:`);
  console.log(`   - GET  /api/checkout/ordenes/todas`);
  console.log(`   - GET  /api/checkout/ordenes/recientes`);
  console.log(`   - PUT  /api/checkout/orden/:id/estado`);
  console.log(`   - PUT  /api/menu/comidas/:id`);
  console.log(`   - PUT  /api/menu/bebidas/:id`);
  console.log();
  
  console.log(`${'='.repeat(60)}\n`);
  
  // Verificar variables de entorno importantes
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL no configurada');
  }
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET no configurada');
  }
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM recibido, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT recibido, cerrando servidor...');
  process.exit(0);
});