// controllers/authController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db/connection.js";

const SECRET = process.env.JWT_SECRET || "CAMBIAR_URGENTE_PARA_PRODUCCION";

// Registrar cliente
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

    // Validar formato de RUC si se proporciona
    if (ruc && ruc !== '' && !/^[0-9]{11}$/.test(ruc)) {
      return res.status(400).json({ 
        success: false,
        message: "El RUC debe tener exactamente 11 dígitos numéricos" 
      });
    }

    // Convertir RUC vacío a null
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

    res.status(201).json({ 
      success: true,
      message: "Cliente registrado correctamente ✅",
      cliente: result.rows[0]
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

// Login
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

// Verificar sesión
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
// OBTENER DATOS DEL FORMULARIO (MEJORADO)
// =====================
export const obtenerDatosFormulario = async (req, res) => {
  try {
    // Obtener departamentos
    const departamentos = await pool.query(`
      SELECT id, nombre
      FROM departamento
      ORDER BY nombre ASC
    `);

    // Obtener provincias
    const provincias = await pool.query(`
      SELECT id, nombre, departamento_id
      FROM provincia
      ORDER BY nombre ASC
    `);

    // Obtener distritos
    const distritos = await pool.query(`
      SELECT id, nombre, provincia_id
      FROM distrito
      ORDER BY nombre ASC
    `);
    
    // Obtener géneros
    const generos = await pool.query(`
      SELECT id, nombre 
      FROM genero 
      ORDER BY id
    `);
    
    // Obtener tipos de documento
    const tiposDocumento = await pool.query(`
      SELECT id, nombre 
      FROM tipo_documento 
      ORDER BY id
    `);

    console.log("✅ Datos de formulario cargados:", {
      departamentos: departamentos.rows.length,
      provincias: provincias.rows.length,
      distritos: distritos.rows.length,
      generos: generos.rows.length,
      tiposDocumento: tiposDocumento.rows.length
    });

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