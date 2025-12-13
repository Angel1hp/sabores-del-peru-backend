import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import menuRoutes from "./routes/menuRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import carritoRoutes from "./routes/carritoRoutes.js";
import checkoutRoutes from "./routes/checkoutRoutes.js";
import notificacionesRoutes from "./routes/notificacionesRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import clientesRoutes from "./routes/ClientesRoutes.js"; // ✅ NUEVO

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Endpoint básico
app.get("/", (req, res) => {
  res.send("✅ API del restaurante funcionando correctamente!");
});

// =====================================================
// RUTAS PÚBLICAS (Clientes)
// =====================================================
app.use("/api/menu", menuRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/carrito", carritoRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/notificaciones", notificacionesRoutes);
app.use("/api/clientes", clientesRoutes); // ✅ NUEVO

// =====================================================
// RUTAS ADMIN (Panel de Administración)
// =====================================================
app.use("/api/admin", adminRoutes);

// Configurar puerto
const PORT = process.env.PORT || 3000;

// ✅ Iniciar servidor
app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Servidor online en http://localhost:${PORT}`);
  console.log(`${'='.repeat(60)}\n`);
  
  console.log(`📋 RUTAS PÚBLICAS (Clientes):`);
  console.log(`   - GET  /`);
  console.log(`   - GET  /api/menu/*`);
  console.log(`   - POST /api/auth/registro`);
  console.log(`   - POST /api/auth/login`);
  console.log(`   - GET  /api/auth/cliente/:id`);
  console.log(`   - GET  /api/auth/datos-formulario`);
  console.log(`   - GET  /api/carrito/:clienteId`);
  console.log(`   - POST /api/carrito`);
  console.log(`   - POST /api/checkout/procesar`);
  console.log(`   - GET  /api/notificaciones/:clienteId`);
  console.log(`   - GET  /api/clientes`); // ✅ NUEVO
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
  console.log(`   - GET  /api/checkout/ordenes/todas`); // ✅ NUEVO
  console.log(`   - GET  /api/checkout/ordenes/recientes`); // ✅ NUEVO
  console.log(`   - PUT  /api/checkout/orden/:id/estado`); // ✅ NUEVO
  console.log(`   - PUT  /api/menu/comidas/:id`); // ✅ NUEVO
  console.log(`   - PUT  /api/menu/bebidas/:id`); // ✅ NUEVO
  console.log();
  
  console.log(`${'='.repeat(60)}\n`);
});