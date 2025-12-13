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
    console.log("🛒 Agregar al carrito:", { cliente_id, producto_id, producto_tipo, cantidad, precio_unitario });

    // Validar que el producto existe según su tipo
    let productoQuery;
    let tablaProducto;
    
    switch(producto_tipo) {
      case 'comida':
        productoQuery = 'SELECT id, nombre FROM comida WHERE id = $1';
        tablaProducto = 'comida';
        break;
      case 'bebida':
        productoQuery = 'SELECT id, nombre FROM bebida WHERE id = $1';
        tablaProducto = 'bebida';
        break;
      case 'promocion':
        productoQuery = 'SELECT id, titulo as nombre, activo FROM promociones WHERE id = $1 AND activo = true';
        tablaProducto = 'promociones';
        break;
      default:
        console.error("❌ Tipo de producto inválido:", producto_tipo);
        return res.status(400).json({ error: 'Tipo de producto inválido' });
    }

    console.log(`🔍 Buscando ${producto_tipo} con ID ${producto_id} en tabla ${tablaProducto}`);
    const productoResult = await pool.query(productoQuery, [producto_id]);
    
    if (productoResult.rows.length === 0) {
      console.error(`❌ ${producto_tipo} no encontrado con ID ${producto_id}`);
      return res.status(404).json({ 
        error: 'Producto no encontrado',
        details: `No se encontró ${producto_tipo} con ID ${producto_id} en la tabla ${tablaProducto}`
      });
    }

    const productoEncontrado = productoResult.rows[0];
    console.log(`✅ ${producto_tipo} encontrado:`, productoEncontrado);

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

      console.log(`✅ Cantidad actualizada: ${producto_tipo} #${producto_id} (${productoEncontrado.nombre}) -> ${nuevaCantidad}`);
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

      console.log(`✅ Producto agregado: ${producto_tipo} #${producto_id} (${productoEncontrado.nombre})`);
      res.json({ 
        message: 'Producto agregado', 
        item: insertResult.rows[0] 
      });
    }
  } catch (error) {
    console.error("❌ Error al agregar al carrito:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({ 
      error: "Error al agregar al carrito", 
      details: error.message 
    });
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