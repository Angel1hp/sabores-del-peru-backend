// controllers/promocionesController.js - VERSIÓN COMPLETA CORREGIDA
import pool from "../db/connection.js";

// =====================
// OBTENER TODAS LAS PROMOCIONES
// =====================
export const getPromociones = async (req, res) => {
  try {
    const promos = await pool.query(`
      SELECT id, titulo, descripcion, precio_oferta, imagen, activo, fecha_inicio, fecha_fin
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
              producto_id: data.rows[0].id,
              cantidad: item.cantidad,
              nombre: data.rows[0].nombre,
              precio: data.rows[0].precio,
              imagen: data.rows[0].imagen
            });
          }
        } else if (item.tipo === "bebida") {
          const data = await pool.query(`
            SELECT id, nombre, precio, imagen 
            FROM bebida WHERE id = $1
          `, [item.item_id]);

          if (data.rows.length > 0) {
            listaItems.push({
              tipo: "bebida",
              producto_id: data.rows[0].id,
              cantidad: item.cantidad,
              nombre: data.rows[0].nombre,
              precio: data.rows[0].precio,
              imagen: data.rows[0].imagen
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

// =====================
// OBTENER PROMOCIÓN POR ID
// =====================
export const getPromocionById = async (req, res) => {
  const { id } = req.params;

  try {
    const promoResult = await pool.query(`
      SELECT id, titulo, descripcion, precio_oferta, imagen, activo, fecha_inicio, fecha_fin
      FROM promociones
      WHERE id = $1
    `, [id]);

    if (promoResult.rows.length === 0) {
      return res.status(404).json({ error: "Promoción no encontrada" });
    }

    const promo = promoResult.rows[0];

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
            producto_id: data.rows[0].id,
            cantidad: item.cantidad,
            nombre: data.rows[0].nombre,
            precio: data.rows[0].precio,
            imagen: data.rows[0].imagen
          });
        }
      } else if (item.tipo === "bebida") {
        const data = await pool.query(`
          SELECT id, nombre, precio, imagen 
          FROM bebida WHERE id = $1
        `, [item.item_id]);

        if (data.rows.length > 0) {
          listaItems.push({
            tipo: "bebida",
            producto_id: data.rows[0].id,
            cantidad: item.cantidad,
            nombre: data.rows[0].nombre,
            precio: data.rows[0].precio,
            imagen: data.rows[0].imagen
          });
        }
      }
    }

    res.json({
      ...promo,
      items: listaItems
    });

  } catch (error) {
    console.error("❌ Error al obtener promoción:", error);
    res.status(500).json({ error: "Error al obtener promoción" });
  }
};

// =====================
// CREAR PROMOCIÓN
// =====================
export const crearPromocion = async (req, res) => {
  const { titulo, descripcion, precio_oferta, imagen, activo, items } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Validaciones
    if (!titulo || !precio_oferta) {
      return res.status(400).json({ 
        error: "Título y precio de oferta son obligatorios" 
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ 
        error: "Debe incluir al menos un producto en la promoción" 
      });
    }

    // Crear promoción
    const promoResult = await client.query(`
      INSERT INTO promociones (titulo, descripcion, precio_oferta, imagen, activo, fecha_inicio, fecha_fin)
      VALUES ($1, $2, $3, $4, $5, NOW(), NULL)
      RETURNING *
    `, [titulo, descripcion, precio_oferta, imagen, activo !== false]);

    const promocionId = promoResult.rows[0].id;

    // Agregar items
    for (const item of items) {
      await client.query(`
        INSERT INTO promocion_items (promocion_id, tipo, item_id, cantidad)
        VALUES ($1, $2, $3, $4)
      `, [promocionId, item.tipo, item.producto_id, item.cantidad]);
    }

    await client.query('COMMIT');

    console.log(`✅ Promoción creada: ${titulo}`);
    res.status(201).json({ 
      success: true,
      message: 'Promoción creada exitosamente',
      promocion: promoResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Error al crear promoción:", error);
    res.status(500).json({ error: "Error al crear promoción" });
  } finally {
    client.release();
  }
};

// =====================
// ACTUALIZAR PROMOCIÓN
// =====================
export const actualizarPromocion = async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, precio_oferta, imagen, activo, items } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Actualizar datos básicos
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (titulo !== undefined) {
      updates.push(`titulo = $${paramCount}`);
      values.push(titulo);
      paramCount++;
    }
    if (descripcion !== undefined) {
      updates.push(`descripcion = $${paramCount}`);
      values.push(descripcion);
      paramCount++;
    }
    if (precio_oferta !== undefined) {
      updates.push(`precio_oferta = $${paramCount}`);
      values.push(precio_oferta);
      paramCount++;
    }
    if (imagen !== undefined) {
      updates.push(`imagen = $${paramCount}`);
      values.push(imagen);
      paramCount++;
    }
    if (activo !== undefined) {
      updates.push(`activo = $${paramCount}`);
      values.push(activo);
      paramCount++;
    }

    if (updates.length > 0) {
      values.push(id);
      await client.query(`
        UPDATE promociones 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
      `, values);
    }

    // Si se proporcionan items, actualizar
    if (items && Array.isArray(items)) {
      // Eliminar items anteriores
      await client.query(`DELETE FROM promocion_items WHERE promocion_id = $1`, [id]);

      // Agregar nuevos items
      for (const item of items) {
        await client.query(`
          INSERT INTO promocion_items (promocion_id, tipo, item_id, cantidad)
          VALUES ($1, $2, $3, $4)
        `, [id, item.tipo, item.producto_id, item.cantidad]);
      }
    }

    await client.query('COMMIT');

    console.log(`✅ Promoción #${id} actualizada`);
    res.json({ 
      success: true,
      message: 'Promoción actualizada correctamente'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Error al actualizar promoción:", error);
    res.status(500).json({ error: "Error al actualizar promoción" });
  } finally {
    client.release();
  }
};

// =====================
// OBTENER PRODUCTOS DISPONIBLES (para el formulario)
// ✅ CORREGIDO: Devuelve array plano
// =====================
export const getProductosDisponibles = async (req, res) => {
  try {
    // Obtener comidas con sus categorías
    const comidas = await pool.query(`
      SELECT 
        c.id, 
        c.nombre, 
        c.precio, 
        'comida' as tipo,
        cat.nombre as categoria,
        cat.id as categoria_id
      FROM comida c
      JOIN categoria cat ON c.categoria_id = cat.id
      WHERE c.disponible = true
      ORDER BY cat.nombre ASC, c.nombre ASC
    `);

    // Obtener bebidas con sus tipos
    const bebidas = await pool.query(`
      SELECT 
        id, 
        nombre, 
        precio, 
        'bebida' as tipo,
        tipo as categoria
      FROM bebida
      WHERE disponible = true
      ORDER BY tipo ASC, nombre ASC
    `);

    const productos = [
      ...comidas.rows,
      ...bebidas.rows
    ];

    console.log(`✅ Productos disponibles: ${productos.length} (${comidas.rows.length} comidas, ${bebidas.rows.length} bebidas)`);

    res.json(productos);

  } catch (error) {
    console.error("❌ Error al obtener productos:", error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
};