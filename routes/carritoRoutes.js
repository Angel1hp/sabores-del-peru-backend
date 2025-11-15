// routes/carritoRoutes.js
import express from "express";
import {
  obtenerCarrito,
  agregarAlCarrito,
  actualizarCantidad,
  eliminarDelCarrito,
  vaciarCarrito,
  procesarCheckout
} from "../controllers/carritoController.js";

const router = express.Router();

/* ==========================
   CARRITO
========================== */
router.get("/:clienteId", obtenerCarrito);           // GET /api/carrito/:clienteId
router.post("/", agregarAlCarrito);                   // POST /api/carrito
router.put("/:id", actualizarCantidad);              // PUT /api/carrito/:id
router.delete("/:id", eliminarDelCarrito);           // DELETE /api/carrito/:id
router.delete("/cliente/:clienteId", vaciarCarrito); // DELETE /api/carrito/cliente/:clienteId

/* ==========================
   CHECKOUT
========================== */
router.post("/checkout", procesarCheckout);          // POST /api/carrito/checkout

/* ==========================
   EXPORTAR
========================== */
export default router;