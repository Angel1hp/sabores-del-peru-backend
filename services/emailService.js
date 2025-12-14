// services/emailService.js - VERSIÓN BREVO
import nodemailer from 'nodemailer';

// ✅ CONFIGURACIÓN CON BREVO
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.BREVO_USER, // Tu email de Brevo
    pass: process.env.BREVO_API_KEY // Tu API Key de Brevo
  }
});

// Verificar conexión
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Error al conectar con Brevo:', error);
  } else {
    console.log('✅ Brevo listo para enviar emails');
  }
});

// =====================================================
// EMAIL DE BIENVENIDA
// =====================================================
export const enviarEmailBienvenida = async (destinatario, nombreCompleto) => {
  try {
    const mailOptions = {
      from: {
        name: 'Raíces Restaurant',
        address: process.env.BREVO_USER
      },
      to: destinatario,
      subject: '🎉 ¡Bienvenido a Raíces Restaurant!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .cta-button {
              display: inline-block;
              background: #d4af37;
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .features {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .feature-item {
              padding: 10px 0;
              border-bottom: 1px solid #eee;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🍽️ Raíces Restaurant</h1>
            <p>Experiencia Gastronómica Peruana</p>
          </div>
          
          <div class="content">
            <p><strong>¡Hola ${nombreCompleto}!</strong></p>
            
            <p>¡Bienvenido a la familia Raíces! 🎉</p>
            
            <p>Tu cuenta ha sido creada exitosamente y ya puedes disfrutar de:</p>
            
            <div class="features">
              <div class="feature-item">🛒 Pedidos rápidos y seguros</div>
              <div class="feature-item">📋 Historial de pedidos</div>
              <div class="feature-item">🚚 Delivery a toda Lima</div>
              <div class="feature-item">🎁 Promociones exclusivas</div>
              <div class="feature-item">💳 Múltiples métodos de pago</div>
            </div>
            
            <center>
              <a href="https://raices-front-nine.vercel.app/menu.html" class="cta-button">
                Ver Nuestro Menú
              </a>
            </center>
            
            <p>¡Gracias por elegirnos!</p>
            <p><strong>El equipo de Raíces</strong></p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>© 2024 Raíces Restaurant - Lima, Perú</p>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email de bienvenida enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return { success: false, error: error.message };
  }
};

// =====================================================
// EMAIL DE CONFIRMACIÓN DE PEDIDO
// =====================================================
export const enviarEmailConfirmacionPedido = async (
  destinatario,
  nombreCliente,
  ordenId,
  numeroComprobante,
  items,
  total
) => {
  try {
    const itemsHTML = items.map(item => {
      const nombreProducto = item.nombre || item.producto_nombre || item.titulo || 'Producto';
      const precioUnitario = parseFloat(item.precio_unitario || item.precio || 0);
      const cantidad = parseInt(item.cantidad || 1);
      const subtotal = cantidad * precioUnitario;
      
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${nombreProducto}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${cantidad}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">S/ ${precioUnitario.toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">S/ ${subtotal.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const mailOptions = {
      from: {
        name: 'Raíces Restaurant',
        address: process.env.BREVO_USER
      },
      to: destinatario,
      subject: `✅ Pedido Confirmado #${ordenId} - Raíces`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
            }
            .order-info {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th {
              background: #2a2a2a;
              color: white;
              padding: 12px;
              text-align: left;
            }
            .total-row {
              font-weight: bold;
              font-size: 18px;
              background: #f0f0f0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>✅ Pedido Confirmado</h1>
          </div>
          
          <div class="content">
            <p><strong>Hola ${nombreCliente},</strong></p>
            
            <p>Tu pedido ha sido confirmado y está siendo preparado.</p>
            
            <div class="order-info">
              <p><strong>📋 Orden:</strong> #${ordenId}</p>
              <p><strong>🧾 Comprobante:</strong> ${numeroComprobante}</p>
              <p><strong>📅 Fecha:</strong> ${new Date().toLocaleString('es-PE')}</p>
              
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style="text-align: center;">Cant.</th>
                    <th style="text-align: right;">Precio</th>
                    <th style="text-align: right;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                  <tr class="total-row">
                    <td colspan="3" style="padding: 15px; text-align: right;">TOTAL:</td>
                    <td style="padding: 15px; text-align: right; color: #22c55e;">S/ ${parseFloat(total).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <p>🚚 <strong>Tiempo estimado:</strong> 30-45 minutos</p>
            
            <p>Gracias por tu preferencia,<br><strong>Raíces Restaurant</strong></p>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email de confirmación enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return { success: false, error: error.message };
  }
};

console.log('✅ Servicio de email configurado con Brevo');

export default transporter;