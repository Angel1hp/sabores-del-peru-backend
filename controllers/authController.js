// controllers/authController.js - CON ENVÍO DE EMAILS
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db/connection.js";
import { enviarEmailBienvenida } from "../services/emailService.js"; // ✅ IMPORTAR

const SECRET = process.env.JWT_SECRET || "CAMBIAR_URGENTE_PARA_PRODUCCION";

// =====================
// REGISTRAR CLIENTE CON EMAIL DE BIENVENIDA
// =====================
export const registrarCliente = async (req, res) => {
  const {
    nombre,
    apellido,
    email,
    usuario,
    contrasena,
    telefono,
    direccion,
    tipo_documento_id,
    numero_documento,
    genero_id,
    distrito_id,
    ruc
  } = req.body;

  try {
    console.log("📦 Body recibido:", req.body);
    
    // Validaciones básicas
    if (!nombre || !apellido || !email || !usuario || !contrasena) {
      return res.status(400).json({ 
        success: false,
        message: "Todos los campos obligatorios deben estar completos" 
      });
    }

    if (contrasena.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: "La contraseña debe tener al menos 6 caracteres" 
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: "Formato de correo electrónico inválido" 
      });
    }

    // Validar formato de RUC si se proporciona
    if (ruc && ruc !== '' && !/^[0-9]{11}$/.test(ruc)) {
      return res.status(400).json({ 
        success: false,
        message: "El RUC debe tener exactamente 11 dígitos numéricos" 
      });
    }

    const rucFinal = (ruc && ruc.trim() !== '') ? ruc.trim() : null;

    // Verificar duplicados
    const duplicado = await pool.query(
      `SELECT id, email, usuario, numero_documento, ruc 
       FROM cliente 
       WHERE email = $1 OR usuario = $2 OR numero_documento = $3 OR (ruc = $4 AND ruc IS NOT NULL)`,
      [email, usuario, numero_documento, rucFinal]
    );

    if (duplicado.rows.length > 0) {
      const existing = duplicado.rows[0];
      if (existing.email === email) {
        return res.status(400).json({ 
          success: false,
          message: "El correo electrónico ya está registrado" 
        });
      }
      if (existing.usuario === usuario) {
        return res.status(400).json({ 
          success: false,
          message: "El nombre de usuario ya está en uso" 
        });
      }
      if (existing.numero_documento === numero_documento) {
        return res.status(400).json({ 
          success: false,
          message: "El número de documento ya está registrado" 
        });
      }
      if (rucFinal && existing.ruc === rucFinal) {
        return res.status(400).json({ 
          success: false,
          message: "El RUC ya está registrado" 
        });
      }
    }

    // Hash contraseña
    const hashed = await bcrypt.hash(contrasena, 10);

    // Insert cliente
    const result = await pool.query(
      `INSERT INTO cliente (
        nombre, apellido, email, telefono, direccion,
        usuario, contrasena, tipo_documento_id,
        numero_documento, genero_id, distrito_id, ruc, fecha_registro
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, NOW())
      RETURNING id, nombre, apellido, email, usuario, ruc`,
      [
        nombre, apellido, email, telefono, direccion,
        usuario, hashed, tipo_documento_id, numero_documento,
        genero_id, distrito_id, rucFinal
      ]
    );

    const clienteCreado = result.rows[0];
    console.log("✅ Cliente registrado:", clienteCreado);

    // ✅ ENVIAR EMAIL DE BIENVENIDA (asíncrono, no bloqueante)
    const nombreCompleto = `${nombre} ${apellido}`;
    enviarEmailBienvenida(email, nombreCompleto)
      .then(resultado => {
        if (resultado.success) {
          console.log("📧 Email de bienvenida enviado a:", email);
        } else {
          console.error("❌ Error al enviar email:", resultado.error);
        }
      })
      .catch(err => {
        console.error("❌ Error en envío de email:", err);
      });

    // Responder inmediatamente (no esperar el email)
    res.status(201).json({ 
      success: true,
      message: "Cliente registrado correctamente ✅ Te hemos enviado un correo de bienvenida.",
      cliente: clienteCreado
    });

  } catch (error) {
    console.error("❌ Error en registro:", error);
    
    if (error.code === '23505' && error.constraint === 'unique_ruc') {
      return res.status(400).json({ 
        success: false,
        message: "El RUC ya está registrado" 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Error en el servidor al registrar cliente" 
    });
  }
};

