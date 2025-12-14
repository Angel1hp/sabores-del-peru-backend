// services/emailService.js
import SibApiV3Sdk from "sib-api-v3-sdk";

/* =====================================================
   CONFIGURACIÓN BREVO API (HTTP)
===================================================== */
const client = SibApiV3Sdk.ApiClient.instance;

// API KEY (desde Render)
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

// API transaccional
const api = new SibApiV3Sdk.TransactionalEmailsApi();

/* =====================================================
   EMAIL DE BIENVENIDA
===================================================== */
export const enviarEmailBienvenida = async (destinatario, nombreCompleto) => {
  try {
    await api.sendTransacEmail({
      sender: {
        name: "Raíces Restaurant",
        email: process.env.EMAIL_FROM
      },
      to: [{ email: destinatario }],
      subject: "🎉 ¡Bienvenido a Raíces Restaurant!",
      htmlContent: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
</head>
<body style="font-family:Arial;background:#f4f4f4;padding:20px;">
  <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:10px;overflow:hidden;">

    <div style="background:linear-gradient(135deg,#2a2a2a,#111);color:#fff;padding:30px;text-align:center;">
      <h1 style="margin:0;">🍽️ Raíces Restaurant</h1>
      <p style="margin:8px 0 0;">Cocina peruana con identidad</p>
    </div>

    <div style="padding:30px;">
      <p style="font-size:18px;"><strong>¡Hola ${nombreCompleto}!</strong></p>

      <p>
        Bienvenido a <strong>Raíces Restaurant</strong> 🎉  
        Tu cuenta fue creada exitosamente.
      </p>

      <div style="background:#f9fafb;border-left:4px solid #d4af37;padding:18px;margin:20px 0;">
        <p style="margin:6px 0;">🛒 Pedidos rápidos y seguros</p>
        <p style="margin:6px 0;">📋 Historial de pedidos</p>
        <p style="margin:6px 0;">🚚 Delivery en Lima</p>
        <p style="margin:6px 0;">🎁 Promociones exclusivas</p>
      </div>

      <div style="text-align:center;margin:30px 0;">
        <a href="https://raices-front-nine.vercel.app/menu.html"
           style="background:#d4af37;color:#ffffff;text-decoration:none;
                  padding:14px 36px;border-radius:6px;font-weight:bold;display:inline-block;">
          Ver menú
        </a>
      </div>

      <p>
        Gracias por elegirnos,<br>
        <strong>Equipo Raíces Restaurant</strong>
      </p>
    </div>

    <div style="background:#f3f4f6;padding:15px;text-align:center;color:#6b7280;font-size:13px;">
      © 2024 Raíces Restaurant – Lima, Perú
    </div>

  </div>
</body>
</html>
      `
    });

    return { success: true };
  } catch (error) {
    console.error("❌ Error email bienvenida:", error.message);
    return { success: false, error: error.message };
  }
};

/* =====================================================
   EMAIL CONFIRMACIÓN DE PEDIDO
===================================================== */
export const enviarEmailConfirmacionPedido = async (
  destinatario,
  nombreCliente,
  ordenId,
  numeroComprobante,
  items,
  total,
  tipo_comprobante, // "factura" | "boleta"
  ruc,
  impuesto
) => {
  try {
    /* ---------- Construir tabla de items ---------- */
    const itemsHTML = items.map(item => {
      const nombre = item.nombre || item.producto_nombre || "Producto";
      const precio = Number(item.precio_unitario || item.precio || 0);
      const cantidad = Number(item.cantidad || 1);
      const subtotal = precio * cantidad;

      return `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${nombre}</td>
          <td style="padding:10px;text-align:center;border-bottom:1px solid #e5e7eb;">${cantidad}</td>
          <td style="padding:10px;text-align:right;border-bottom:1px solid #e5e7eb;">S/ ${precio.toFixed(2)}</td>
          <td style="padding:10px;text-align:right;border-bottom:1px solid #e5e7eb;">S/ ${subtotal.toFixed(2)}</td>
        </tr>
      `;
    }).join("");

    await api.sendTransacEmail({
      sender: {
        name: "Raíces Restaurant",
        email: process.env.EMAIL_FROM
      },
      to: [{ email: destinatario }],
      subject: `✅ Pedido #${ordenId} confirmado`,
      htmlContent: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
</head>
<body style="font-family:Arial;background:#f4f4f4;padding:20px;">
  <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:10px;overflow:hidden;">

    <div style="background:#22c55e;color:#fff;padding:25px;text-align:center;">
      <h1 style="margin:0;">✅ Pedido confirmado</h1>
      <p style="margin:5px 0;">Raíces Restaurant</p>
    </div>

    <div style="padding:25px;">
      <p><strong>Hola ${nombreCliente},</strong></p>
      <p>Tu pedido <strong>#${ordenId}</strong> fue confirmado.</p>

      <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:15px;margin:20px 0;">
        <p style="margin:6px 0;"><strong>Comprobante:</strong> ${numeroComprobante}</p>
        <p style="margin:6px 0;"><strong>IGV (18%):</strong> S/ ${Number(impuesto).toFixed(2)}</p>
        <p style="margin:6px 0;"><strong>Total:</strong> S/ ${Number(total).toFixed(2)}</p>

        ${tipo_comprobante === "factura" ? `
          <p style="margin:6px 0;"><strong>Tipo de comprobante:</strong> FACTURA</p>
          <p style="margin:6px 0;"><strong>RUC:</strong> ${ruc}</p>
        ` : `
          <p style="margin:6px 0;"><strong>Tipo de comprobante:</strong> BOLETA</p>
        `}
      </div>

      <h3>📦 Detalle del pedido</h3>

      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <thead>
          <tr style="background:#1f2937;color:#ffffff;">
            <th style="padding:10px;text-align:left;">Producto</th>
            <th style="padding:10px;text-align:center;">Cant.</th>
            <th style="padding:10px;text-align:right;">Precio</th>
            <th style="padding:10px;text-align:right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
          <tr style="background:#f9fafb;font-weight:bold;">
            <td colspan="3" style="padding:12px;text-align:right;">TOTAL</td>
            <td style="padding:12px;text-align:right;color:#22c55e;">
              S/ ${Number(total).toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>

      <p style="margin-top:25px;">
        ⏱️ <strong>Tiempo estimado:</strong> 30–45 minutos
      </p>

      <p>Gracias por tu compra,<br><strong>Raíces Restaurant</strong></p>
    </div>

    <div style="background:#f3f4f6;padding:15px;text-align:center;color:#6b7280;font-size:13px;">
      © 2024 Raíces Restaurant – Lima, Perú
    </div>

  </div>
</body>
</html>
      `
    });

    return { success: true };
  } catch (error) {
    console.error("❌ Error email pedido:", error.message);
    return { success: false, error: error.message };
  }
};
