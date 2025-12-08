# Sistema de Facturación Electrónica

Sistema completo de facturación y gestión de inventario desarrollado con **Electron.js**, **Vue.js 3**, **Sequelize ORM** y **SQLite/MySQL**. Diseñado como aplicación de escritorio nativa con interfaz moderna y funcionalidades completas para la gestión de pequeños y medianos negocios.

## 🚀 Características Principales

### 💰 Gestión de Ventas
- **Punto de Venta (POS)**: Interfaz intuitiva para procesamiento rápido de ventas
- **Múltiples Métodos de Pago**: Efectivo (VES/USD), Transferencia, POS, Pago Móvil, Crédito
- **Cálculo Automático**: Conversión automática entre bolívares y dólares
- **Recibos y Facturas**: Generación automática de comprobantes
- **Historial de Ventas**: Seguimiento completo de todas las transacciones

### 📦 Control de Inventario
- **Catálogo de Productos**: Gestión completa con códigos internos, códigos de barras, colores y categorías
- **Control de Stock**: Seguimiento en tiempo real con alertas de stock bajo
- **Movimientos de Inventario**: Registro de entradas, salidas, ajustes y devoluciones
- **Precios Dinámicos**: Costo, precio de venta y precio en dólares
- **Imágenes de Productos**: Soporte para subir y gestionar imágenes

### 👥 Gestión de Usuarios
- **Sistema de Roles**: Administrador, Cajero y Desarrollador
- **Autenticación JWT**: Seguridad robusta con tokens de acceso
- **Control de Acceso**: Permisos granulares por rol
- **Auditoría**: Registro de actividades y cambios

### 📊 Reportes y Analytics
- **Dashboard Ejecutivo**: Métricas en tiempo real y gráficos interactivos
- **Reportes de Ventas**: Por período, producto, categoría y método de pago
- **Reportes de Inventario**: Movimientos, stock actual y ajustes
- **Conciliación de Caja**: Control diario de ingresos y egresos
- **Exportación**: Reportes en PDF y Excel

### ⚙️ Configuración Avanzada
- **Tasa de Cambio**: Actualización automática del dólar (cada 6 horas)
- **Configuración del Sistema**: Personalización completa de colores, fuentes y branding
- **Métodos de Pago**: Configuración flexible de opciones de pago
- **Categorías**: Estructura jerárquica de categorías de productos

## 📋 Requisitos del Sistema

- **Node.js**: v16.0.0 o superior
- **Base de Datos**: SQLite (incluido) o MySQL v8.0+
- **Sistema Operativo**: Windows 10/11, macOS, Linux
- **Memoria RAM**: Mínimo 4GB recomendado
- **Espacio en Disco**: 500MB libres

## 🛠️ Tecnologías Utilizadas

### Backend (Electron Main Process)
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web para APIs REST
- **Sequelize ORM** - Mapeo objeto-relacional para bases de datos
- **SQLite3** - Base de datos embebida (por defecto)
- **MySQL2** - Driver para MySQL
- **JWT** - Autenticación basada en tokens
- **bcryptjs** - Encriptación de contraseñas

### Frontend (Electron Renderer Process)
- **Vue.js 3** - Framework progresivo de JavaScript
- **Vite** - Build tool y dev server ultrarrápido
- **Vuetify 3** - Framework de componentes Material Design
- **Pinia** - State management para Vue
- **Vue Router** - Enrutamiento oficial para Vue
- **TailwindCSS** - Framework CSS utility-first
- **Sass/SCSS** - Preprocesador CSS

### Librerías Adicionales
- **Electron** - Framework para aplicaciones de escritorio
- **jspdf** - Generación de PDFs
- **xlsx** - Manejo de archivos Excel
- **multer** - Upload de archivos
- **cors** - Middleware para CORS
- **concurrently** - Ejecución de comandos en paralelo

## 📁 Estructura del Proyecto

