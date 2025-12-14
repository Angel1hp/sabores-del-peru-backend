// services/emailService.js - VERSIÓN BREVO (RECOMENDADO)
import nodemailer from 'nodemailer';

// =====================================================
// CONFIGURACIÓN CON BREVO (antes Sendinblue)
// =====================================================
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,      // Tu email verificado en Brevo
    pass: process.env.BREVO_API_KEY    // Tu API Key de Brevo
  }
});

// Verificar conexión al iniciar
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Error al conectar con Brevo:', error);
    console.log('Verifica que BREVO_USER y BREVO_API_KEY estén configurados en Render');
  } else {
    console.log('✅ Brevo listo para enviar emails');
    console.log('📧 Emails se enviarán desde:', process.env.BREVO_USER);
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
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .container {
              background-color: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
            }
            .header p {
              margin: 10px 0 0 0;
              opacity: 0.9;
            }
            .content {
              padding: 40px 30px;
            }
            .welcome-message {
              font-size: 18px;
              margin-bottom: 20px;
            }
            .features {
              background: #f9f9f9;
              padding: 25px;
              border-radius: 8px;
              margin: 25px 0;
            }
            .feature-item {
              padding: 12px 0;
              border-bottom: 1px solid #e0e0e0;
              display: flex;
              align-items: center;
            }
            .feature-item:last-child {
              border-bottom: none;
            }
            .feature-icon {
              font-size: 24px;
              margin-right: 15px;
            }
            .cta-button {
              display: inline-block;
              background: #d4af37;
              color: white !important;
              padding: 15px 40px;
              text-decoration: none;
              border-radius: 5px;
              margin: 25px 0;
              font-weight: bold;
              font-size: 16px;
            }
            .cta-button:hover {
              background: #c19d2e;
            }
            .footer {
              background: #f0f0f0;
              padding: 25px;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
            .social-links {
              margin: 15px 0;
            }
            .social-links a {
              margin: 0 10px;
              color: #d4af37;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🍽️ Raíces</h1>
              <p>Experiencia Gastronómica Peruana</p>
            </div>
            
            <div class="content">
              <p class="welcome-message">
                <strong>¡Hola ${nombreCompleto}!</strong>
              </p>
              
              <p>
                ¡Bienvenido a la familia Raíces! 🎉 Estamos emocionados de tenerte con nosotros.
              </p>
              
              <p>
                Tu cuenta ha sido creada exitosamente y ahora puedes disfrutar de todos nuestros beneficios:
              </p>
              
              <div class="features">
                <div class="feature-item">
                  <span class="feature-icon">🛒</span>
                  <div>
                    <strong>Pedidos Rápidos</strong><br>
                    <small>Ordena tus platos favoritos en segundos</small>
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">📋</span>
                  <div>
                    <strong>Historial de Pedidos</strong><br>
                    <small>Revisa todos tus pedidos anteriores</small>
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">🚚</span>
                  <div>
                    <strong>Delivery Rápido</strong><br>
                    <small>Entrega a toda Lima en 30-45 minutos</small>
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">🎁</span>
                  <div>
                    <strong>Promociones Exclusivas</strong><br>
                    <small>Accede a ofertas especiales</small>
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">💳</span>
                  <div>
                    <strong>Pagos Seguros</strong><br>
                    <small>Yape, Plin, tarjetas y más</small>
                  </div>
                </div>
              </div>
              
              <center>
                <a href="https://raices-front-nine.vercel.app/menu.html" class="cta-button">
                  Explorar Nuestro Menú
                </a>
              </center>
              
              <p style="margin-top: 30px; color: #666;">
                <strong>¿Tienes alguna pregunta?</strong><br>
                No dudes en contactarnos. Estamos aquí para ayudarte.
              </p>
              
              <p>
                ¡Que disfrutes tu experiencia!<br>
                <strong>El equipo de Raíces Restaurant</strong>
              </p>
            </div>
            
            <div class="footer">
              <div class="social-links">
                <a href="#">Facebook</a> |
                <a href="#">Instagram</a> |
                <a href="#">Twitter</a>
              </div>
              <p>
                © 2024 Raíces Restaurant<br>
                Lima, Perú
              </p>
              <p style="font-size: 12px; color: #999; margin-top: 15px;">
                Este correo fue enviado a ${destinatario}<br>
                Si no creaste esta cuenta, puedes ignorar este mensaje.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email de bienvenida enviado:', info.messageId);
    console.log('   Destinatario:', destinatario);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Error al enviar email de bienvenida:', error.message);
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
    // Generar HTML de los items
    const itemsHTML = items.map(item => {
      const nombreProducto = item.nombre || item.producto_nombre || item.titulo || 'Producto';
      const precioUnitario = parseFloat(item.precio_unitario || item.precio || 0);
      const cantidad = parseInt(item.cantidad || 1);
      const subtotal = cantidad * precioUnitario;
      
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">
            ${nombreProducto}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">
            ${cantidad}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">
            S/ ${precioUnitario.toFixed(2)}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">
            S/ ${subtotal.toFixed(2)}
          </td>
        </tr>
      `;
    }).join('');

    const mailOptions = {
      from: {
        name: 'Raíces Restaurant',
        address: process.env.BREVO_USER
      },
      to: destinatario,
      subject: `✅ Pedido Confirmado #${ordenId} - Raíces Restaurant`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .container {
              background-color: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
            }
            .content {
              padding: 40px 30px;
            }
            .order-number {
              background: #f0fdf4;
              border-left: 4px solid #22c55e;
              padding: 20px;
              margin: 25px 0;
              border-radius: 5px;
            }
            .order-number h2 {
              margin: 0;
              color: #16a34a;
              font-size: 28px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 25px 0;
              background: white;
            }
            th {
              background: #2a2a2a;
              color: white;
              padding: 15px 12px;
              text-align: left;
              font-size: 14px;
            }
            .total-row {
              font-weight: bold;
              font-size: 18px;
              background: #f9f9f9;
            }
            .total-row td {
              padding: 20px 12px !important;
              border-bottom: none !important;
            }
            .info-box {
              background: #fff3cd;
              border-left: 4px solid #d4af37;
              padding: 20px;
              border-radius: 5px;
              margin: 25px 0;
            }
            .footer {
              background: #f0f0f0;
              padding: 25px;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Pedido Confirmado</h1>
              <p>¡Gracias por tu compra!</p>
            </div>
            
            <div class="content">
              <p style="font-size: 18px;">
                <strong>Hola ${nombreCliente},</strong>
              </p>
              
              <p>
                Tu pedido ha sido confirmado exitosamente y está siendo preparado con mucho cariño por nuestro equipo de cocina.
              </p>
              
              <div class="order-number">
                <p style="margin: 0 0 5px 0; font-size: 14px; color: #666;">Número de Orden</p>
                <h2>#${ordenId}</h2>
                <p style="margin: 10px 0 0 0; font-size: 14px;">
                  <strong>Comprobante:</strong> ${numeroComprobante}<br>
                  <strong>Fecha:</strong> ${new Date().toLocaleString('es-PE', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              <h3 style="color: #2a2a2a; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px;">
                📦 Detalle de tu Pedido
              </h3>
              
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
              
              <div class="info-box">
                <p style="margin: 0 0 10px 0;">
                  <strong>🚚 Tiempo estimado de entrega:</strong>
                </p>
                <p style="margin: 0; font-size: 18px; color: #d4af37;">
                  <strong>30 - 45 minutos</strong>
                </p>
              </div>
              
              <p>
                Puedes revisar el estado de tu pedido en cualquier momento desde tu cuenta en nuestra plataforma.
              </p>
              
              <p style="margin-top: 30px;">
                Gracias por tu preferencia,<br>
                <strong>El equipo de Raíces Restaurant</strong>
              </p>
            </div>
            
            <div class="footer">
              <p>
                © 2024 Raíces Restaurant<br>
                Experiencia Gastronómica Peruana
              </p>
              <p style="font-size: 12px; color: #999; margin-top: 15px;">
                Este correo fue enviado a ${destinatario}
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email de confirmación de pedido enviado:', info.messageId);
    console.log('   Destinatario:', destinatario);
    console.log('   Orden:', ordenId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Error al enviar email de confirmación:', error.message);
    return { success: false, error: error.message };
  }
};

// =====================================================
// VERIFICAR CONFIGURACIÓN
// =====================================================
export const verificarConfiguracion = async () => {
  try {
    await transporter.verify();
    return { 
      success: true, 
      message: 'Configuración de Brevo correcta',
      user: process.env.BREVO_USER
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
};

console.log('✅ Servicio de email configurado con Brevo');

export default transporter;