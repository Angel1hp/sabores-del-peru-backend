// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import menuRoutes from "./routes/menuRoutes.js";

// Cargar variables de entorno (.env)
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.use("/api/menu", menuRoutes);

// Puerto dinámico (Render usa uno propio)
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en el puerto ${PORT}`);
});
