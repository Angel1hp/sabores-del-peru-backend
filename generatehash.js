// generateHash.js
import bcrypt from 'bcrypt';

const password = 'admin'; // La contraseña que quieres hashear

console.log('\n🔐 Generando hash de contraseña...\n');
console.log(`Contraseña: "${password}"`);

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
  
  console.log('\n✅ Hash generado:\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(hash);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('📋 Copia este hash y úsalo en tu SQL\n');
  
  // Verificar que funciona
  bcrypt.compare(password, hash, (err, result) => {
    if (result) {
      console.log('✅ Verificación exitosa!\n');
    }
    process.exit(0);
  });
});