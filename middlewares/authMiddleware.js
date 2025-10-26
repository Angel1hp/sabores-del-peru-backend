import jwt from "jsonwebtoken";

const SECRET = "clave_super_secreta_cámbiala_esto"; // misma que en authController

// Middleware para proteger rutas
export const verificarToken = (req, res, next) => {
  try {
    const header = req.headers["authorization"];

    if (!header) {
      return res.status(401).json({ message: "Token no proporcionado" });
    }

    // El token viene como: "Bearer eyJhbGciOi..."
    const token = header.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token no válido" });
    }

    // Verificar token
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded; // guardamos los datos del usuario
    next();
  } catch (error) {
    console.error("Error de autenticación:", error);
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};
