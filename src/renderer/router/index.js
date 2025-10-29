import { createRouter, createWebHistory } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import DefaultLayout from "@/views/layouts/DefaultLayout.vue"

const routes = [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/auth/Login.vue"),
    meta: { requiresAuth: false }, // Marcamos esta ruta como pública
  },
  {
    // Ruta padre que usa el DefaultLayout
    path: "/",
    component: DefaultLayout,
    meta: { requiresAuth: true }, // Todas las rutas hijas requerirán autenticación
    children: [
      {
        path: "",
        redirect: "/login", // Redirigir la raíz al login
      },
      {
        path: "dashboard",
        name: "Dashboard",
        component: () => import("@/views/Dashboard.vue"),
      },
      {
        path: "sales/new",
        name: "NewSale",
        component: () => import("@/views/sales/NewSale.vue"),
      },
      {
        path: "products",
        name: "Products",
        component: () => import("@/views/products/ProductList.vue"),
      },
      {
        path: "inventory",
        name: "Inventory",
        component: () => import("@/views/inventory/InventoryList.vue"),
      },
      {
        path: "reports",
        name: "Reports",
        component: () => import("@/views/reports/ReportsDashboard.vue"),
      },
      {
        path: "cash-count",
        name: "CashCount",
        component: () => import("@/views/cash-count/CashCount.vue"),
      },
      {
        path: "settings",
        name: "Settings",
        component: () => import("@/views/settings/Settings.vue"),
      },
      {
        path: "cash-reconciliation",
        name: "CashReconciliation",
        component: () => import("@/views/cash-reconciliation/CashReconciliationView.vue"),
      },
      {
        path: "users",
        name: "Users",
        component: () => import("@/views/users/UserManagement.vue"),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Guardia de navegación global
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  // Si la ruta requiere autenticación y el usuario no está autenticado
  if (requiresAuth && !authStore.isAuthenticated) {
    // Verificar si hay un token y intentar autenticar
    if (authStore.token) {
      try {
        await authStore.checkAuth()
        // Si la autenticación fue exitosa, continuar con la verificación de permisos
        if (authStore.isAuthenticated) {
          const routePermissions = {
            dashboard: 'dashboard',
            'sales/new': 'sales',
            products: 'products',
            inventory: 'inventory',
            reports: 'reports',
            'cash-count': 'cash_reconciliation',
            settings: 'settings',
            'cash-reconciliation': 'cash_reconciliation',
            users: 'users'
          }

          const requiredPermission = routePermissions[to.path.replace('/', '')]
          if (requiredPermission && !authStore.hasPermission(requiredPermission)) {
            // Redirigir al dashboard si no tiene permisos
            next({ name: "Dashboard" })
            return
          }
          next()
          return
        }
      } catch (error) {
        // Si falla la autenticación, redirigir al login
        next({ name: "Login" })
        return
      }
    } else {
      // No hay token, redirigir al login
      next({ name: "Login" })
      return
    }
  }
  // Si está autenticado, verificar permisos basados en la ruta
  else if (requiresAuth && authStore.isAuthenticated) {
    const routePermissions = {
      dashboard: 'dashboard',
      'sales/new': 'sales',
      products: 'products',
      inventory: 'inventory',
      reports: 'reports',
      'cash-count': 'cash_reconciliation',
      settings: 'settings',
      'cash-reconciliation': 'cash_reconciliation',
      users: 'users'
    }

    const requiredPermission = routePermissions[to.path.replace('/', '')]
    if (requiredPermission && !authStore.hasPermission(requiredPermission)) {
      // Redirigir al dashboard si no tiene permisos
      next({ name: "Dashboard" })
      return
    }
  }

  // En cualquier otro caso, permitir la navegación
  next()
})

export default router
