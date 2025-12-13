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
      SELECT 
        c.id, 
        c.nombre, 
        c.descripcion, 
        c.precio, 
        c.disponible, 
        c.imagen, 
        cat.nombre AS categoria,
        'comida' as tipo
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
      SELECT 
        b.id, 
        b.nombre, 
        b.tipo AS categoria, 
        b.tamano_ml,
        b.precio, 
        b.imagen, 
        b.disponible,
        b.descripcion,
        'bebida' as tipo
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
      SELECT 
        c.id, 
        c.nombre, 
        c.descripcion, 
        c.precio, 
        c.imagen, 
        cat.nombre AS categoria,
        'comida' as tipo
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
      SELECT 
        id, 
        nombre, 
        tipo AS categoria, 
        tamano_ml,
        precio, 
        imagen,
        descripcion,
        'bebida' as tipo
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
      SELECT 
        c.id, 
        c.nombre, 
        c.descripcion, 
        c.precio, 
        cat.nombre AS categoria, 
        c.disponible, 
        c.imagen,
        'comida' as tipo
      FROM comida c
      JOIN categoria cat ON c.categoria_id = cat.id
      WHERE c.disponible = true
      ORDER BY c.id ASC
    `);

    const bebidas = await pool.query(`
      SELECT 
        b.id, 
        b.nombre, 
        b.tipo AS categoria, 
        b.tamano_ml, 
        b.precio, 
        b.disponible, 
        b.imagen,
        b.descripcion,
        'bebida' as tipo
      FROM bebida b
      WHERE b.disponible = true
      ORDER BY b.id ASC
    `);

    const menu = [
      ...comidas.rows,
      ...bebidas.rows,
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
      SELECT 
        c.id, 
        c.nombre, 
        c.descripcion, 
        c.precio, 
        cat.nombre AS categoria, 
        c.imagen,
        'comida' as tipo
      FROM comida c
      JOIN categoria cat ON c.categoria_id = cat.id
      WHERE c.id = $1
    `, [id]);

    if (comida.rows.length > 0) {
      return res.json(comida.rows[0]);
    }

    const bebida = await pool.query(`
      SELECT 
        id, 
        nombre, 
        tipo AS categoria, 
        tamano_ml, 
        precio, 
        imagen,
        descripcion,
        'bebida' as tipo
      FROM bebida
      WHERE id = $1
    `, [id]);

    if (bebida.rows.length > 0) {
      return res.json(bebida.rows[0]);
    }

    res.status(404).json({ error: "Producto no encontrado" });
  } catch (error) {
    console.error("❌ Error al obtener el producto:", error);
    res.status(500).json({ error: "Error al obtener el producto" });
  }
};
// =====================
// ACTUALIZAR COMIDA admin
// =====================
// =====================
// ACTUALIZAR COMIDA
// =====================
export const actualizarComida = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, categoria_id, imagen, disponible } = req.body;

  try {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (nombre !== undefined) {
      updates.push(`nombre = $${paramCount}`);
      values.push(nombre);
      paramCount++;
    }
    if (descripcion !== undefined) {
      updates.push(`descripcion = $${paramCount}`);
      values.push(descripcion);
      paramCount++;
    }
    if (precio !== undefined) {
      updates.push(`precio = $${paramCount}`);
      values.push(precio);
      paramCount++;
    }
    if (categoria_id !== undefined) {
      updates.push(`categoria_id = $${paramCount}`);
      values.push(categoria_id);
      paramCount++;
    }
    if (imagen !== undefined) {
      updates.push(`imagen = $${paramCount}`);
      values.push(imagen);
      paramCount++;
    }
    if (disponible !== undefined) {
      updates.push(`disponible = $${paramCount}`);
      values.push(disponible);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No hay datos para actualizar" });
    }

    values.push(id);

    const result = await pool.query(`
      UPDATE comida 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Comida no encontrada" });
    }

    console.log(`✅ Comida #${id} actualizada`);
    res.json({ 
      success: true,
      message: 'Comida actualizada correctamente',
      comida: result.rows[0] 
    });

  } catch (error) {
    console.error("❌ Error al actualizar comida:", error);
    res.status(500).json({ error: "Error al actualizar comida" });
  }
};

// =====================
// ACTUALIZAR BEBIDA
// =====================
export const actualizarBebida = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, tipo, tamano_ml, imagen, disponible } = req.body;

  try {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (nombre !== undefined) {
      updates.push(`nombre = $${paramCount}`);
      values.push(nombre);
      paramCount++;
    }
    if (descripcion !== undefined) {
      updates.push(`descripcion = $${paramCount}`);
      values.push(descripcion);
      paramCount++;
    }
    if (precio !== undefined) {
      updates.push(`precio = $${paramCount}`);
      values.push(precio);
      paramCount++;
    }
    if (tipo !== undefined) {
      updates.push(`tipo = $${paramCount}`);
      values.push(tipo);
      paramCount++;
    }
    if (tamano_ml !== undefined) {
      updates.push(`tamano_ml = $${paramCount}`);
      values.push(tamano_ml);
      paramCount++;
    }
    if (imagen !== undefined) {
      updates.push(`imagen = $${paramCount}`);
      values.push(imagen);
      paramCount++;
    }
    if (disponible !== undefined) {
      updates.push(`disponible = $${paramCount}`);
      values.push(disponible);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No hay datos para actualizar" });
    }

    values.push(id);

    const result = await pool.query(`
      UPDATE bebida 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Bebida no encontrada" });
    }

    console.log(`✅ Bebida #${id} actualizada`);
    res.json({ 
      success: true,
      message: 'Bebida actualizada correctamente',
      bebida: result.rows[0] 
    });

  } catch (error) {
    console.error("❌ Error al actualizar bebida:", error);
    res.status(500).json({ error: "Error al actualizar bebida" });
  }
};
// CREAR COMIDA
// =====================
export const crearComida = async (req, res) => {
  const { nombre, descripcion, precio, categoria_id, imagen, disponible } = req.body;

  try {
    // Validaciones
    if (!nombre || !precio || !categoria_id) {
      return res.status(400).json({ 
        error: "Nombre, precio y categoría son obligatorios" 
      });
    }

    const result = await pool.query(`
      INSERT INTO comida (nombre, descripcion, precio, categoria_id, imagen, disponible)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [nombre, descripcion, precio, categoria_id, imagen, disponible !== false]);

    console.log(`✅ Comida creada: ${nombre}`);
    res.status(201).json({ 
      success: true,
      message: 'Comida creada exitosamente',
      comida: result.rows[0] 
    });

  } catch (error) {
    console.error("❌ Error al crear comida:", error);
    res.status(500).json({ error: "Error al crear comida" });
  }
};

// =====================
// CREAR BEBIDA
// =====================
export const crearBebida = async (req, res) => {
  const { nombre, descripcion, precio, tipo, tamano_ml, imagen, disponible } = req.body;

  try {
    // Validaciones
    if (!nombre || !precio) {
      return res.status(400).json({ 
        error: "Nombre y precio son obligatorios" 
      });
    }

    const result = await pool.query(`
      INSERT INTO bebida (nombre, descripcion, precio, tipo, tamano_ml, imagen, disponible)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [nombre, descripcion, precio, tipo || 'Otro', tamano_ml, imagen, disponible !== false]);

    console.log(`✅ Bebida creada: ${nombre}`);
    res.status(201).json({ 
      success: true,
      message: 'Bebida creada exitosamente',
      bebida: result.rows[0] 
    });

  } catch (error) {
    console.error("❌ Error al crear bebida:", error);
    res.status(500).json({ error: "Error al crear bebida" });
  }
};