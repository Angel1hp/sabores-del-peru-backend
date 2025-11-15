// controllers/carritoController.js
import pool from "../db/connection.js";

// =====================
// OBTENER CARRITO DEL CLIENTE
// =====================
export const obtenerCarrito = async (req, res) => {
  const { clienteId } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        c.cliente_id,
        c.producto_id,
        c.producto_tipo,
        c.cantidad,
        c.precio_unitario,
        c.fecha_agregado,
        COALESCE(com.nombre, b.nombre, p.titulo) as nombre,
        COALESCE(com.imagen, b.imagen, p.imagen) as imagen,
        COALESCE(com.descripcion, b.descripcion, p.descripcion) as descripcion
      FROM carrito c
      LEFT JOIN comida com ON c.producto_id = com.id AND c.producto_tipo = 'comida'
      LEFT JOIN bebida b ON c.producto_id = b.id AND c.producto_tipo = 'bebida'
      LEFT JOIN promociones p ON c.producto_id = p.id AND c.producto_tipo = 'promocion'
      WHERE c.cliente_id = $1
      ORDER BY c.fecha_agregado DESC
    `, [clienteId]);

    console.log(`✅ ${result.rows.length} items en carrito del cliente ${clienteId}`);
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener carrito:", error);
    res.status(500).json({ error: "Error al obtener carrito" });
  }
};

// =====================
// AGREGAR AL CARRITO
// =====================
export const agregarAlCarrito = async (req, res) => {
  const { cliente_id, producto_id, producto_tipo, cantidad, precio_unitario } = req.body;

  try {
    // Validar que el producto existe
    let productoQuery;
    switch(producto_tipo) {
      case 'comida':
        productoQuery = 'SELECT * FROM comida WHERE id = $1';
        break;
      case 'bebida':
        productoQuery = 'SELECT * FROM bebida WHERE id = $1';
        break;
      case 'promocion':
        productoQuery = 'SELECT * FROM promociones WHERE id = $1';
        break;
      default:
        return res.status(400).json({ error: 'Tipo de producto inválido' });
    }

    const productoResult = await pool.query(productoQuery, [producto_id]);
    
    if (productoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Verificar si ya existe en el carrito
    const checkResult = await pool.query(`
      SELECT * FROM carrito 
      WHERE cliente_id = $1 AND producto_id = $2 AND producto_tipo = $3
    `, [cliente_id, producto_id, producto_tipo]);

    if (checkResult.rows.length > 0) {
      // Actualizar cantidad
      const nuevaCantidad = checkResult.rows[0].cantidad + cantidad;
      const updateResult = await pool.query(`
        UPDATE carrito 
        SET cantidad = $1 
        WHERE id = $2
        RETURNING *
      `, [nuevaCantidad, checkResult.rows[0].id]);

      console.log(`✅ Cantidad actualizada: ${producto_tipo} #${producto_id}`);
      res.json({ 
        message: 'Cantidad actualizada', 
        item: updateResult.rows[0] 
      });
    } else {
      // Insertar nuevo
      const insertResult = await pool.query(`
        INSERT INTO carrito (cliente_id, producto_id, producto_tipo, cantidad, precio_unitario)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [cliente_id, producto_id, producto_tipo, cantidad, precio_unitario]);

      console.log(`✅ Producto agregado: ${producto_tipo} #${producto_id}`);
      res.json({ 
        message: 'Producto agregado', 
        item: insertResult.rows[0] 
      });
    }
  } catch (error) {
    console.error("❌ Error al agregar al carrito:", error);
    res.status(500).json({ error: "Error al agregar al carrito" });
  }
};

// =====================
// ACTUALIZAR CANTIDAD
// =====================
export const actualizarCantidad = async (req, res) => {
  const { id } = req.params;
  const { cantidad } = req.body;

  try {
    if (cantidad <= 0) {
      // Si la cantidad es 0 o menor, eliminar
      await pool.query('DELETE FROM carrito WHERE id = $1', [id]);
      console.log(`✅ Producto eliminado (cantidad 0)`);
      res.json({ message: 'Producto eliminado' });
    } else {
      // Actualizar cantidad
      const result = await pool.query(`
        UPDATE carrito 
        SET cantidad = $1 
        WHERE id = $2
        RETURNING *
      `, [cantidad, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Item no encontrado' });
      }

      console.log(`✅ Cantidad actualizada`);
      res.json({ 
        message: 'Cantidad actualizada', 
        item: result.rows[0] 
      });
    }
  } catch (error) {
    console.error("❌ Error al actualizar cantidad:", error);
    res.status(500).json({ error: "Error al actualizar cantidad" });
  }
};

// =====================
// ELIMINAR DEL CARRITO
// =====================
export const eliminarDelCarrito = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      DELETE FROM carrito 
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item no encontrado' });
    }

    console.log(`✅ Producto eliminado del carrito`);
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    console.error("❌ Error al eliminar del carrito:", error);
    res.status(500).json({ error: "Error al eliminar del carrito" });
  }
};

// =====================
// VACIAR CARRITO
// =====================
export const vaciarCarrito = async (req, res) => {
  const { clienteId } = req.params;

  try {
    await pool.query('DELETE FROM carrito WHERE cliente_id = $1', [clienteId]);
    console.log(`✅ Carrito vaciado para cliente ${clienteId}`);
    res.json({ message: 'Carrito vaciado' });
  } catch (error) {
    console.error("❌ Error al vaciar carrito:", error);
    res.status(500).json({ error: "Error al vaciar carrito" });
  }
};

// =====================
// PROCESAR CHECKOUT
// =====================
export const procesarCheckout = async (req, res) => {
  const { 
    cliente_id, 
    tipo_entrega, 
    direccion_entrega, 
    hora_entrega
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Obtener items del carrito
    const carritoResult = await client.query(`
      SELECT * FROM carrito WHERE cliente_id = $1
    `, [cliente_id]);

    if (carritoResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Carrito vacío' });
    }

    const carrito = carritoResult.rows;

    // 2. Calcular total
    const total = carrito.reduce((sum, item) => 
      sum + (item.cantidad * parseFloat(item.precio_unitario)), 0
    );

    // 3. Crear orden de venta
    const ordenResult = await client.query(`
      INSERT INTO orden_venta 
      (cliente_id, fecha, total, estado, tipo_entrega, direccion_entrega, hora_entrega)
      VALUES ($1, NOW(), $2, 'pendiente', $3, $4, $5)
      RETURNING id
    `, [cliente_id, total, tipo_entrega, direccion_entrega, hora_entrega]);

    const ordenId = ordenResult.rows[0].id;

    // 4. Insertar detalles de venta
    for (const item of carrito) {
      await client.query(`
        INSERT INTO detalle_venta 
        (orden_venta_id, producto_id, producto_tipo, cantidad, precio_unitario, subtotal)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        ordenId,
        item.producto_id,
        item.producto_tipo,
        item.cantidad,
        item.precio_unitario,
        item.cantidad * parseFloat(item.precio_unitario)
      ]);
    }

    // 5. Vaciar carrito
    await client.query('DELETE FROM carrito WHERE cliente_id = $1', [cliente_id]);

    await client.query('COMMIT');

    console.log(`✅ Orden #${ordenId} creada exitosamente`);
    res.json({ 
      success: true, 
      orden_id: ordenId,
      total: total.toFixed(2),
      message: 'Orden creada exitosamente' 
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Error en checkout:", error);
    res.status(500).json({ error: "Error al procesar la orden" });
  } finally {
    client.release();
  }
};