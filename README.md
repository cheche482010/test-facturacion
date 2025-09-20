# Sistema de Facturación Electron

Sistema completo de facturación y gestión de inventario desarrollado con Electron.js, Vue.js 3, y soporte para MySQL/SQLite. Diseñado para funcionar como aplicación de escritorio con dos modos de operación: **Modo Bodega** (ventas rápidas) y **Modo Tienda** (funcionalidad completa con clientes y reportes).

## 🚀 Características Principales

- **Gestión de Productos**: Catálogo completo con códigos de barras, precios automáticos y control de inventario
- **Ventas Inteligentes**: Procesamiento rápido con múltiples métodos de pago
- **Control de Inventario**: Seguimiento en tiempo real con alertas de stock bajo
- **Reportes y Analytics**: Dashboard completo con gráficos y estadísticas
- **Autenticación**: Sistema de usuarios con roles (Administrador, Cajero)
- **Modo Dual**: Bodega (sin clientes) y Tienda (con clientes y facturación completa)
- **Base de Datos Flexible**: Soporte para MySQL y SQLite

## 📋 Requisitos del Sistema

- **Node.js** v16 o superior
- **MySQL** v8.0 o superior (opcional, puede usar SQLite)
- **Windows** 10/11 (para generar .exe)
- **RAM**: Mínimo 4GB recomendado
- **Espacio**: 500MB libres

## 🛠️ Instalación

