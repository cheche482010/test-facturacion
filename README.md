# Sistema de Facturación con Electron.js + MySQL

Un sistema completo de facturación desarrollado con Electron.js, Vue.js 3, y MySQL, diseñado para funcionar tanto en modo bodega como tienda.

## 🚀 Características Principales

### Modos de Operación
- **Modo Bodega**: Ventas rápidas sin registro de clientes, enfoque en inventario
- **Modo Tienda**: Funcionalidad completa con clientes, IVA, historiales y reportes avanzados

### Módulos Principales
- ✅ **Gestión de Productos**: Códigos, precios, stock, categorías
- ✅ **Inventario**: Control de stock, movimientos, alertas
- ✅ **Ventas**: Facturación, múltiples métodos de pago, tickets
- ✅ **Clientes**: Gestión completa (solo modo tienda)
- ✅ **Reportes**: Ventas, inventario, utilidades, dashboard
- ✅ **Configuración**: Empresa, impresoras, backup, usuarios
- ✅ **Backup**: Automático y manual, restauración

### Tecnologías Utilizadas
- **Frontend**: Vue.js 3 + Vuetify 3 + Pinia
- **Backend**: Node.js + Express + Sequelize
- **Base de Datos**: MySQL (con fallback a SQLite)
- **Desktop**: Electron.js
- **Estilos**: SCSS + Material Design

## 📋 Requisitos del Sistema

- **Node.js**: v16 o superior
- **MySQL**: v5.7 o superior (opcional, puede usar SQLite)
- **RAM**: Mínimo 4GB recomendado
- **Espacio**: 500MB libres

## 🛠️ Instalación

### Opción 1: Setup Automático (Recomendado)

1. **Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd sistema-facturacion
```

2. **Ejecutar setup automático**
```bash
npm run setup
```

Este comando automáticamente:
- ✅ Crea todos los directorios necesarios
- ✅ Copia `env.example` a `.env`
- ✅ Instala todas las dependencias
- ✅ Verifica MySQL
- ✅ Crea la base de datos
- ✅ Muestra instrucciones finales

### Opción 2: Instalación Manual

1. **Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd sistema-facturacion
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
# Copiar archivo de ejemplo
cp env.example .env

# Editar configuración
nano .env  # o usar tu editor preferido
```

4. **Configurar base de datos**
```bash
# Crear base de datos MySQL (opcional)
mysql -u root -p
CREATE DATABASE facturacion_db;
```

5. **Ejecutar en modo desarrollo**
```bash
npm run dev
```

6. **Construir para producción**
```bash
npm run dist
```

### 📋 Configuración del Archivo .env

El archivo `.env` contiene todas las configuraciones del sistema:

```env
# Configuración de base de datos
DB_TYPE=mysql                    # mysql o sqlite
DB_HOST=localhost
DB_PORT=3306
DB_NAME=facturacion_db
DB_USER=root
DB_PASSWORD=

# Configuración de seguridad
JWT_SECRET=tu_clave_secreta_muy_segura_aqui_cambiar_en_produccion

# Configuración de la empresa
COMPANY_NAME=Mi Empresa
COMPANY_RIF=J-12345678-9
OPERATION_MODE=tienda           # bodega o tienda

# Configuración de tasa de cambio
DOLAR_API_URL=https://ve.dolarapi.com/v1/dolares/oficial
MANUAL_EXCHANGE_RATE=35.50
```

**⚠️ IMPORTANTE**: 
- Cambia `JWT_SECRET` por una clave segura en producción
- Configura los datos de tu empresa
- Ajusta la configuración de base de datos según tu entorno

## 🏗️ Estructura del Proyecto

```
sistema-facturacion/
├── src/
│   ├── backend/           # Servidor Express
│   │   ├── config/        # Configuración BD
│   │   ├── models/        # Modelos Sequelize
│   │   ├── routes/        # Rutas API
│   │   ├── middleware/    # Middlewares
│   │   └── server.js      # Servidor principal
│   ├── stores/            # Stores Pinia
│   ├── views/             # Componentes Vue
│   ├── assets/            # Recursos estáticos
│   ├── App.vue            # Componente principal
│   └── main.js            # Entrada Vue
├── data/                  # Datos de la aplicación
├── dist/                  # Build de producción
├── electron/              # Archivos Electron
└── package.json
```

## 🔧 Configuración Inicial

### 1. Primer Inicio
Al iniciar por primera vez, el sistema:
- Creará la base de datos automáticamente
- Inicializará la configuración por defecto
- Creará un usuario administrador

### 2. Usuario por Defecto
```
Usuario: admin
Contraseña: admin123
```

### 3. Configuración del Negocio
Ir a **Configuración > Empresa** para configurar:
- Datos fiscales
- Información de contacto
- Configuración de facturación

## 📊 Funcionalidades por Módulo

### Gestión de Productos
- ✅ Códigos internos y de barras
- ✅ Precios automáticos (costo + %)
- ✅ Múltiples precios (detal, mayorista, USD)
- ✅ Control de stock
- ✅ Categorías y marcas
- ✅ Imágenes de productos

