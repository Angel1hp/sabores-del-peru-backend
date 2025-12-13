// routes/clientesRoutes.js
import express from "express";
import {
  obtenerTodosLosClientes,
  obtenerEstadisticasClientes,
  buscarClientes
} from "../controllers/clientesController.js";

const router = express.Router();

/* ==========================
   CLIENTES
========================== */
// Obtener todos los clientes (admin)
router.get("/", obtenerTodosLosClientes);

// Obtener estadísticas de clientes
router.get("/estadisticas", obtenerEstadisticasClientes);

// Buscar clientes
router.get("/buscar", buscarClientes);

/* ==========================
   EXPORTAR
========================== */
export default router;