### 1. Clonar el Repositorio
\`\`\`bash
git clone <url-del-repositorio>
cd electron-billing-system
\`\`\`

### 2. Instalar Dependencias
\`\`\`bash
npm install
\`\`\`

### 3. Configurar Base de Datos

El sistema soporta dos tipos de base de datos que puedes configurar mediante variables de entorno:

#### Opción A: MySQL (Recomendado para Producción)

**Crear Base de Datos MySQL:**
\`\`\`sql
CREATE DATABASE facturacion_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'billing_user'@'localhost' IDENTIFIED BY 'tu_password_seguro';
GRANT ALL PRIVILEGES ON facturacion_db.* TO 'billing_user'@'localhost';
FLUSH PRIVILEGES;
\`\`\`

#### Opción B: SQLite (Más Simple, para Desarrollo)

No requiere instalación adicional. La base de datos se creará automáticamente en `data/database.sqlite`.

### 4. Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

#### Para MySQL:
\`\`\`env
# Tipo de Base de Datos (mysql o sqlite)
DB_TYPE=mysql

# Configuración MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=facturacion_db
DB_USER=billing_user
DB_PASSWORD=tu_password_seguro

# Autenticación
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui

# Servidor
PORT=3001
NODE_ENV=development
\`\`\`

#### Para SQLite:
\`\`\`env
# Tipo de Base de Datos (mysql o sqlite)
DB_TYPE=sqlite

# Autenticación
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui

# Servidor
PORT=3001
NODE_ENV=development
\`\`\`

### 5. Inicializar Base de Datos
\`\`\`bash
npm run db:setup
\`\`\`

Este comando creará las tablas y datos iniciales incluyendo:
- Usuario administrador por defecto: `admin@sistema.com` / `admin123`
- Categorías básicas de productos
- Configuración inicial del sistema

## 🚀 Ejecución

### Modo Desarrollo
\`\`\`bash
# Iniciar en modo desarrollo (con hot reload)
npm run dev
\`\`\`

### Modo Producción
\`\`\`bash
# Construir la aplicación
npm run build

# Ejecutar aplicación construida
npm start
\`\`\`

### Generar Ejecutable (.exe)
\`\`\`bash
# Generar instalador para Windows
npm run build:win

# El archivo .exe se generará en la carpeta /dist
\`\`\`

## 📱 Uso del Sistema

### Primer Inicio

1. **Login Inicial**:
   - Usuario: `admin@sistema.com`
   - Contraseña: `admin123`

2. **Configuración Inicial**:
   - Ir a **Configuración** → **Sistema**
   - Configurar datos de la empresa
   - Seleccionar modo de operación (Bodega/Tienda)
   - Configurar impresoras y hardware

### Flujo de Trabajo Típico

#### Modo Bodega (Ventas Rápidas)
1. **Productos** → Agregar productos al catálogo
2. **Ventas** → Procesar ventas sin registro de clientes
3. **Inventario** → Monitorear stock y movimientos

#### Modo Tienda (Completo)
1. **Clientes** → Registrar base de clientes
2. **Productos** → Gestión completa con precios diferenciados
3. **Ventas** → Facturación con IVA y documentos fiscales
4. **Reportes** → Analytics completos y reportes fiscales

## 🔧 Comandos Disponibles

\`\`\`bash
# Desarrollo
npm run dev              # Modo desarrollo con hot reload
npm run dev:vue          # Solo frontend (Vue.js)
npm run dev:electron     # Solo backend (Electron main)

# Construcción
npm run build            # Construir aplicación completa
npm run build:vue        # Construir solo frontend
npm run build:electron   # Construir solo backend

# Base de Datos
npm run db:setup         # Configurar BD y datos iniciales
npm run db:seed          # Insertar datos de prueba
npm run db:reset         # Resetear base de datos completamente

# Distribución
npm run build            # Generar ejecutable
\`\`\`

## 🗄️ Configuración de Base de Datos

### Cambiar Tipo de Base de Datos

Para cambiar entre MySQL y SQLite, simplemente modifica la variable `DB_TYPE` en tu archivo `.env`:

\`\`\`env
# Para usar MySQL
DB_TYPE=mysql

# Para usar SQLite
DB_TYPE=sqlite
\`\`\`

### Ventajas de Cada Opción

**MySQL:**
- ✅ Mejor rendimiento con grandes volúmenes de datos
- ✅ Soporte para múltiples usuarios concurrentes
- ✅ Funciones avanzadas de base de datos
- ❌ Requiere instalación y configuración adicional

**SQLite:**
- ✅ Configuración cero, funciona inmediatamente
- ✅ Archivo único, fácil de respaldar
- ✅ Ideal para desarrollo y pruebas
- ❌ Limitado para uso concurrente intensivo

## 📁 Estructura del Proyecto

\`\`\`
electron-billing-system/
├── src/
│   ├── main/                 # Proceso principal Electron
│   │   ├── database/         # Modelos y configuración BD
│   │   ├── routes/           # API REST endpoints
│   │   ├── middleware/       # Middleware de autenticación
│   │   └── main.js           # Punto de entrada Electron
│   └── renderer/             # Frontend Vue.js
│       ├── components/       # Componentes reutilizables
│       ├── views/            # Vistas principales
│       ├── stores/           # Estado global (Pinia)
│       └── router/           # Configuración de rutas
├── public/                   # Archivos estáticos
├── dist/                     # Aplicación construida
└── build/                    # Configuración de construcción
\`\`\`

## 🔒 Seguridad

- **Autenticación JWT**: Tokens seguros con expiración
- **Roles de Usuario**: Control de acceso granular
- **Validación de Datos**: Sanitización en frontend y backend
- **Backup Automático**: Respaldos programados de la BD
- **Logs de Auditoría**: Registro completo de operaciones

## 🛠️ Solución de Problemas

### Error de Conexión a Base de Datos
\`\`\`bash
# Verificar que MySQL esté ejecutándose
mysql -u billing_user -p facturacion_db

# Verificar variables de entorno
cat .env
\`\`\`

### Problemas de Permisos
\`\`\`bash
# Ejecutar como administrador en Windows
# Verificar permisos de carpeta de instalación
\`\`\`

### Error al Generar .exe
\`\`\`bash
# Limpiar cache y reconstruir
npm run clean
npm install
npm run build:win
\`\`\`

### Rendimiento Lento
- Verificar que la BD tenga índices apropiados
- Revisar logs en `logs/application.log`
- Monitorear uso de memoria en Task Manager

## 📞 Soporte

Para soporte técnico o reportar bugs:

1. **Logs del Sistema**: Ubicados en `logs/`
2. **Base de Datos**: Backup automático en `backups/`
3. **Configuración**: Archivo `.env` y `config/`

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

## 🔄 Actualizaciones

Para actualizar el sistema:

1. Hacer backup de la base de datos
2. Descargar nueva versión
3. Ejecutar `npm install`
4. Ejecutar `npm run db:migrate`
5. Reiniciar la aplicación

---

**Desarrollado con ❤️ usando Electron.js + Vue.js + MySQL/SQLite**
