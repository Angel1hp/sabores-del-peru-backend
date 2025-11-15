import pool from "../db/connection.js";

export const getPromociones = async (req, res) => {
  try {
    const promos = await pool.query(`
      SELECT id, titulo, descripcion, precio_oferta, imagen, activo
      FROM promociones
      WHERE activo = true
      ORDER BY id ASC
    `);

    const promociones = [];

    for (const promo of promos.rows) {
      const items = await pool.query(`
        SELECT tipo, item_id, cantidad
        FROM promocion_items
        WHERE promocion_id = $1
      `, [promo.id]);

      const listaItems = [];

      for (const item of items.rows) {
        if (item.tipo === "comida") {
          const data = await pool.query(`
            SELECT id, nombre, precio, imagen 
            FROM comida WHERE id = $1
          `, [item.item_id]);

          if (data.rows.length > 0) {
            listaItems.push({
              tipo: "comida",
              cantidad: item.cantidad,
              ...data.rows[0]
            });
          }
        } else {
          const data = await pool.query(`
            SELECT id, nombre, precio, imagen 
            FROM bebida WHERE id = $1
          `, [item.item_id]);

          if (data.rows.length > 0) {
            listaItems.push({
              tipo: "bebida",
              cantidad: item.cantidad,
              ...data.rows[0]
            });
          }
        }
      }

      promociones.push({
        ...promo,
        items: listaItems
      });
    }

    res.json(promociones);
    
  } catch (error) {
    console.error("❌ Error al obtener promociones:", error);
    res.status(500).json({ error: "Error al obtener promociones" });
  }
};
