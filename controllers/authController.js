import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import connection from "../db/connection.js";

const SECRET = "clave_super_secreta_cámbiala_esto"; // cámbiala luego

// Registro de cliente
export const registrarCliente = async (req, res) => {
  const { nombre, apellido, email, usuario, contraseña } = req.body;

  try {
    // Verificar si ya existe el usuario o email
    const existing = await connection.query(
      "SELECT * FROM cliente WHERE email = $1 OR usuario = $2",
      [email, usuario]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "El usuario o email ya existe" });
    }

    // Hashear contraseña
    const hashed = await bcrypt.hash(contraseña, 10);

    // Insertar cliente
    await connection.query(
      `INSERT INTO cliente (nombre, apellido, email, usuario, contraseña)
       VALUES ($1, $2, $3, $4, $5)`,
      [nombre, apellido, email, usuario, hashed]
    );

    res.status(201).json({ message: "Cliente registrado correctamente" });
  } catch (error) {
    console.error("Error al registrar cliente:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// Inicio de sesión
export const loginCliente = async (req, res) => {
  const { usuario, contraseña } = req.body;

  try {
    // Buscar cliente por usuario o email
    const result = await connection.query(
      "SELECT * FROM cliente WHERE usuario = $1 OR email = $1",
      [usuario]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const cliente = result.rows[0];

    // Verificar contraseña
    const valid = await bcrypt.compare(contraseña, cliente.contraseña);
    if (!valid) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    // Crear token JWT
    const token = jwt.sign(
      {
        id: cliente.id,
        nombre: cliente.nombre,
        usuario: cliente.usuario,
        email: cliente.email,
      },
      SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      message: "Inicio de sesión exitoso",
      token,
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        usuario: cliente.usuario,
        email: cliente.email,
      },
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};
