// controllers/adminAuthController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db/connection.js";

if (!process.env.ADMIN_JWT_SECRET) {
  throw new Error("❌ ADMIN_JWT_SECRET no está configurado en variables de entorno");
}

const ADMIN_SECRET = process.env.ADMIN_JWT_SECRET;

// =====================
// LOGIN ADMIN
// =====================
export const loginAdmin = async (req, res) => {
  const { usuario, contrasena } = req.body;

  try {
    console.log("🔐 Intento de login admin:", usuario);

    if (!usuario || !contrasena) {
      return res.status(400).json({ 
        success: false,
        message: "Usuario y contraseña son obligatorios" 
      });
    }

    // Buscar empleado
    const result = await pool.query(`
      SELECT * FROM empleado 
      WHERE (usuario = $1 OR email = $1) 
      AND activo = true
    `, [usuario]);

    if (result.rows.length === 0) {
      console.log("❌ Usuario no encontrado o inactivo");
      return res.status(401).json({ 
        success: false,
        message: "Credenciales inválidas" 
      });
    }

    const empleado = result.rows[0];

    // Verificar contraseña
    const validPassword = await bcrypt.compare(contrasena, empleado.contrasena);
    
    if (!validPassword) {
      console.log("❌ Contraseña incorrecta para:", usuario);
      
      // Registrar intento fallido
      await pool.query(`
        INSERT INTO auditoria_empleados (empleado_id, accion, fecha)
        VALUES ($1, 'login_fallido', NOW())
      `, [empleado.id]);
      
      return res.status(401).json({ 
        success: false,
        message: "Credenciales inválidas" 
      });
    }

    // Verificar que sea admin o tenga rol apropiado
    const rolesPermitidos = ['admin', 'gerente', 'cajero'];
    if (!rolesPermitidos.includes(empleado.rol)) {
      console.log("❌ Rol no autorizado:", empleado.rol);
      return res.status(403).json({ 
        success: false,
        message: "No tienes permisos para acceder al panel de administración" 
      });
    }

    // Generar token
    const token = jwt.sign(
      { 
        id: empleado.id,
        usuario: empleado.usuario,
        rol: empleado.rol,
        tipo: 'admin'
      },
      ADMIN_SECRET,
      { expiresIn: "8h" }
    );

    // Registrar sesión exitosa
    await pool.query(`
      INSERT INTO sesion_admin (empleado_id, token, ip_address, user_agent, fecha_expiracion)
      VALUES ($1, $2, $3, $4, NOW() + INTERVAL '8 hours')
    `, [
      empleado.id, 
      token, 
      req.ip || 'unknown',
      req.headers['user-agent'] || 'unknown'
    ]);

    // Registrar en auditoría
    await pool.query(`
      INSERT INTO auditoria_empleados (empleado_id, accion, fecha)
      VALUES ($1, 'login_exitoso', NOW())
    `, [empleado.id]);

    console.log("✅ Login exitoso:", empleado.usuario, "- Rol:", empleado.rol);

    res.json({
      success: true,
      message: "Inicio de sesión exitoso",
      token,
      admin: {
        id: empleado.id,
        nombre: empleado.nombre,
        apellido: empleado.apellido,
        usuario: empleado.usuario,
        email: empleado.email,
        rol: empleado.rol,
        puesto: empleado.puesto
      }
    });

  } catch (error) {
    console.error("❌ Error en login admin:", error);
    res.status(500).json({ 
      success: false,
      message: "Error en el servidor" 
    });
  }
};

// =====================
// VERIFICAR SESIÓN ADMIN
// =====================
export const verificarSesionAdmin = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "No se proporcionó token" 
      });
    }

    const decoded = jwt.verify(token, ADMIN_SECRET);
    
    // Verificar que la sesión siga activa
    const sesion = await pool.query(`
      SELECT * FROM sesion_admin 
      WHERE token = $1 AND activa = true AND fecha_expiracion > NOW()
    `, [token]);

    if (sesion.rows.length === 0) {
      return res.status(401).json({ 
        success: false,
        message: "Sesión expirada o inválida" 
      });
    }

    // Obtener datos actualizados del empleado
    const empleado = await pool.query(`
      SELECT id, nombre, apellido, usuario, email, rol, puesto, activo
      FROM empleado 
      WHERE id = $1 AND activo = true
    `, [decoded.id]);

    if (empleado.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Usuario no encontrado o inactivo" 
      });
    }

    res.json({
      success: true,
      admin: empleado.rows[0]
    });

  } catch (error) {
    console.error("❌ Error verificando sesión:", error);
    res.status(401).json({ 
      success: false,
      message: "Token inválido" 
    });
  }
};

