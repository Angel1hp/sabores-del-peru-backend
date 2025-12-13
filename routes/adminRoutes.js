// routes/adminRoutes.js
import express from "express";
import {
  loginAdmin,
  verificarSesionAdmin,
  logoutAdmin,
  getDashboard,
  getEmpleados,
  crearEmpleado,
  actualizarEmpleado
} from "../controllers/adminAuthController.js";
import { verificarTokenAdmin, verificarRol } from "../middlewares/adminMiddleware.js";

const router = express.Router();

// =====================
// AUTENTICACIÓN
// =====================
router.post("/login", loginAdmin);
router.get("/verificar", verificarTokenAdmin, verificarSesionAdmin);
router.post("/logout", verificarTokenAdmin, logoutAdmin);

// =====================
// DASHBOARD
// =====================
router.get("/dashboard", verificarTokenAdmin, getDashboard);

// =====================
// EMPLEADOS
// =====================
router.get("/empleados", verificarTokenAdmin, getEmpleados);
router.post("/empleados", verificarTokenAdmin, crearEmpleado);
router.put("/empleados/:id", verificarTokenAdmin, actualizarEmpleado);

export default router;