```
test-facturacion/
├── data/                          # Base de datos SQLite
│   └── database.sqlite
├── uploads/                       # Archivos subidos
│   └── products/                  # Imágenes de productos
├── src/
│   ├── main/                      # Proceso principal Electron
│   │   ├── controllers/           # Controladores de la API
│   │   │   ├── authController.js
│   │   │   ├── cashReconciliationController.js
│   │   │   ├── categoriesController.js
│   │   │   ├── currencyController.js
│   │   │   ├── inventoryController.js
│   │   │   ├── productsController.js
│   │   │   ├── reportsController.js
│   │   │   ├── salesController.js
│   │   │   ├── settingsController.js
│   │   │   └── usersController.js
│   │   ├── database/              # Configuración de BD
│   │   │   ├── connection.js      # Conexión Sequelize
│   │   │   ├── create.js          # Creación de BD
│   │   │   ├── migrate.js         # Migraciones
│   │   │   ├── reset.js           # Reset de BD
│   │   │   ├── setup.js           # Configuración inicial
│   │   │   ├── verify.js          # Verificación de BD
│   │   │   ├── models/            # Modelos Sequelize
│   │   │   │   ├── index.js        # Registro de modelos
│   │   │   │   ├── User.js
│   │   │   │   ├── Category.js
│   │   │   │   ├── Product.js
│   │   │   │   ├── Sale.js
│   │   │   │   ├── SaleItem.js
│   │   │   │   ├── SalePayment.js
│   │   │   │   ├── PaymentMethod.js
│   │   │   │   ├── InventoryMovement.js
│   │   │   │   ├── CashReconciliation.js
│   │   │   │   ├── DolarRate.js
│   │   │   │   └── Settings.js
│   │   │   └── seeders/           # Datos de prueba
│   │   │       ├── index.js        # Ejecutor de seeders
│   │   │       ├── userSeeder.js
│   │   │       ├── categorySeeder.js
│   │   │       ├── productSeeder.js
│   │   │       ├── paymentMethodSeeder.js
│   │   │       ├── settingsSeeder.js
│   │   │       ├── dolarRateSeeder.js
│   │   │       ├── saleSeeder.js
│   │   │       └── cashReconciliationSeeder.js
│   │   ├── middleware/            # Middleware
│   │   │   └── auth.js            # Autenticación JWT
│   │   ├── routes/                # Endpoints de la API
│   │   │   ├── auth.js
│   │   │   ├── cashReconciliation.js
│   │   │   ├── categories.js
│   │   │   ├── currency.js
│   │   │   ├── inventory.js
│   │   │   ├── paymentMethods.js
│   │   │   ├── products.js
│   │   │   ├── reports.js
│   │   │   ├── sales.js
│   │   │   ├── settings.js
│   │   │   └── users.js
│   │   ├── services/              # Servicios de negocio
│   │   │   ├── CashReconciliationService.js
│   │   │   ├── currencyService.js
│   │   │   └── dolarService.js
│   │   ├── main.js                # Punto de entrada Electron
│   │   ├── preload.js             # Puente entre main y renderer
│   │   └── server.js              # Servidor Express
│   └── renderer/                  # Frontend Vue.js
│       ├── App.vue                # Componente raíz
│       ├── main.js                # Punto de entrada Vue
│       ├── assets/                # Recursos estáticos
│       │   ├── styles/            # Estilos globales
│       │   │   ├── main.scss
│       │   │   ├── _variables.scss
│       │   │   └── _mixins.scss
│       ├── components/            # Componentes reutilizables
│       │   ├── inventory/
│       │   ├── products/
│       │   └── sales/
│       ├── router/                # Configuración de rutas
│       │   └── index.js
│       ├── services/              # Servicios frontend
│       │   ├── api.js             # Cliente HTTP
│       │   └── cashReconciliationService.js
│       ├── stores/                # Estado global (Pinia)
│       │   ├── app.js
│       │   ├── auth.js
│       │   ├── cashReconciliation.js
│       │   ├── categories.js
│       │   ├── currencyStore.js
│       │   ├── inventory.js
│       │   ├── products.js
│       │   ├── reports.js
│       │   ├── sales.js
│       │   ├── settingsStore.js
│       │   └── users.js
│       ├── utils/                 # Utilidades
│       │   └── formatters.js
│       └── views/                 # Vistas principales
│           ├── auth/
│           │   ├── Login.vue
│           │   ├── Login.js
│           │   └── Login.scss
│           ├── Calculator/
│           ├── Dashboard/
│           ├── cash-count/
│           ├── cash-reconciliation/
│           ├── inventory/
│           ├── products/
│           ├── reports/
│           ├── sales/
│           ├── settings/
│           └── users/
├── .env                           # Variables de entorno
├── .gitignore                     # Archivos ignorados por Git
├── index.html                     # Template HTML principal
├── package.json                   # Dependencias y scripts
├── package-lock.json              # Lock de dependencias
├── README.md                      # Este archivo
└── vite.config.js                 # Configuración de Vite
```

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio
```bash
git clone <url-del-repositorio>
cd test-facturacion
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Base de Datos (SQLite por defecto)
DB_TYPE=sqlite

# Autenticación
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui

# Servidor
PORT=3001
NODE_ENV=development

# Opcional: Configuración MySQL (si se usa DB_TYPE=mysql)
# DB_HOST=localhost
# DB_PORT=3306
# DB_NAME=facturacion
# DB_USER=tu_usuario
# DB_PASSWORD=tu_password
```

