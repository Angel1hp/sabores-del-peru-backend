// controllers/clientesController.js
import pool from "../db/connection.js";

// =====================
// OBTENER TODOS LOS CLIENTES (ADMIN)
// =====================
export const obtenerTodosLosClientes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        c.nombre,
        c.apellido,
        c.email,
        c.telefono,
        c.direccion,
        c.usuario,
        c.numero_documento,
        c.ruc,
        c.fecha_registro,
        d.nombre as distrito,
        p.nombre as provincia,
        dep.nombre as departamento,
        COUNT(DISTINCT ov.id) as total_ordenes,
        COALESCE(SUM(ov.total), 0) as total_gastado
      FROM cliente c
      LEFT JOIN distrito d ON c.distrito_id = d.id
      LEFT JOIN provincia p ON d.provincia_id = p.id
      LEFT JOIN departamento dep ON p.departamento_id = dep.id
      LEFT JOIN orden_venta ov ON ov.cliente_id = c.id
      GROUP BY c.id, d.id, p.id, dep.id
      ORDER BY c.fecha_registro DESC
    `);

    console.log(`✅ ${result.rows.length} clientes obtenidos`);
    res.json(result.rows);

  } catch (error) {
    console.error("❌ Error al obtener clientes:", error);
    res.status(500).json({ error: "Error al obtener clientes" });
  }
};

// =====================
// OBTENER ESTADÍSTICAS DE CLIENTES
// =====================
export const obtenerEstadisticasClientes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_clientes,
        COUNT(*) FILTER (WHERE fecha_registro >= CURRENT_DATE - INTERVAL '30 days') as nuevos_mes,
        COUNT(DISTINCT ov.cliente_id) as clientes_activos,
        ROUND(AVG(ordenes_por_cliente.total_ordenes), 2) as promedio_ordenes
      FROM cliente c
      LEFT JOIN orden_venta ov ON ov.cliente_id = c.id
      LEFT JOIN (
        SELECT cliente_id, COUNT(*) as total_ordenes
        FROM orden_venta
        GROUP BY cliente_id
      ) ordenes_por_cliente ON ordenes_por_cliente.cliente_id = c.id
    `);

    res.json(result.rows[0]);

  } catch (error) {
    console.error("❌ Error al obtener estadísticas:", error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
};

// =====================
// BUSCAR CLIENTES
// =====================
export const buscarClientes = async (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.status(400).json({ error: "Ingresa al menos 2 caracteres" });
  }

  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        c.nombre,
        c.apellido,
        c.email,
        c.telefono,
        c.usuario
      FROM cliente c
      WHERE 
        c.nombre ILIKE $1 OR
        c.apellido ILIKE $1 OR
        c.email ILIKE $1 OR
        c.usuario ILIKE $1 OR
        c.telefono ILIKE $1
      LIMIT 20
    `, [`%${q}%`]);

    res.json(result.rows);

  } catch (error) {
    console.error("❌ Error buscando clientes:", error);
    res.status(500).json({ error: "Error al buscar clientes" });
  }
};