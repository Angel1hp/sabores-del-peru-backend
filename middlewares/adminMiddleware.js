// middlewares/adminMiddleware.js
import jwt from "jsonwebtoken";

// ✅ Usa una clave diferente para admin (más segura)
const ADMIN_SECRET = process.env.ADMIN_JWT_SECRET || "admin_secret_key_change_in_production";

// =====================
// VERIFICAR TOKEN ADMIN
// =====================
export const verificarTokenAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: "Token no proporcionado"
      });
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, ADMIN_SECRET);
    
    // Verificar que sea un token de admin
    if (decoded.tipo !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos de administrador"
      });
    }

    // Agregar datos del admin a la request
    req.admin = {
      id: decoded.id,
      usuario: decoded.usuario,
      rol: decoded.rol
    };

    next();

  } catch (error) {
    console.error("❌ Error verificando token admin:", error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Token expirado"
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
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

// =====================
// VERIFICAR ROL ESPECÍFICO
// =====================
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
        message: `Acceso denegado. Se requiere rol: ${rolesPermitidos.join(' o ')}`
      });
    }

    next();
  };
};

// =====================
// VERIFICAR PERMISOS (Opcional - para sistema más avanzado)
// =====================
export const verificarPermiso = (permiso) => {
  return async (req, res, next) => {
    // Implementar lógica de permisos si lo necesitas
    // Por ahora solo verificamos que esté autenticado
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: "No autenticado"
      });
    }
    next();
  };
};