### 4. Instalar el Sistema

Tienes dos opciones para instalar el sistema:

#### Opción A: Instalación Completa Automática (Recomendada)

Esta opción instala todo el sistema desde cero automáticamente:

```bash
# Instalar completamente desde cero (borra BD existente)
npm run db:reset

# O instalar sin borrar datos existentes (solo si BD no existe)
npm run install:full
```

Estos comandos:
- Crean la base de datos (si no existe)
- Ejecutan todas las migraciones
- Insertan datos de prueba
- Verifican la instalación

#### Opción B: Instalación Paso a Paso (Manual)

Si prefieres controlar cada paso:

```bash
# 1. Crear base de datos
npm run db:create

# 2. Ejecutar migraciones
npm run db:migrate

# 3. Ejecutar seeders (datos de prueba)
npm run db:seed

# 4. Verificar instalación
npm run db:verify
```

## 🎯 Uso del Sistema

### Inicio del Sistema

```bash
# Modo desarrollo (recomendado para desarrollo)
# Inicia Vue.js + Electron sin ejecutar seeders automáticamente
npm run dev

# Instalación completa + inicio automático
npm run dev:install

# Modo producción
npm run build
npm start
```

### Usuarios de Prueba

Después de la instalación, puedes acceder con estos usuarios:

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | admin123 | Administrador |
| cajero | cajero123 | Cajero |
| dev | dev123 | Desarrollador |

### Funcionalidades Principales

#### 🏪 Punto de Venta
- **Nueva Venta**: `Ctrl+N` o menú Archivo → Nueva Venta
- **Escáner de Códigos**: Soporte para lectores de códigos de barras
- **Cálculo Automático**: Conversión VES/USD en tiempo real
- **Múltiples Pagos**: Combinar diferentes métodos de pago

#### 📦 Gestión de Productos
- **Catálogo**: Agregar, editar y eliminar productos
- **Categorías**: Organización jerárquica de productos
- **Códigos de Barras**: Generación automática
- **Imágenes**: Upload de fotos de productos

#### 📊 Reportes
- **Dashboard**: Vista general con métricas clave
- **Ventas**: Reportes por fecha, producto y método de pago
- **Inventario**: Movimientos y niveles de stock
- **Finanzas**: Análisis de ingresos y conciliación

## 🔧 Comandos Disponibles

### Desarrollo
```bash
npm run dev              # Inicia modo desarrollo (Vue + Electron, sin seeders)
npm run dev:install      # Instalación completa + inicio automático
npm run install:full     # Solo instalación completa (sin iniciar)
npm run dev:vue          # Solo servidor de desarrollo Vue
npm run dev:electron     # Solo proceso Electron
npm run preview          # Vista previa de producción
```