// =====================
// LOGIN
// =====================
export const loginCliente = async (req, res) => {
  const { usuario, contrasena } = req.body;

  try {
    if (!usuario || !contrasena) {
      return res.status(400).json({ 
        success: false,
        message: "Usuario y contraseña son obligatorios" 
      });
    }

    const result = await pool.query(
      "SELECT * FROM cliente WHERE usuario = $1 OR email = $1",
      [usuario]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Usuario no encontrado" 
      });
    }

    const cliente = result.rows[0];

    const valid = await bcrypt.compare(contrasena, cliente.contrasena);
    
    if (!valid) {
      return res.status(401).json({ 
        success: false,
        message: "Contraseña incorrecta" 
      });
    }

    const token = jwt.sign(
      { 
        id: cliente.id, 
        usuario: cliente.usuario,
        email: cliente.email 
      },
      SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      message: "Inicio de sesión exitoso ✅",
      token,
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        usuario: cliente.usuario,
        email: cliente.email,
        telefono: cliente.telefono,
        direccion: cliente.direccion,
        ruc: cliente.ruc
      },
    });

  } catch (error) {
    console.error("❌ Error en login:", error);
    res.status(500).json({ 
      success: false,
      message: "Error en el servidor al iniciar sesión" 
    });
  }
};

// =====================
// VERIFICAR SESIÓN
// =====================
export const verificarSesion = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "No se proporcionó token" 
      });
    }

    const decoded = jwt.verify(token, SECRET);
    
    const result = await pool.query(
      "SELECT id, nombre, apellido, email, usuario, ruc FROM cliente WHERE id = $1",
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Usuario no encontrado" 
      });
    }

    res.json({
      success: true,
      cliente: result.rows[0]
    });

  } catch (error) {
    console.error("❌ Error verificando sesión:", error);
    res.status(401).json({ 
      success: false,
      message: "Token inválido o expirado" 
    });
  }
};

// =====================
// OBTENER DATOS DEL FORMULARIO
// =====================
export const obtenerDatosFormulario = async (req, res) => {
  try {
    const departamentos = await pool.query(`
      SELECT id, nombre
      FROM departamento
      ORDER BY nombre ASC
    `);

    const provincias = await pool.query(`
      SELECT id, nombre, departamento_id
      FROM provincia
      ORDER BY nombre ASC
    `);

    const distritos = await pool.query(`
      SELECT id, nombre, provincia_id
      FROM distrito
      ORDER BY nombre ASC
    `);
    
    const generos = await pool.query(`
      SELECT id, nombre 
      FROM genero 
      ORDER BY id
    `);
    
    const tiposDocumento = await pool.query(`
      SELECT id, nombre 
      FROM tipo_documento 
      ORDER BY id
    `);

    console.log("✅ Datos de formulario cargados");

    res.json({
      success: true,
      data: {
        ubicaciones: {
          departamentos: departamentos.rows,
          provincias: provincias.rows,
          distritos: distritos.rows
        },
        generos: generos.rows,
        tiposDocumento: tiposDocumento.rows
      }
    });
  } catch (error) {
    console.error("❌ Error obteniendo datos formulario:", error);
    res.status(500).json({ 
      success: false,
      message: "Error al obtener datos del formulario" 
    });
  }
};

