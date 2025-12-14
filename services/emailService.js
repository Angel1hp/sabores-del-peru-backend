// services/emailService.js - VERSIÓN DEFINITIVA PARA RENDER
import nodemailer from 'nodemailer';

// =====================================================
// CONFIGURACIÓN BREVO CON MÚLTIPLES INTENTOS
// =====================================================

// Configuración principal: Puerto 465 (SSL)
const config465 = {
  host: 'smtp-relay.brevo.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_API_KEY
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 10000,    // 10 segundos
  greetingTimeout: 10000,
  socketTimeout: 20000
};

// Configuración alternativa: Puerto 2525 (para Render)
const config2525 = {
  host: 'smtp-relay.brevo.com',
  port: 2525,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_API_KEY
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 20000
};

// Intentar crear transporter con puerto 2525 (más compatible con Render)
let transporter = nodemailer.createTransport(config2525);

// Verificar conexión
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Error con puerto 2525:', error.message);
    console.log('🔄 Intentando con puerto 465 SSL...');
    
    // Si falla, intentar con puerto 465
    transporter = nodemailer.createTransport(config465);
    
    transporter.verify((error2, success2) => {
      if (error2) {
        console.error('❌ Error con puerto 465:', error2.message);
        console.log('⚠️  Verifica las variables BREVO_USER y BREVO_API_KEY en Render');
        console.log('⚠️  Email:', process.env.BREVO_USER);
      } else {
        console.log('✅ Brevo conectado correctamente (Puerto 465 SSL)');
        console.log('📧 Enviando desde:', process.env.BREVO_USER);
      }
    });
  } else {
    console.log('✅ Brevo conectado correctamente (Puerto 2525)');
    console.log('📧 Enviando desde:', process.env.BREVO_USER);
  }
});

// =====================================================
// EMAIL DE BIENVENIDA
// =====================================================
export const enviarEmailBienvenida = async (destinatario, nombreCompleto) => {
  try {
    console.log('📧 Preparando email de bienvenida para:', destinatario);
    
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
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f4f4; }
            .container { background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%); color: white; padding: 40px; text-align: center; }
            .header h1 { margin: 0; font-size: 32px; }
            .content { padding: 40px 30px; }
            .features { background: #f9f9f9; padding: 25px; border-radius: 8px; margin: 25px 0; }
            .feature-item { padding: 12px 0; border-bottom: 1px solid #e0e0e0; }
            .feature-item:last-child { border-bottom: none; }
            .cta-button { display: inline-block; background: #d4af37; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin: 25px 0; font-weight: bold; }
            .footer { background: #f0f0f0; padding: 25px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🍽️ Raíces Restaurant</h1>
              <p>Experiencia Gastronómica Peruana</p>
            </div>
            <div class="content">
              <p style="font-size: 18px;"><strong>¡Hola ${nombreCompleto}!</strong></p>
              <p>¡Bienvenido a la familia Raíces! 🎉</p>
              <p>Tu cuenta ha sido creada exitosamente.</p>
              <div class="features">
                <div class="feature-item">🛒 <strong>Pedidos Rápidos</strong></div>
                <div class="feature-item">📋 <strong>Historial de Pedidos</strong></div>
                <div class="feature-item">🚚 <strong>Delivery a Lima</strong></div>
                <div class="feature-item">🎁 <strong>Promociones Exclusivas</strong></div>
                <div class="feature-item">💳 <strong>Pagos Seguros</strong></div>
              </div>
              <center>
                <a href="https://raices-front-nine.vercel.app/menu.html" class="cta-button">Ver Menú</a>
              </center>
              <p>¡Gracias por elegirnos!<br><strong>El equipo de Raíces</strong></p>
            </div>
            <div class="footer">
              <p>© 2024 Raíces Restaurant - Lima, Perú</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de bienvenida enviado:', info.messageId);
    console.log('   Destinatario:', destinatario);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Error enviando email de bienvenida:', error.message);
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
    console.log('📧 Preparando email de confirmación para:', destinatario);
    
    const itemsHTML = items.map(item => {
      const nombre = item.nombre || item.producto_nombre || item.titulo || 'Producto';
      const precio = parseFloat(item.precio_unitario || item.precio || 0);
      const cantidad = parseInt(item.cantidad || 1);
      const subtotal = cantidad * precio;
      
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${nombre}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">${cantidad}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">S/ ${precio.toFixed(2)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">S/ ${subtotal.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const mailOptions = {
      from: {
        name: 'Raíces Restaurant',
        address: process.env.BREVO_USER
      },
      to: destinatario,
      subject: `✅ Pedido #${ordenId} Confirmado - Raíces`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f4f4; }
            .container { background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 40px; text-align: center; }
            .header h1 { margin: 0; font-size: 32px; }
            .content { padding: 40px 30px; }
            .order-box { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 25px 0; }
            table { width: 100%; border-collapse: collapse; margin: 25px 0; }
            th { background: #2a2a2a; color: white; padding: 15px 12px; text-align: left; }
            .total-row { font-weight: bold; font-size: 18px; background: #f9f9f9; }
            .total-row td { padding: 20px 12px; }
            .footer { background: #f0f0f0; padding: 25px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Pedido Confirmado</h1>
              <p>¡Gracias por tu compra!</p>
            </div>
            <div class="content">
              <p><strong>Hola ${nombreCliente},</strong></p>
              <p>Tu pedido está siendo preparado.</p>
              <div class="order-box">
                <p style="margin: 0;"><strong>Orden:</strong> #${ordenId}</p>
                <p style="margin: 5px 0;"><strong>Comprobante:</strong> ${numeroComprobante}</p>
                <p style="margin: 5px 0;"><strong>Fecha:</strong> ${new Date().toLocaleString('es-PE')}</p>
              </div>
              <h3>📦 Detalle del Pedido</h3>
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style="text-align: center; width: 80px;">Cant.</th>
                    <th style="text-align: right; width: 100px;">Precio</th>
                    <th style="text-align: right; width: 100px;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                  <tr class="total-row">
                    <td colspan="3" style="text-align: right;">TOTAL:</td>
                    <td style="text-align: right; color: #22c55e;">S/ ${parseFloat(total).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
              <p>🚚 <strong>Tiempo estimado:</strong> 30-45 minutos</p>
              <p>Gracias,<br><strong>Raíces Restaurant</strong></p>
            </div>
            <div class="footer">
              <p>© 2024 Raíces Restaurant</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de confirmación enviado:', info.messageId);
    console.log('   Destinatario:', destinatario);
    console.log('   Orden:', ordenId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Error enviando confirmación:', error.message);
    return { success: false, error: error.message };
  }
};

console.log('✅ Servicio de email configurado (Brevo)');

export default transporter;