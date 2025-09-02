#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Configurando Sistema de Facturación...\n');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step) {
  log(`\n📋 ${step}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Función para crear directorios
function createDirectories() {
  logStep('Creando directorios necesarios...');
  
  const dirs = [
    'database',
    'backups',
    'logs',
    'temp',
    'temp/reports',
    'src/assets/images',
    'src/components',
    'src/views',
    'src/stores',
    'src/utils',
    'src/services'
  ];

  dirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      logSuccess(`Directorio creado: ${dir}`);
    } else {
      logWarning(`Directorio ya existe: ${dir}`);
    }
  });
}

// Función para verificar si existe .env
function checkEnvFile() {
  logStep('Verificando archivo de variables de entorno...');
  
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), 'env.example');
  
  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      logSuccess('Archivo .env creado desde env.example');
      logWarning('⚠️  IMPORTANTE: Edita el archivo .env con tus configuraciones específicas');
    } else {
      logError('No se encontró env.example. Crea manualmente el archivo .env');
    }
  } else {
    logSuccess('Archivo .env ya existe');
  }
}

// Función para instalar dependencias
function installDependencies() {
  logStep('Instalando dependencias...');
  
  try {
    log('Instalando dependencias de Node.js...', 'yellow');
    execSync('npm install', { stdio: 'inherit' });
    logSuccess('Dependencias instaladas correctamente');
  } catch (error) {
    logError('Error al instalar dependencias');
    logError(error.message);
    process.exit(1);
  }
}

// Función para verificar MySQL
function checkMySQL() {
  logStep('Verificando MySQL...');
  
  try {
    execSync('mysql --version', { stdio: 'pipe' });
    logSuccess('MySQL está instalado');
  } catch (error) {
    logWarning('MySQL no está instalado o no está en el PATH');
    logWarning('Puedes usar SQLite como alternativa configurando DB_TYPE=sqlite en .env');
  }
}

// Función para crear base de datos
function createDatabase() {
  logStep('Creando base de datos...');
  
  try {
    // Cargar variables de entorno
    require('dotenv').config();
    
    const dbType = process.env.DB_TYPE || 'mysql';
    const dbName = process.env.DB_NAME || 'facturacion_db';
    
    if (dbType === 'mysql') {
      const dbUser = process.env.DB_USER || 'root';
      const dbPassword = process.env.DB_PASSWORD || 'root';
      
      const command = dbPassword 
        ? `mysql -u ${dbUser} -p${dbPassword} -e "CREATE DATABASE IF NOT EXISTS ${dbName};"`
        : `mysql -u ${dbUser} -e "CREATE DATABASE IF NOT EXISTS ${dbName};"`;
      
      execSync(command, { stdio: 'pipe' });
      logSuccess(`Base de datos MySQL '${dbName}' creada/verificada`);
    } else {
      logSuccess('Configurado para usar SQLite');
    }
  } catch (error) {
    logWarning('No se pudo crear la base de datos automáticamente');
    logWarning('Crea manualmente la base de datos o usa SQLite');
  }
}

// Función para mostrar instrucciones finales
function showFinalInstructions() {
  logStep('Instrucciones finales');
  
  log('\n🎉 ¡Configuración completada!', 'green');
  log('\n📝 Próximos pasos:', 'bright');
  log('1. Edita el archivo .env con tus configuraciones', 'yellow');
  log('2. Configura la base de datos (MySQL o SQLite)', 'yellow');
  log('3. Ejecuta: npm run dev', 'yellow');
  log('4. Accede a la aplicación en: http://localhost:3000', 'yellow');
  
  log('\n🔧 Configuración importante:', 'bright');
  log('- JWT_SECRET: Cambia por una clave segura', 'yellow');
  log('- DB_*: Configura tu base de datos', 'yellow');
  log('- COMPANY_*: Datos de tu empresa', 'yellow');
  
  log('\n📚 Documentación:', 'bright');
  log('- README.md: Documentación completa', 'yellow');
  log('- env.example: Todas las variables disponibles', 'yellow');
  
  log('\n🚀 Comandos útiles:', 'bright');
  log('npm run dev          - Desarrollo', 'yellow');
  log('npm run build        - Construir aplicación', 'yellow');
  log('npm run dist         - Crear ejecutable', 'yellow');
  
  log('\n💡 Soporte:', 'bright');
  log('Si tienes problemas, revisa los logs en ./logs', 'yellow');
}

// Función principal
async function main() {
  try {
    log('🎯 Sistema de Facturación - Setup Inicial', 'bright');
    log('==========================================', 'bright');
    
    createDirectories();
    checkEnvFile();
    installDependencies();
    checkMySQL();
    createDatabase();
    showFinalInstructions();
    
    log('\n✨ ¡Setup completado exitosamente!', 'green');
    
  } catch (error) {
    logError('Error durante el setup:');
    logError(error.message);
    process.exit(1);
  }
}

// Ejecutar setup
if (require.main === module) {
  main();
}

module.exports = {
  createDirectories,
  checkEnvFile,
  installDependencies,
  checkMySQL,
  createDatabase
};