### Base de Datos
```bash
npm run db:create        # Crear base de datos
npm run db:migrate       # Ejecutar migraciones
npm run db:seed          # Insertar datos de prueba
npm run db:seed:users    # Solo usuarios de prueba
npm run db:seed:categories    # Solo categorías
npm run db:seed:products      # Solo productos
npm run db:seed:payment-methods  # Solo métodos de pago
npm run db:seed:settings       # Solo configuración
npm run db:seed:dolar-rates    # Solo tasas de cambio
npm run db:seed:sales          # Solo ventas de prueba
npm run db:seed:cash-reconciliations  # Solo conciliaciones
npm run db:reset         # Reset completo (borrar todo y recrear)
npm run db:setup         # Configuración inicial
npm run db:verify        # Verificar estado de BD
```

### Construcción y Distribución
```bash
npm run build            # Construir aplicación completa
npm run build:vue        # Construir solo frontend
npm run build:electron   # Construir solo backend
npm run build:win        # Generar instalador Windows (.exe)
npm run build:linux      # Generar AppImage Linux
npm run build:mac        # Generar .dmg macOS
```

## 🔒 Seguridad

- **Autenticación JWT**: Tokens seguros con expiración automática
- **Encriptación de Contraseñas**: bcryptjs para hash seguro
- **Validación de Datos**: Sanitización en frontend y backend
- **Control de Acceso**: Roles y permisos granulares
- **Auditoría**: Logs completos de todas las operaciones
- **CORS**: Configuración segura para APIs

## 🌐 API REST

El sistema incluye una API REST completa accesible en `http://localhost:3001/api`:

### Endpoints Principales
- `POST /api/auth/login` - Autenticación de usuarios
- `GET /api/products` - Listar productos
- `POST /api/sales` - Crear nueva venta
- `GET /api/reports/sales` - Reportes de ventas
- `GET /api/inventory` - Estado del inventario

### Documentación API
La API incluye documentación automática y puede ser probada con herramientas como Postman o Insomnia.

## 🐛 Solución de Problemas

### Problemas Comunes

#### Error de Conexión a Base de Datos
```bash
# Verificar variables de entorno
cat .env

# Para MySQL: verificar que el servicio esté ejecutándose
# Windows: services.msc → MySQL
# Linux/Mac: sudo systemctl status mysql
```

#### Error al Iniciar en Modo Desarrollo
```bash
# Limpiar cache de node_modules
rm -rf node_modules package-lock.json
npm install

# Verificar puerto 5173 (Vue) y 3001 (API)
netstat -an | grep :5173
netstat -an | grep :3001
```

#### Problemas con Seeders
```bash
# Reset completo de base de datos
npm run db:reset

# Instalación completa sin reset
npm run install:full

# Ejecutar seeders individuales si es necesario
npm run db:seed:users
npm run db:seed:categories
# ... etc
```

#### Error de Build
```bash
# Limpiar cache de build
npm run clean
npm install
npm run build
```

### Logs y Debugging
- **Logs de Aplicación**: Consola del terminal en modo desarrollo
- **Logs de Base de Datos**: Configurados en `src/main/database/connection.js`
- **DevTools**: `F12` o `Ctrl+Shift+I` en la aplicación

## 📊 Rendimiento

### Optimizaciones Implementadas
- **Lazy Loading**: Componentes cargados bajo demanda
- **Virtual Scrolling**: Para listas grandes
- **Caching**: Consultas frecuentes cacheadas
- **Compresión**: Assets optimizados
- **Tree Shaking**: Eliminación de código no usado

### Recomendaciones
- **Base de Datos**: Usar índices en consultas frecuentes
- **Memoria**: Monitorear uso con Task Manager
- **Archivos**: Limpiar carpeta `uploads/` periódicamente

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

### Estándares de Código
- **ESLint**: Configurado para JavaScript/Vue
- **Prettier**: Formateo automático de código
- **Conventional Commits**: Formato estándar para commits

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- **Electron**: Framework para aplicaciones de escritorio
- **Vue.js**: Framework progresivo de JavaScript
- **Vuetify**: Componentes Material Design
- **Sequelize**: ORM poderoso y flexible
- **Comunidad Open Source**: Por todas las librerías utilizadas

---

**Desarrollado con ❤️ usando Electron.js + Vue.js 3 + Sequelize ORM**
