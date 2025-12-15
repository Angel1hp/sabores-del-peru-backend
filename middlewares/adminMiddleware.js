// middlewares/adminMiddleware.js
import jwt from "jsonwebtoken";

/* =====================================================
   CONFIGURACIÓN SEGURA
===================================================== */
if (!process.env.ADMIN_JWT_SECRET) {
  throw new Error("❌ ADMIN_JWT_SECRET no está configurado en variables de entorno");
}

const ADMIN_SECRET = process.env.ADMIN_JWT_SECRET;

/* =====================================================
   VERIFICAR TOKEN ADMIN
===================================================== */
export const verificarTokenAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token no proporcionado"
      });
    }

    const token = authHeader.split(" ")[1];

    // Verificar token con el SECRET exclusivo de admin
    const decoded = jwt.verify(token, ADMIN_SECRET);

    // Verificar que sea token de admin
    if (decoded.tipo !== "admin") {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos de administrador"
      });
    }

    // Adjuntar info del admin a la request
    req.admin = {
      id: decoded.id,
      usuario: decoded.usuario,
      rol: decoded.rol
    };

    next();

  } catch (error) {
    console.error("❌ Error verificando token admin:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expirado"
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token inválido"
      });
    }

    return res.status(401).json({
      success: false,
      message: "Error de autenticación"
    });
  }
};

/* =====================================================
   VERIFICAR ROL (ADMIN / SUPERADMIN / ETC)
===================================================== */
export const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: "No autenticado"
      });
    }

    if (!rolesPermitidos.includes(req.admin.rol)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Se requiere rol: ${rolesPermitidos.join(" o ")}`
      });
    }

    next();
  };
};

/* =====================================================
   VERIFICAR PERMISO (OPCIONAL)
===================================================== */
export const verificarPermiso = (permiso) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: "No autenticado"
      });
    }

    // Aquí puedes validar permisos específicos si luego los implementas
    next();
  };
};
