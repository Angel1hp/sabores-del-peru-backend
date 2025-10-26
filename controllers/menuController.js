// controllers/menuController.js
import pool from "../db/connection.js";

// Obtener todos los platos y bebidas del menú
export const getMenu = async (req, res) => {
  try {
    const comidas = await pool.query(`
      SELECT c.id, c.nombre, c.descripcion, c.precio, cat.nombre AS categoria, c.disponible
      FROM comida c
      JOIN categoria cat ON c.categoria_id = cat.id
      WHERE c.disponible = true
      ORDER BY c.id ASC
    `);

    const bebidas = await pool.query(`
      SELECT id, nombre, tipo AS categoria, precio, disponible
      FROM bebida
      WHERE disponible = true
      ORDER BY id ASC
    `);

    // Unimos los dos tipos de productos
    const menu = [
      ...comidas.rows.map(item => ({ ...item, tipo: "comida" })),
      ...bebidas.rows.map(item => ({ ...item, tipo: "bebida" })),
    ];

    res.json(menu);
  } catch (error) {
    console.error("❌ Error al obtener el menú:", error);
    res.status(500).json({ error: "Error al obtener el menú" });
  }
};

// Obtener un plato o bebida por ID
export const getPlatoById = async (req, res) => {
  const { id } = req.params;

  try {
    // Buscar primero en comidas
    const comida = await pool.query(`
      SELECT c.id, c.nombre, c.descripcion, c.precio, cat.nombre AS categoria
      FROM comida c
      JOIN categoria cat ON c.categoria_id = cat.id
      WHERE c.id = $1
    `, [id]);

    if (comida.rows.length > 0) return res.json(comida.rows[0]);

    // Si no está, buscar en bebidas
    const bebida = await pool.query(`
      SELECT id, nombre, tipo, tamaño, precio
      FROM bebida
      WHERE id = $1
    `, [id]);

    if (bebida.rows.length > 0) return res.json(bebida.rows[0]);

    res.status(404).json({ error: "Producto no encontrado" });
  } catch (error) {
    console.error("❌ Error al obtener el producto:", error);
    res.status(500).json({ error: "Error al obtener el producto" });
  }
};
