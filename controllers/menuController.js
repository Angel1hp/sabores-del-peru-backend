// controllers/menuController.js
import pool from "../db/connection.js";

// =====================
// OBTENER CATEGORÍAS
// =====================
export const getCategorias = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, nombre, descripcion, imagen
      FROM categoria
      ORDER BY id ASC
    `);

    console.log(`✅ ${result.rows.length} categorías obtenidas`);
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener categorías:", error);
    res.status(500).json({ error: "Error al obtener categorías" });
  }
};

// =====================
// OBTENER COMIDAS
// =====================
export const getComidas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id, c.nombre, c.descripcion, c.precio, c.disponible, c.imagen, cat.nombre AS categoria
      FROM comida c
      JOIN categoria cat ON c.categoria_id = cat.id
      WHERE c.disponible = true
      ORDER BY c.id ASC
    `);

    console.log(`✅ ${result.rows.length} comidas obtenidas`);
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener comidas:", error);
    res.status(500).json({ error: "Error al obtener comidas" });
  }
};

// =====================
// OBTENER BEBIDAS
// =====================
export const getBebidas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.id, b.nombre, b.tipo AS categoria, b.precio, b.imagen, b.disponible
      FROM bebida b
      WHERE b.disponible = true
      ORDER BY b.id ASC
    `);

    console.log(`✅ ${result.rows.length} bebidas obtenidas`);
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener bebidas:", error);
    res.status(500).json({ error: "Error al obtener bebidas" });
  }
};

// =====================
// OBTENER COMIDA POR ID
// =====================
export const getComidaById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT c.id, c.nombre, c.descripcion, c.precio, c.imagen, cat.nombre AS categoria
      FROM comida c
      JOIN categoria cat ON c.categoria_id = cat.id
      WHERE c.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Comida no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error al obtener comida:", error);
    res.status(500).json({ error: "Error al obtener comida" });
  }
};

// =====================
// OBTENER BEBIDA POR ID
// =====================
export const getBebidaById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT id, nombre, tipo AS categoria, precio, imagen
      FROM bebida
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Bebida no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error al obtener bebida:", error);
    res.status(500).json({ error: "Error al obtener bebida" });
  }
};

// =====================
// OBTENER TODO EL MENÚ (comidas + bebidas)
// =====================
export const getMenu = async (req, res) => {
  try {
    const comidas = await pool.query(`
      SELECT c.id, c.nombre, c.descripcion, c.precio, cat.nombre AS categoria, c.disponible, c.imagen
      FROM comida c
      JOIN categoria cat ON c.categoria_id = cat.id
      WHERE c.disponible = true
      ORDER BY c.id ASC
    `);

    const bebidas = await pool.query(`
      SELECT b.id, b.nombre, b.tipo AS categoria, b.tamano_ml, b.precio, b.disponible, b.imagen
      FROM bebida b
      WHERE b.disponible = true
      ORDER BY b.id ASC
    `);

    const menu = [
      ...comidas.rows.map(item => ({ ...item, tipo: "comida" })),
      ...bebidas.rows.map(item => ({ ...item, tipo: "bebida" })),
    ];

    console.log(`✅ Menú completo: ${comidas.rows.length} comidas + ${bebidas.rows.length} bebidas`);
    res.json(menu);
  } catch (error) {
    console.error("❌ Error al obtener el menú:", error);
    res.status(500).json({ error: "Error al obtener el menú" });
  }
};

// =====================
// OBTENER PRODUCTO (comida o bebida) POR ID
// =====================
export const getPlatoById = async (req, res) => {
  const { id } = req.params;

  try {
    const comida = await pool.query(`
      SELECT c.id, c.nombre, c.descripcion, c.precio, cat.nombre AS categoria, c.imagen
      FROM comida c
      JOIN categoria cat ON c.categoria_id = cat.id
      WHERE c.id = $1
    `, [id]);

    if (comida.rows.length > 0) {
      return res.json({ ...comida.rows[0], tipo: "comida" });
    }

    const bebida = await pool.query(`
      SELECT id, nombre, tipo AS categoria, tamano_ml, precio, imagen
      FROM bebida
      WHERE id = $1
    `, [id]);

    if (bebida.rows.length > 0) {
      return res.json({ ...bebida.rows[0], tipo: "bebida" });
    }

    res.status(404).json({ error: "Producto no encontrado" });
  } catch (error) {
    console.error("❌ Error al obtener el producto:", error);
    res.status(500).json({ error: "Error al obtener el producto" });
  }
};