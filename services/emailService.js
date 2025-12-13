// =====================================================
// PASO 1: Instalar Nodemailer
// =====================================================
// En la terminal, en la carpeta del backend:
// npm install nodemailer

// =====================================================
// PASO 2: Crear archivo services/emailService.js
// =====================================================

// services/emailService.js
import nodemailer from 'nodemailer';

// ✅ CONFIGURACIÓN DEL TRANSPORTADOR DE EMAIL
const transporter = nodemailer.createTransport({
  service: 'gmail', // Puedes usar: gmail, outlook, yahoo, etc.
  auth: {
    user: process.env.EMAIL_USER, // Tu correo
    pass: process.env.EMAIL_PASSWORD // Tu contraseña de aplicación
  }
});

// ✅ VERIFICAR CONEXIÓN (opcional pero recomendado)
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Error al conectar con el servidor de email:', error);
  } else {
    console.log('✅ Servidor de email listo para enviar mensajes');
  }
});

// =====================================================
// PLANTILLAS DE EMAIL
// =====================================================

// ✅ EMAIL DE BIENVENIDA
export const enviarEmailBienvenida = async (destinatario, nombreCompleto) => {
  try {
    const mailOptions = {
      from: {
        name: 'Raíces - Restaurante',
        address: process.env.EMAIL_USER
      },
      to: destinatario,
      subject: '¡Bienvenido a Raíces! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Arial', sans-serif;
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
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .welcome-text {
              font-size: 18px;
              margin-bottom: 20px;
              color: #2a2a2a;
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
            .feature-item:last-child {
              border-bottom: none;
            }
            .feature-icon {
              font-size: 20px;
              margin-right: 10px;
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
            .footer {
              text-align: center;
              padding: 20px;
              color: #666;
              font-size: 14px;
            }
            .social-links {
              margin: 20px 0;
            }
            .social-links a {
              margin: 0 10px;
              text-decoration: none;
              color: #d4af37;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🍽️ Raíces</h1>
            <p>Experiencia Gastronómica Peruana</p>
          </div>
          
          <div class="content">
            <p class="welcome-text">
              <strong>¡Hola ${nombreCompleto}!</strong>
            </p>
            
            <p>
              ¡Bienvenido a la familia Raíces! 🎉 Estamos emocionados de tenerte con nosotros.
            </p>
            
            <p>
              Tu cuenta ha sido creada exitosamente y ya puedes disfrutar de todos los beneficios:
            </p>
            
            <div class="features">
              <div class="feature-item">
                <span class="feature-icon">🛒</span>
                <strong>Pedidos Rápidos:</strong> Ordena tus platos favoritos en segundos
              </div>
              <div class="feature-item">
                <span class="feature-icon">📋</span>
                <strong>Historial:</strong> Revisa tus pedidos anteriores
              </div>
              <div class="feature-item">
                <span class="feature-icon">🚚</span>
                <strong>Delivery:</strong> Entrega rápida a toda Lima
              </div>
              <div class="feature-item">
                <span class="feature-icon">🎁</span>
                <strong>Promociones:</strong> Accede a ofertas exclusivas
              </div>
              <div class="feature-item">
                <span class="feature-icon">💳</span>
                <strong>Pagos Seguros:</strong> Múltiples métodos de pago
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
          </div>
          
          <div class="footer">
            <div class="social-links">
              <a href="#">Facebook</a> |
              <a href="#">Instagram</a> |
              <a href="#">Twitter</a>
            </div>
            <p>
              © 2025 Raíces - Todos los derechos reservados<br>
              Lima, Perú
            </p>
            <p style="font-size: 12px; color: #999;">
              Este correo fue enviado a ${destinatario}<br>
              Si no creaste esta cuenta, por favor ignora este mensaje.
            </p>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de bienvenida enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Error al enviar email de bienvenida:', error);
    return { success: false, error: error.message };
  }
};

// ✅ EMAIL DE CONFIRMACIÓN DE PEDIDO
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
      // ✅ Obtener el nombre del producto correctamente
      const nombreProducto = item.nombre || item.producto_nombre || item.titulo || 'Producto';
      const precioUnitario = parseFloat(item.precio_unitario || item.precio || 0);
      const cantidad = parseInt(item.cantidad || 1);
      const subtotal = cantidad * precioUnitario;
      
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            ${nombreProducto}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
            ${cantidad}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
            S/ ${precioUnitario.toFixed(2)}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
            S/ ${subtotal.toFixed(2)}
          </td>
        </tr>
      `;
    }).join('');

    const mailOptions = {
      from: {
        name: 'Raíces - Restaurante',
        address: process.env.EMAIL_USER
      },
      to: destinatario,
      subject: `Pedido Confirmado #${ordenId} - Raíces 🎉`,
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
            }
            .order-info {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .order-number {
              font-size: 24px;
              color: #d4af37;
              font-weight: bold;
              text-align: center;
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
            .footer {
              text-align: center;
              padding: 20px;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>✅ Pedido Confirmado</h1>
            <p>¡Gracias por tu compra!</p>
          </div>
          
          <div class="content">
            <p><strong>Hola ${nombreCliente},</strong></p>
            
            <p>
              Tu pedido ha sido confirmado y está siendo preparado con mucho cariño.
            </p>
            
            <div class="order-number">
              Orden #${ordenId}
            </div>
            
            <div class="order-info">
              <p><strong>Comprobante:</strong> ${numeroComprobante}</p>
              <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-PE')}</p>
              
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
                    <td style="padding: 15px; text-align: right;">S/ ${parseFloat(total).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <p style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #d4af37;">
              <strong>🚚 Tiempo estimado de entrega:</strong> 30-45 minutos
            </p>
            
            <p>
              Puedes revisar el estado de tu pedido en cualquier momento desde tu cuenta.
            </p>
          </div>
          
          <div class="footer">
            <p>© 2025 Raíces - Experiencia Gastronómica</p>
            <p style="font-size: 12px; color: #999;">
              Este correo fue enviado a ${destinatario}
            </p>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de confirmación de pedido enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Error al enviar email de confirmación:', error);
    return { success: false, error: error.message };
  }
};

// ✅ EMAIL DE RECUPERACIÓN DE CONTRASEÑA (para futuro)
export const enviarEmailRecuperacion = async (destinatario, nombreCompleto, token) => {
  try {
    const resetLink = `https://raices-front-nine.vercel.app/reset-password.html?token=${token}`;
    
    const mailOptions = {
      from: {
        name: 'Raíces - Restaurante',
        address: process.env.EMAIL_USER
      },
      to: destinatario,
      subject: 'Recuperación de Contraseña - Raíces',
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
            .reset-button {
              display: inline-block;
              background: #d4af37;
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .warning {
              background: #fff3cd;
              padding: 15px;
              border-radius: 5px;
              border-left: 4px solid #ffc107;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔐 Recuperación de Contraseña</h1>
          </div>
          
          <div class="content">
            <p><strong>Hola ${nombreCompleto},</strong></p>
            
            <p>
              Recibimos una solicitud para restablecer la contraseña de tu cuenta.
            </p>
            
            <center>
              <a href="${resetLink}" class="reset-button">
                Restablecer Contraseña
              </a>
            </center>
            
            <div class="warning">
              <strong>⏰ Este enlace expira en 1 hora</strong>
            </div>
            
            <p>
              Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
              Tu contraseña no será modificada.
            </p>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
              <a href="${resetLink}">${resetLink}</a>
            </p>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de recuperación enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Error al enviar email de recuperación:', error);
    return { success: false, error: error.message };
  }
};

console.log('✅ Servicio de email configurado');

export default transporter;