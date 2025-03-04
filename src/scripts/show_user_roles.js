// Script para mostrar los roles de usuario en formato amigable
console.log('\n==================================================');
console.log('ROLES DE USUARIO EN LA APLICACIÓN');
console.log('==================================================');

const roles = {
  'client': '👤 CLIENTE - El usuario que solicita los servicios',
  'queuer': '👷 REPRESENTANTE - El usuario que ofrece servicios de representación',
  'admin': '🔑 ADMINISTRADOR - El usuario con acceso completo al sistema'
};

// Mostrar cada rol con su descripción
Object.entries(roles).forEach(([role, description]) => {
  console.log(`\n${description}`);
  console.log('--------------------------------------------------');
});

console.log('\nUsuarios de demostración creados:');
console.log('--------------------------------------------------');
console.log('✅ cliente@ejemplo.com - Cliente123! - ROL: Cliente');
console.log('✅ rep1@ejemplo.com - Representante1! - ROL: Representante');
console.log('✅ rep2@ejemplo.com - Representante2! - ROL: Representante');
console.log('✅ rep3@ejemplo.com - Representante3! - ROL: Representante');
console.log('✅ admin@ejemplo.com - Admin123! - ROL: Administrador');
console.log('\n=================================================='); 