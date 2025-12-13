// controllers/notificacionesController.js
import pool from "../db/connection.js";

// =====================
// OBTENER NOTIFICACIONES DEL CLIENTE
// =====================
export const obtenerNotificaciones = async (req, res) => {
  const { clienteId } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT 
        n.id,
        n.titulo,
        n.mensaje,
        n.tipo,
        n.leida,
        n.fecha_creacion as fecha,
        n.orden_venta_id,
        cp.numero as numero_comprobante
      FROM notificacion n
      LEFT JOIN comprobante_pago cp ON cp.orden_venta_id = n.orden_venta_id
      WHERE n.cliente_id = $1
      ORDER BY n.fecha_creacion DESC
      LIMIT 50
    `, [clienteId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener notificaciones:", error);
    res.status(500).json({ error: "Error al obtener notificaciones" });
  }
};

// =====================
// MARCAR NOTIFICACIÓN COMO LEÍDA
// =====================
export const marcarComoLeida = async (req, res) => {
  const { notificacionId } = req.params;
  
  try {
    await pool.query(`
      UPDATE notificacion 
      SET leida = true 
      WHERE id = $1
    `, [notificacionId]);
    
    res.json({ success: true, message: "Notificación marcada como leída" });
  } catch (error) {
    console.error("❌ Error al marcar notificación:", error);
    res.status(500).json({ error: "Error al marcar notificación" });
  }
};

// =====================
// MARCAR TODAS COMO LEÍDAS
// =====================
export const marcarTodasComoLeidas = async (req, res) => {
  const { clienteId } = req.params;
  
  try {
    await pool.query(`
      UPDATE notificacion 
      SET leida = true 
      WHERE cliente_id = $1 AND leida = false
    `, [clienteId]);
    
    res.json({ success: true, message: "Todas las notificaciones marcadas como leídas" });
  } catch (error) {
    console.error("❌ Error al marcar notificaciones:", error);
    res.status(500).json({ error: "Error al marcar notificaciones" });
  }
};

// =====================
// CREAR NOTIFICACIÓN (Usado internamente)
// =====================
export const crearNotificacion = async (cliente_id, orden_venta_id, titulo, mensaje, tipo = 'info') => {
  try {
    await pool.query(`
      INSERT INTO notificacion (cliente_id, orden_venta_id, titulo, mensaje, tipo, leida, fecha_creacion)
      VALUES ($1, $2, $3, $4, $5, false, NOW())
    `, [cliente_id, orden_venta_id, titulo, mensaje, tipo]);
    
    console.log(`✅ Notificación creada para cliente ${cliente_id}`);
  } catch (error) {
    console.error("❌ Error al crear notificación:", error);
  }
};