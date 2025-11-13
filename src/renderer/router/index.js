import { createRouter, createWebHistory } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import DefaultLayout from "@/views/layouts/DefaultLayout.vue"

const routes = [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/auth/Login.vue"),
    meta: { requiresAuth: false }, 
  },
  {
    path: "/",
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        redirect: "/login",
      },
      {
        path: "dashboard",
        name: "Dashboard",
        component: () => import("@/views/Dashboard/Dashboard.vue"),
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
      {
        path: "calculator",
        name: "Calculator",
        component: () => import("@/views/Calculator/CalculatorSection.vue"),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  
  if (requiresAuth && !authStore.isAuthenticated) {
    if (authStore.token) {
      try {
        await authStore.checkAuth()
        
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
            next({ name: "Dashboard" })
            return
          }
          next()
          return
        }
      } catch (error) {
        next({ name: "Login" })
        return
      }
    } else {
      next({ name: "Login" })
      return
    }
  }
  
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
      next({ name: "Dashboard" })
      return
    }
  }

  next()
})

export default router
