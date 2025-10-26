// routes/menuRoutes.js
import express from "express";
import { getMenu, getPlatoById } from "../controllers/menuController.js";

const router = express.Router();

router.get("/", getMenu);         // GET /api/menu → todos los productos
router.get("/:id", getPlatoById); // GET /api/menu/:id → un producto específico

export default router;