// =====================
// LOGOUT ADMIN
// =====================
export const logoutAdmin = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      // Marcar sesión como inactiva
      await pool.query(`
        UPDATE sesion_admin 
        SET activa = false 
        WHERE token = $1
      `, [token]);

      // Registrar en auditoría
      const decoded = jwt.decode(token);
      if (decoded && decoded.id) {
        await pool.query(`
          INSERT INTO auditoria_empleados (empleado_id, accion, fecha)
          VALUES ($1, 'logout', NOW())
        `, [decoded.id]);
      }
    }

    res.json({
      success: true,
      message: "Sesión cerrada correctamente"
    });

  } catch (error) {
    console.error("❌ Error en logout:", error);
    res.status(500).json({ 
      success: false,
      message: "Error al cerrar sesión" 
    });
  }
};

// =====================
// OBTENER DASHBOARD
// =====================
export const getDashboard = async (req, res) => {
  try {
    const dashboard = await pool.query(`SELECT * FROM vista_dashboard_admin`);
    
    res.json({
      success: true,
      data: dashboard.rows[0]
    });

  } catch (error) {
    console.error("❌ Error obteniendo dashboard:", error);
    res.status(500).json({ 
      success: false,
      message: "Error al obtener datos del dashboard" 
    });
  }
};

// =====================
// OBTENER LISTA DE EMPLEADOS
// =====================
export const getEmpleados = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM vista_empleados_completa
      ORDER BY activo DESC, fecha_ingreso DESC
    `);

    res.json({
      success: true,
      empleados: result.rows
    });

  } catch (error) {
    console.error("❌ Error obteniendo empleados:", error);
    res.status(500).json({ 
      success: false,
      message: "Error al obtener empleados" 
    });
  }
};

// =====================
// CREAR EMPLEADO
// =====================
export const crearEmpleado = async (req, res) => {
  const {
    nombre,
    apellido,
    email,
    telefono,
    usuario,
    contrasena,
    rol,
    puesto,
    establecimiento_id
  } = req.body;

  try {
    // Validaciones
    if (!nombre || !apellido || !email || !usuario || !contrasena) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos obligatorios deben estar completos"
      });
    }

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    // Insertar empleado
    const result = await pool.query(`
      INSERT INTO empleado (
        nombre, apellido, email, telefono, usuario, 
        contrasena, rol, puesto, establecimiento_id, 
        fecha_ingreso, activo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE, true)
      RETURNING id, nombre, apellido, usuario, email, rol, puesto
    `, [
      nombre, apellido, email, telefono, usuario,
      hashedPassword, rol, puesto, establecimiento_id
    ]);

    // Registrar en auditoría
    const adminToken = req.headers.authorization?.split(' ')[1];
    if (adminToken) {
      const decoded = jwt.decode(adminToken);
      await pool.query(`
        INSERT INTO auditoria_empleados (empleado_id, accion, fecha)
        VALUES ($1, 'crear_empleado', NOW())
      `, [decoded.id]);
    }

    console.log("✅ Empleado creado:", result.rows[0]);

    res.status(201).json({
      success: true,
      message: "Empleado creado exitosamente",
      empleado: result.rows[0]
    });

  } catch (error) {
    console.error("❌ Error creando empleado:", error);
    
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: "El usuario o email ya está registrado"
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error al crear empleado"
    });
  }
};

// =====================
// ACTUALIZAR EMPLEADO
// =====================
export const actualizarEmpleado = async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, email, telefono, rol, puesto, activo } = req.body;

  try {
    const result = await pool.query(`
      UPDATE empleado
      SET nombre = COALESCE($1, nombre),
          apellido = COALESCE($2, apellido),
          email = COALESCE($3, email),
          telefono = COALESCE($4, telefono),
          rol = COALESCE($5, rol),
          puesto = COALESCE($6, puesto),
          activo = COALESCE($7, activo)
      WHERE id = $8
      RETURNING id, nombre, apellido, usuario, email, rol, puesto, activo
    `, [nombre, apellido, email, telefono, rol, puesto, activo, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Empleado no encontrado"
      });
    }

    console.log("✅ Empleado actualizado:", result.rows[0]);

    res.json({
      success: true,
      message: "Empleado actualizado exitosamente",
      empleado: result.rows[0]
    });

  } catch (error) {
    console.error("❌ Error actualizando empleado:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar empleado"
    });
  }
};