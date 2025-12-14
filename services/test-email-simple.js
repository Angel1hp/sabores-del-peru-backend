// test-email-simple.js
// Script simple para probar si tus credenciales de Gmail funcionan

import nodemailer from 'nodemailer';

console.log('\n═══════════════════════════════════════════════════');
console.log('🧪 TEST DE CREDENCIALES DE EMAIL');
console.log('═══════════════════════════════════════════════════\n');

// ✅ CONFIGURA TUS CREDENCIALES AQUÍ
const EMAIL_USER = 'angelhuaman55555@gmail.com';        // ⬅️ CAMBIA ESTO
const EMAIL_PASSWORD = 'vtvikoysdruhbabk';  // ⬅️ CAMBIA ESTO

console.log('📧 Email configurado:', EMAIL_USER);
console.log('🔐 Password length:', EMAIL_PASSWORD.length, 'caracteres');
console.log('\n⏳ Creando transportador...\n');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD
  }
});

// Verificar conexión
console.log('🔍 Verificando conexión con Gmail...\n');

transporter.verify((error, success) => {
  if (error) {
    console.log('═══════════════════════════════════════════════════');
    console.log('❌ ERROR DE CONEXIÓN');
    console.log('═══════════════════════════════════════════════════\n');
    console.log('Error:', error.message);
    console.log('\n📋 POSIBLES CAUSAS:\n');
    
    if (error.message.includes('Invalid login')) {
      console.log('  1. ❌ Contraseña incorrecta');
      console.log('  2. ❌ No usaste contraseña de aplicación');
      console.log('  3. ❌ La verificación en 2 pasos no está activa\n');
      console.log('✅ SOLUCIÓN:');
      console.log('  1. Ve a: https://myaccount.google.com/apppasswords');
      console.log('  2. Genera una nueva contraseña de aplicación');
      console.log('  3. Copia la contraseña SIN espacios');
      console.log('  4. Actualiza EMAIL_PASSWORD en este archivo\n');
    } else if (error.message.includes('Missing credentials')) {
      console.log('  1. ❌ EMAIL_USER o EMAIL_PASSWORD vacíos\n');
      console.log('✅ SOLUCIÓN:');
      console.log('  Configura EMAIL_USER y EMAIL_PASSWORD en este archivo\n');
    } else {
      console.log('  Error desconocido. Verifica tu conexión a internet.\n');
    }
    
    process.exit(1);
  } else {
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ CONEXIÓN EXITOSA');
    console.log('═══════════════════════════════════════════════════\n');
    console.log('🎉 Las credenciales son correctas!\n');
    console.log('📧 Enviando email de prueba...\n');
    
    // Enviar email de prueba
    const mailOptions = {
      from: EMAIL_USER,
      to: EMAIL_USER, // Te lo envías a ti mismo
      subject: '✅ Prueba exitosa - Raíces Restaurant',
      html: `
        <div style="font-family: Arial; padding: 20px; max-width: 600px; margin: 0 auto;">
          <div style="background: #22c55e; color: white; padding: 20px; border-radius: 10px; text-align: center;">
            <h1>✅ ¡Funciona!</h1>
          </div>
          <div style="background: #f9f9f9; padding: 20px; margin-top: 10px; border-radius: 10px;">
            <p><strong>Excelente noticia:</strong></p>
            <p>Tus credenciales de Gmail funcionan correctamente.</p>
            <p>Ahora puedes configurarlas en Render:</p>
            <ul>
              <li>EMAIL_USER: ${EMAIL_USER}</li>
              <li>EMAIL_PASSWORD: ${EMAIL_PASSWORD}</li>
            </ul>
            <p><strong>Próximos pasos:</strong></p>
            <ol>
              <li>Ve a Render → Environment</li>
              <li>Agrega estas variables</li>
              <li>Haz "Manual Deploy"</li>
              <li>¡Listo! Los emails funcionarán</li>
            </ol>
          </div>
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>Email de prueba del sistema Raíces Restaurant</p>
          </div>
        </div>
      `
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('═══════════════════════════════════════════════════');
        console.log('❌ ERROR AL ENVIAR EMAIL');
        console.log('═══════════════════════════════════════════════════\n');
        console.log('Error:', error.message);
        console.log('\nLa conexión funciona pero no se pudo enviar el email.\n');
      } else {
        console.log('═══════════════════════════════════════════════════');
        console.log('✅ EMAIL ENVIADO EXITOSAMENTE');
        console.log('═══════════════════════════════════════════════════\n');
        console.log('📬 Revisa tu bandeja de entrada:', EMAIL_USER);
        console.log('📨 Message ID:', info.messageId);
        console.log('\n🎯 SIGUIENTE PASO:');
        console.log('  Agrega estas variables en Render → Environment:\n');
        console.log('  EMAIL_USER=' + EMAIL_USER);
        console.log('  EMAIL_PASSWORD=' + EMAIL_PASSWORD);
        console.log('\n═══════════════════════════════════════════════════\n');
      }
    });
  }
});