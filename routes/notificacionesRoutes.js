// routes/notificacionesRoutes.js
import express from "express";
import {
  obtenerNotificaciones,
  marcarComoLeida,
  marcarTodasComoLeidas
} from "../controllers/notificacionesController.js";

const router = express.Router();

// Obtener notificaciones de un cliente
router.get("/:clienteId", obtenerNotificaciones);

// Marcar una notificación como leída
router.put("/:notificacionId/leer", marcarComoLeida);

// Marcar todas las notificaciones como leídas
router.put("/:clienteId/leer-todas", marcarTodasComoLeidas);

export default router;