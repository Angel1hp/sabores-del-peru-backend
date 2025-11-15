// routes/menuRoutes.js
import express from "express";
import { 
  getCategorias,
  getComidas,
  getBebidas,
  getComidaById,
  getBebidaById,
  getMenu,
  getPlatoById
} from "../controllers/menuController.js";

import { getPromociones } from "../controllers/promocionesController.js";

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

/* ==========================
   BEBIDAS
========================== */
router.get("/bebidas", getBebidas);
router.get("/bebidas/:id", getBebidaById);

/* ==========================
   MENÚ COMPLETO
========================== */
router.get("/menu", getMenu);
router.get("/menu/:id", getPlatoById);
router.get("/promociones", getPromociones);

/* ==========================
   EXPORTAR
========================== */
export default router;