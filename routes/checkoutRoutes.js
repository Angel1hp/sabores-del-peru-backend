// routes/checkoutRoutes.js
import express from "express";
import {
  procesarCheckout,
  obtenerHistorialOrdenes,
  obtenerDetalleOrden,
  obtenerTodasLasOrdenes,
  obtenerOrdenesRecientes,
  cambiarEstadoOrden
} from "../controllers/checkoutController.js";

const router = express.Router();

/* ==========================
   CHECKOUT
========================== */
// Procesar compra completa
router.post("/procesar", procesarCheckout);

/* ==========================
   HISTORIAL DE ÓRDENES
========================== */
// ✅ RUTAS ESPECÍFICAS PRIMERO (antes de :clienteId)
// Obtener todas las órdenes (admin)
router.get("/ordenes/todas", obtenerTodasLasOrdenes);

// Obtener órdenes recientes (admin)
router.get("/ordenes/recientes", obtenerOrdenesRecientes);

// ✅ RUTAS CON PARÁMETROS AL FINAL
// Obtener historial de órdenes de un cliente
router.get("/ordenes/:clienteId", obtenerHistorialOrdenes);

// Obtener detalle de una orden específica
router.get("/orden/:ordenId", obtenerDetalleOrden);

// Cambiar estado de orden (admin)
router.put("/orden/:ordenId/estado", cambiarEstadoOrden);

/* ==========================
   EXPORTAR
========================== */
export default router;