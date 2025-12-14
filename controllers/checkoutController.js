// controllers/checkoutController.js - VERSIÓN COMPLETA
import pool from "../db/connection.js";
import { crearNotificacion } from "./notificacionesController.js";
import { enviarEmailConfirmacionPedido } from "../services/emailService.js";

// =====================
// PROCESAR CHECKOUT COMPLETO
// =====================
export const procesarCheckout = async (req, res) => {
  const { 
    cliente_id, 
    tipo_entrega, 
    direccion_entrega,
    referencia,
    hora_entrega,
    metodo_pago,
    tipo_comprobante,
    ruc,
    items
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log(`🛒 Procesando checkout para cliente ${cliente_id}`);
    console.log(`📦 Items recibidos:`, JSON.stringify(items, null, 2));

    // 1. Validar que haya items
    if (!items || items.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No hay items en el pedido' });
    }

    // 2. Obtener datos del cliente
    const clienteResult = await client.query(`
      SELECT nombre, apellido, email FROM cliente WHERE id = $1
    `, [cliente_id]);

    if (clienteResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const { nombre, apellido, email } = clienteResult.rows[0];
    const nombreCliente = `${nombre} ${apellido}`;
    console.log(`👤 Cliente: ${nombreCliente} (${email})`);

    // 3. Obtener el empleado "Sistema"
    const empleadoResult = await client.query(`
      SELECT id FROM empleado WHERE usuario = 'sistema' LIMIT 1
    `);

    if (empleadoResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(500).json({ 
        error: 'Error de configuración: No existe empleado del sistema'
      });
    }

    const empleado_id = empleadoResult.rows[0].id;

    // 4. Calcular total
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.cantidad * parseFloat(item.precio_unitario);
    }

    const impuesto = subtotal * 0.18;
    const total = subtotal + impuesto;

    console.log(`💰 Total: S/ ${total.toFixed(2)}`);

    // 5. Obtener fecha actual
    const fechaActual = new Date();
    const anio = fechaActual.getFullYear();
    const mes = fechaActual.getMonth() + 1;
    const dia = fechaActual.getDate();

    // 6. Obtener IDs temporales
    const anioResult = await client.query('SELECT id FROM anio WHERE valor = $1', [anio]);
    const mesResult = await client.query('SELECT id FROM mes WHERE numero = $1', [mes]);
    const diaResult = await client.query('SELECT id FROM dia WHERE valor = $1', [dia]);

    let anio_id = anioResult.rows[0]?.id;
    let mes_id = mesResult.rows[0]?.id;
    let dia_id = diaResult.rows[0]?.id;

    if (!anio_id) {
      const insertAnio = await client.query('INSERT INTO anio (valor) VALUES ($1) RETURNING id', [anio]);
      anio_id = insertAnio.rows[0].id;
    }
    if (!mes_id) {
      const insertMes = await client.query('INSERT INTO mes (numero, nombre) VALUES ($1, $2) RETURNING id', [mes, obtenerNombreMes(mes)]);
      mes_id = insertMes.rows[0].id;
    }
    if (!dia_id) {
      const insertDia = await client.query('INSERT INTO dia (valor) VALUES ($1) RETURNING id', [dia]);
      dia_id = insertDia.rows[0].id;
    }

    // 7. Crear orden de venta
    const ordenResult = await client.query(`
      INSERT INTO orden_venta 
      (cliente_id, empleado_id, fecha, total, estado, tipo_entrega, direccion_entrega, referencia, hora_entrega, anio_id, mes_id, dia_id)
      VALUES ($1, $2, NOW(), $3, 'pendiente', $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `, [cliente_id, empleado_id, total, tipo_entrega, direccion_entrega, referencia, hora_entrega, anio_id, mes_id, dia_id]);

    const orden_id = ordenResult.rows[0].id;
    console.log(`✅ Orden #${orden_id} creada`);

    // 8. ✅ OBTENER NOMBRES DE PRODUCTOS Y GUARDAR DETALLES
    const itemsConNombres = [];
    
    for (const item of items) {
      let comida_id = null;
      let bebida_id = null;
      let promocion_id = null;
      let nombreProducto = 'Producto';

      const producto_tipo = item.producto_tipo.toLowerCase();
      
      // Obtener el nombre del producto según el tipo
      if (producto_tipo === 'comida') {
        comida_id = item.producto_id;
        const comidaResult = await client.query(
          'SELECT nombre FROM comida WHERE id = $1',
          [item.producto_id]
        );
        nombreProducto = comidaResult.rows[0]?.nombre || 'Comida';
      } else if (producto_tipo === 'bebida') {
        bebida_id = item.producto_id;
        const bebidaResult = await client.query(
          'SELECT nombre FROM bebida WHERE id = $1',
          [item.producto_id]
        );
        nombreProducto = bebidaResult.rows[0]?.nombre || 'Bebida';
      } else if (producto_tipo === 'promocion') {
        promocion_id = item.producto_id;
        const promocionResult = await client.query(
          'SELECT titulo as nombre FROM promociones WHERE id = $1',
          [item.producto_id]
        );
        nombreProducto = promocionResult.rows[0]?.nombre || 'Promoción';
      } else {
        throw new Error(`Tipo de producto inválido: ${producto_tipo}`);
      }

      const subtotalItem = item.cantidad * parseFloat(item.precio_unitario);

      // Guardar en detalle_venta
      await client.query(`
        INSERT INTO detalle_venta 
        (orden_venta_id, comida_id, bebida_id, promocion_id, cantidad, subtotal)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [orden_id, comida_id, bebida_id, promocion_id, item.cantidad, subtotalItem]);
      
      // Guardar item con nombre para el email
      itemsConNombres.push({
        nombre: nombreProducto,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        producto_tipo: producto_tipo
      });
      
      console.log(`  ✅ Detalle: ${nombreProducto} x${item.cantidad}`);
    }

    console.log(`✅ ${items.length} detalles insertados`);
    console.log('📧 Items para email:', itemsConNombres);

    // 9. Obtener o crear método de pago
    let metodoPagoResult = await client.query('SELECT id FROM forma_pago WHERE metodo = $1', [metodo_pago]);
    let forma_pago_id = metodoPagoResult.rows[0]?.id;

    if (!forma_pago_id) {
      const insertMetodo = await client.query(
        'INSERT INTO forma_pago (metodo, descripcion) VALUES ($1, $2) RETURNING id',
        [metodo_pago, `Pago mediante ${metodo_pago}`]
      );
      forma_pago_id = insertMetodo.rows[0].id;
    }

    // 10. Generar comprobante
    const tipoAbrev = tipo_comprobante === 'factura' ? 'F' : 'B';
    const numeroComprobante = `${tipoAbrev}${String(orden_id).padStart(8, '0')}`;

    await client.query(`
      INSERT INTO comprobante_pago 
      (numero, tipo, fecha_emision, subtotal, impuesto, total, estado, cliente_id, empleado_id, forma_pago_id, orden_venta_id, ruc)
      VALUES ($1, $2, NOW(), $3, $4, $5, 'emitido', $6, $7, $8, $9, $10)
    `, [
      numeroComprobante,
      tipo_comprobante,
      subtotal,
      impuesto,
      total,
      cliente_id,
      empleado_id,
      forma_pago_id,
      orden_id,
      ruc
    ]);

    console.log(`✅ Comprobante ${numeroComprobante} generado`);

    // 11. Crear notificación
    await crearNotificacion(
      cliente_id,
      orden_id,
      '¡Pedido confirmado! 🎉',
      `Tu pedido #${orden_id} ha sido procesado exitosamente. Comprobante: ${numeroComprobante}`,
      'success'
    );

    // 12. Vaciar carrito
    await client.query('DELETE FROM carrito WHERE cliente_id = $1', [cliente_id]);
    console.log(`✅ Carrito vaciado`);

    await client.query('COMMIT');

    console.log(`🎉 Checkout completado - Orden #${orden_id}`);

    // ✅ ENVIAR EMAIL DE CONFIRMACIÓN CON NOMBRES CORRECTOS
    enviarEmailConfirmacionPedido(
      email,
      nombreCliente,
      orden_id,
      numeroComprobante,
      itemsConNombres,  // ✅ Usar itemsConNombres que tiene los nombres correctos
      total,
      tipo,   // ← comprobante_pago.tipo
      ruc   
    )
      .then(resultado => {
        if (resultado.success) {
          console.log("📧 Email de confirmación enviado a:", email);
        } else {
          console.error("❌ Error al enviar email:", resultado.error);
        }
      })
      .catch(err => {
        console.error("❌ Error en envío de email:", err);
      });

    res.json({ 
      success: true, 
      orden_id: orden_id,
      numero_comprobante: numeroComprobante,
      total: total.toFixed(2),
      subtotal: subtotal.toFixed(2),
      impuesto: impuesto.toFixed(2),
      message: 'Compra procesada exitosamente. Te hemos enviado un correo de confirmación.' 
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Error en checkout:", error.message);
    res.status(500).json({ 
      error: "Error al procesar la compra",
      details: error.message 
    });
  } finally {
    client.release();
  }
};

function obtenerNombreMes(numero) {
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return meses[numero - 1] || 'Desconocido';
}

// =====================
// OBTENER HISTORIAL DE ÓRDENES
// =====================
export const obtenerHistorialOrdenes = async (req, res) => {
  const { clienteId } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        ov.id,
        ov.fecha,
        ov.total,
        ov.estado,
        ov.tipo_entrega,
        cp.numero as numero_comprobante,
        cp.tipo as tipo_comprobante
      FROM orden_venta ov
      LEFT JOIN comprobante_pago cp ON cp.orden_venta_id = ov.id
      WHERE ov.cliente_id = $1
      ORDER BY ov.fecha DESC
    `, [clienteId]);

    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener historial:", error);
    res.status(500).json({ error: "Error al obtener historial de órdenes" });
  }
};

// =====================
// OBTENER DETALLE DE ORDEN
// =====================
export const obtenerDetalleOrden = async (req, res) => {
  const { ordenId } = req.params;

  try {
    const ordenResult = await pool.query(`
      SELECT 
        ov.*,
        c.nombre as cliente_nombre,
        c.email as cliente_email,
        cp.numero as numero_comprobante,
        cp.tipo as tipo_comprobante,
        cp.subtotal,
        cp.impuesto,
        fp.metodo as metodo_pago
      FROM orden_venta ov
      JOIN cliente c ON c.id = ov.cliente_id
      LEFT JOIN comprobante_pago cp ON cp.orden_venta_id = ov.id
      LEFT JOIN forma_pago fp ON fp.id = cp.forma_pago_id
      WHERE ov.id = $1
    `, [ordenId]);

    if (ordenResult.rows.length === 0) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    const detallesResult = await pool.query(`
      SELECT 
        dv.*,
        COALESCE(com.nombre, b.nombre, p.titulo) as producto_nombre,
        COALESCE(com.imagen, b.imagen, p.imagen) as producto_imagen,
        CASE 
          WHEN dv.comida_id IS NOT NULL THEN 'comida'
          WHEN dv.bebida_id IS NOT NULL THEN 'bebida'
          WHEN dv.promocion_id IS NOT NULL THEN 'promocion'
        END as producto_tipo
      FROM detalle_venta dv
      LEFT JOIN comida com ON com.id = dv.comida_id
      LEFT JOIN bebida b ON b.id = dv.bebida_id
      LEFT JOIN promociones p ON p.id = dv.promocion_id
      WHERE dv.orden_venta_id = $1
    `, [ordenId]);

    res.json({
      orden: ordenResult.rows[0],
      detalles: detallesResult.rows
    });

  } catch (error) {
    console.error("❌ Error al obtener detalle de orden:", error);
    res.status(500).json({ error: "Error al obtener detalle de orden" });
  }
};
// =====================
// OBTENER TODAS LAS ÓRDENES (ADMIN)
// =====================
export const obtenerTodasLasOrdenes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ov.id,
        ov.fecha,
        ov.total,
        ov.estado,
        ov.tipo_entrega,
        ov.direccion_entrega,
        ov.referencia,
        ov.hora_entrega,
        c.nombre as cliente_nombre,
        c.apellido as cliente_apellido,
        c.email as cliente_email,
        c.telefono as cliente_telefono,
        cp.numero as numero_comprobante,
        cp.tipo as tipo_comprobante,
        cp.ruc
      FROM orden_venta ov
      LEFT JOIN cliente c ON ov.cliente_id = c.id
      LEFT JOIN comprobante_pago cp ON cp.orden_venta_id = ov.id
      ORDER BY ov.fecha DESC
    `);

    console.log(`✅ ${result.rows.length} órdenes obtenidas`);
    res.json(result.rows);

  } catch (error) {
    console.error("❌ Error al obtener todas las órdenes:", error);
    res.status(500).json({ error: "Error al obtener órdenes" });
  }
};

// =====================
// OBTENER ÓRDENES RECIENTES (ADMIN)
// =====================
export const obtenerOrdenesRecientes = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const result = await pool.query(`
      SELECT 
        ov.id,
        ov.fecha,
        ov.total,
        ov.estado,
        ov.tipo_entrega,
        c.nombre as cliente_nombre,
        c.apellido as cliente_apellido,
        cp.numero as numero_comprobante
      FROM orden_venta ov
      LEFT JOIN cliente c ON ov.cliente_id = c.id
      LEFT JOIN comprobante_pago cp ON cp.orden_venta_id = ov.id
      ORDER BY ov.fecha DESC
      LIMIT $1
    `, [limit]);

    console.log(`✅ ${result.rows.length} órdenes recientes obtenidas`);
    res.json(result.rows);

  } catch (error) {
    console.error("❌ Error al obtener órdenes recientes:", error);
    res.status(500).json({ error: "Error al obtener órdenes recientes" });
  }
};

// =====================
// CAMBIAR ESTADO DE ORDEN
// =====================
export const cambiarEstadoOrden = async (req, res) => {
  const { ordenId } = req.params;
  const { estado } = req.body;

  try {
    // Validar estado
    const estadosValidos = ['pendiente', 'en_proceso', 'completado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ 
        error: 'Estado inválido',
        estadosValidos 
      });
    }

    const result = await pool.query(`
      UPDATE orden_venta 
      SET estado = $1
      WHERE id = $2
      RETURNING *
    `, [estado, ordenId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    console.log(`✅ Orden #${ordenId} actualizada a: ${estado}`);
    
    res.json({ 
      success: true,
      message: 'Estado actualizado correctamente',
      orden: result.rows[0]
    });

  } catch (error) {
    console.error("❌ Error al cambiar estado de orden:", error);
    res.status(500).json({ error: "Error al cambiar estado de orden" });
  }
};