// =====================
// OBTENER DATOS COMPLETOS DEL CLIENTE
// =====================
export const obtenerCliente = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      `SELECT 
        c.id, 
        c.nombre, 
        c.apellido, 
        c.email, 
        c.usuario, 
        c.telefono, 
        c.direccion, 
        c.ruc, 
        c.numero_documento,
        c.distrito_id,
        d.nombre as distrito, 
        p.nombre as provincia,
        p.id as provincia_id,
        dep.nombre as departamento,
        dep.id as departamento_id
       FROM cliente c
       LEFT JOIN distrito d ON c.distrito_id = d.id
       LEFT JOIN provincia p ON d.provincia_id = p.id
       LEFT JOIN departamento dep ON p.departamento_id = dep.id
       WHERE c.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cliente no encontrado"
      });
    }
    
    res.json({
      success: true,
      cliente: result.rows[0]
    });
    
  } catch (error) {
    console.error("❌ Error obteniendo cliente:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener datos del cliente"
    });
  }
};

// =====================
// ACTUALIZAR DATOS DEL CLIENTE
// =====================
export const actualizarCliente = async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, email, telefono, direccion, distrito_id, ruc } = req.body;

  try {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (nombre !== undefined) {
      updates.push(`nombre = $${paramCount}`);
      values.push(nombre);
      paramCount++;
    }
    if (apellido !== undefined) {
      updates.push(`apellido = $${paramCount}`);
      values.push(apellido);
      paramCount++;
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }
    if (telefono !== undefined) {
      updates.push(`telefono = $${paramCount}`);
      values.push(telefono);
      paramCount++;
    }
    if (direccion !== undefined) {
      updates.push(`direccion = $${paramCount}`);
      values.push(direccion);
      paramCount++;
    }
    if (distrito_id !== undefined) {
      updates.push(`distrito_id = $${paramCount}`);
      values.push(distrito_id);
      paramCount++;
    }
    if (ruc !== undefined) {
      if (ruc && ruc !== '' && !/^[0-9]{11}$/.test(ruc)) {
        return res.status(400).json({ 
          success: false,
          message: "El RUC debe tener exactamente 11 dígitos numéricos" 
        });
      }
      
      const rucFinal = (ruc && ruc.trim() !== '') ? ruc.trim() : null;
      updates.push(`ruc = $${paramCount}`);
      values.push(rucFinal);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No hay datos para actualizar' 
      });
    }

    values.push(id);

    const query = `
      UPDATE cliente 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, usuario, nombre, apellido, email, telefono, direccion, numero_documento, ruc, distrito_id
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cliente no encontrado' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Cliente actualizado exitosamente',
      cliente: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error al actualizar cliente:', error);
    
    if (error.code === '23505') {
      if (error.constraint === 'unique_ruc') {
        return res.status(400).json({ 
          success: false,
          message: "El RUC ya está registrado por otro usuario" 
        });
      }
      if (error.constraint === 'cliente_email_key') {
        return res.status(400).json({ 
          success: false,
          message: "El email ya está registrado por otro usuario" 
        });
      }
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar cliente',
      error: error.message 
    });
  }
};

// =====================
// CAMBIAR CONTRASEÑA
// =====================
export const cambiarContrasena = async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  try {
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'La nueva contraseña debe tener al menos 6 caracteres' 
      });
    }

    const clienteResult = await pool.query(
      'SELECT contrasena FROM cliente WHERE id = $1',
      [id]
    );

    if (clienteResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cliente no encontrado' 
      });
    }

    const cliente = clienteResult.rows[0];
    const passwordMatch = await bcrypt.compare(currentPassword, cliente.contrasena);

    if (!passwordMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'La contraseña actual es incorrecta' 
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE cliente SET contrasena = $1 WHERE id = $2',
      [hashedPassword, id]
    );

    res.json({ 
      success: true, 
      message: 'Contraseña actualizada exitosamente' 
    });
  } catch (error) {
    console.error('❌ Error al cambiar contraseña:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al cambiar contraseña',
      error: error.message 
    });
  }
};