### Inventario
- ✅ Control de stock en tiempo real
- ✅ Movimientos (entradas, salidas, ajustes)
- ✅ Alertas de stock bajo
- ✅ Valorización de inventario
- ✅ Análisis de rotación

### Ventas
- ✅ Facturación rápida
- ✅ Múltiples métodos de pago
- ✅ Descuentos y promociones
- ✅ Impresión de tickets/facturas
- ✅ Ventas a crédito
- ✅ Cancelación y devoluciones

### Clientes (Modo Tienda)
- ✅ Fichas completas
- ✅ Historial de compras
- ✅ Límites de crédito
- ✅ Categorías (normal, preferencial, VIP)
- ✅ Pagos y saldos pendientes

### Reportes
- ✅ Dashboard en tiempo real
- ✅ Reportes de ventas por período
- ✅ Análisis de productos más vendidos
- ✅ Reportes de utilidades
- ✅ Estado de inventario
- ✅ Exportación a PDF/Excel

### Configuración
- ✅ Datos del negocio
- ✅ Configuración de impresoras
- ✅ Tasa de cambio automática
- ✅ Backup automático
- ✅ Gestión de usuarios y roles

## 🔐 Sistema de Permisos

### Roles Disponibles
- **Administrador**: Acceso completo
- **Cajero**: Ventas y reportes básicos
- **Inventario**: Gestión de productos e inventario
- **Vendedor**: Ventas y clientes

### Permisos por Recurso
- `products`: create, read, update, delete
- `inventory`: create, read, update, delete
- `sales`: create, read, update, delete
- `customers`: create, read, update, delete
- `reports`: read
- `config`: read, update
- `backup`: create, read, restore

## 🖨️ Impresión

### Tipos de Documentos
- **Tickets**: Para ventas rápidas
- **Facturas**: Con datos fiscales completos
- **Notas de crédito/débito**: Para devoluciones

### Configuración de Impresoras
- Detección automática de impresoras
- Configuración de ancho de papel
- Logo personalizado
- Códigos QR

## 💾 Backup y Restauración

### Backup Automático
- Programable (diario, semanal)
- Compresión automática
- Limpieza de backups antiguos
- Metadatos de respaldo

### Backup Manual
- Creación bajo demanda
- Descarga de archivos
- Restauración selectiva

## 🔄 API REST

### Endpoints Principales
```
POST   /api/auth/login          # Autenticación
GET    /api/products            # Listar productos
POST   /api/products            # Crear producto
GET    /api/sales               # Listar ventas
POST   /api/sales               # Crear venta
GET    /api/reports/sales       # Reporte de ventas
GET    /api/config              # Obtener configuración
```

### Autenticación
Todas las rutas requieren token JWT en el header:
```
Authorization: Bearer <token>
```

## 🚀 Comandos Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar en modo desarrollo
npm run dev:renderer     # Solo frontend
npm run dev:main         # Solo backend

# Construcción
npm run build            # Construir frontend
npm run build:electron   # Construir aplicación Electron
npm run dist             # Construir todo para distribución

# Utilidades
npm run lint             # Linter
npm run lint:fix         # Linter con auto-fix
npm test                 # Tests
```

## 📱 Características de Electron

### Funcionalidades del Sistema
- Integración con impresoras del sistema
- Acceso a archivos locales
- Notificaciones del sistema
- Auto-actualizaciones
- Modo offline

### Configuración de Ventana
- Tamaño mínimo: 1200x800
- Tamaño por defecto: 1400x900
- Modo desarrollador en desarrollo
- DevTools automático

## 🔧 Personalización

### Temas
Los colores se pueden personalizar en `src/assets/styles/main.scss`:
```scss
$color-primary: #1976D2;
$color-secondary: #424242;
$color-success: #4CAF50;
```

### Configuración de Base de Datos
Modificar `src/backend/config/database.js`:
```javascript
const dbConfig = {
  development: {
    username: 'root',
    password: '',
    database: 'sistema_facturacion',
    host: 'localhost',
    dialect: 'mysql'
  }
}
```

## 🐛 Solución de Problemas

### Error de Conexión a Base de Datos
1. Verificar que MySQL esté ejecutándose
2. Comprobar credenciales en `.env`
3. Crear base de datos manualmente si es necesario

### Error de Permisos
1. Verificar que el usuario tenga permisos de escritura en `/data`
2. Ejecutar como administrador si es necesario

### Problemas de Impresión
1. Verificar que las impresoras estén instaladas
2. Comprobar permisos de Electron
3. Reiniciar la aplicación

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📞 Soporte

Para soporte técnico o consultas:
- Crear un issue en GitHub
- Contactar al equipo de desarrollo
- Revisar la documentación técnica

## 🔄 Changelog

### v1.0.0 (2024-01-XX)
- ✅ Sistema base completo
- ✅ Gestión de productos e inventario
- ✅ Sistema de ventas
- ✅ Reportes básicos
- ✅ Configuración del sistema
- ✅ Backup y restauración

---

**Desarrollado con ❤️ para facilitar la gestión de negocios**
