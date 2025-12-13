// routes/authRoutes.js
import express from "express";
import {
  registrarCliente,
  loginCliente,
  verificarSesion,
  obtenerDatosFormulario,
  obtenerCliente,
  actualizarCliente,    // ✅ Nueva
  cambiarContrasena      // ✅ Nueva
} from "../controllers/authController.js";

const router = express.Router();

// Autenticación
router.post("/registro", registrarCliente);
router.post("/login", loginCliente);
router.get("/verificar", verificarSesion);

// Datos de formulario
router.get("/datos-formulario", obtenerDatosFormulario);

// Cliente
router.get("/cliente/:id", obtenerCliente);
router.put("/actualizar/:id", actualizarCliente);        // ✅ Nueva ruta
router.put("/cambiar-contrasena/:id", cambiarContrasena); // ✅ Nueva ruta

console.log("✅ authRoutes configurado correctamente");

export default router;