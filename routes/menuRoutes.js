// routes/menuRoutes.js
import express from "express";
import { 
  getCategorias,
  getComidas,
  getBebidas,
  getComidaById,
  getBebidaById,
  getMenu,
  getPlatoById,
  crearComida,
  crearBebida,
  actualizarComida,
  actualizarBebida
} from "../controllers/menuController.js";

import { 
  getPromociones, 
  getPromocionById,
  crearPromocion,
  actualizarPromocion,
  getProductosDisponibles
} from "../controllers/promocionesController.js";

const router = express.Router();


/* ==========================
   CATEGORÍAS
========================== */
router.get("/categorias", getCategorias);

/* ==========================
   COMIDAS
========================== */
router.get("/comidas", getComidas);
router.get("/comidas/:id", getComidaById);
router.post("/comidas", crearComida); // ✅ NUEVO
router.put("/comidas/:id", actualizarComida);

/* ==========================
   BEBIDAS
========================== */
router.get("/bebidas", getBebidas);
router.get("/bebidas/:id", getBebidaById);
router.post("/bebidas", crearBebida); // ✅ NUEVO
router.put("/bebidas/:id", actualizarBebida);

/* ==========================
   MENÚ COMPLETO
========================== */
router.get("/menu", getMenu);
router.get("/menu/:id", getPlatoById);

/* ==========================
   PROMOCIONES
========================== */
router.get("/promociones", getPromociones);
router.get("/promociones/:id", getPromocionById);
router.post("/promociones", crearPromocion);
router.put("/promociones/:id", actualizarPromocion);
router.get("/productos-disponibles", getProductosDisponibles);

/* ==========================
   EXPORTAR
========================== */
export default router;