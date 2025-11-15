import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import menuRoutes from "./routes/menuRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import carritoRoutes from "./routes/carritoRoutes.js"; // ✅ NUEVO

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

// ✅ Rutas del menú
app.use("/api/menu", menuRoutes);

// ✅ Rutas de autenticación
app.use("/api/auth", authRoutes);

// ✅ Rutas del carrito
app.use("/api/carrito", carritoRoutes); // ✅ NUEVO

// Configurar puerto
const PORT = process.env.PORT || 3000;

// ✅ Iniciar servidor
app.listen(PORT, () =>
  console.log(`🚀 Servidor online en http://localhost:${PORT}`)
);