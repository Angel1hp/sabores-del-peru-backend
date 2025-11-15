// routes/authRoutes.js
import express from "express";
import {
  registrarCliente,
  loginCliente,
  verificarSesion,
  obtenerDatosFormulario
} from "../controllers/authController.js";

const router = express.Router();

router.post("/registro", registrarCliente);
router.post("/login", loginCliente);
router.get("/verificar", verificarSesion);
router.get("/datos-formulario", obtenerDatosFormulario); // ← Asegúrate de tener esta línea

export default router;