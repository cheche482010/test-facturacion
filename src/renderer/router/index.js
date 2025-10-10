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
        meta: { roles: ["dev", "administrador"] },
      },
      {
        path: "sales/new",
        name: "NewSale",
        component: () => import("@/views/sales/NewSale.vue"),
        meta: { roles: ["dev", "administrador", "cajero"] },
      },
      {
        path: "products",
        name: "Products",
        component: () => import("@/views/products/ProductList.vue"),
        meta: { roles: ["dev", "administrador", "cajero"] },
      },
      {
        path: "inventory",
        name: "Inventory",
        component: () => import("@/views/inventory/InventoryList.vue"),
        meta: { roles: ["dev", "administrador"] },
      },
      {
        path: "reports",
        name: "Reports",
        component: () => import("@/views/reports/ReportsDashboard.vue"),
        meta: { roles: ["dev", "administrador"] },
      },
      {
        path: "settings",
        name: "Settings",
        component: () => import("@/views/settings/Settings.vue"),
        meta: { roles: ["dev"] },
      },
      {
        path: "cash-reconciliation",
        name: "CashReconciliation",
        component: () => import("@/views/cash-reconciliation/CashReconciliationView.vue"),
        meta: { roles: ["dev", "administrador", "cajero"] },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Guardia de navegación global
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth && !authStore.isAuthenticated) {
    return next({ name: "Login" })
  }

  const requiredRoles = to.meta.roles
  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(authStore.userRole)) {
      return next({ name: "Dashboard" }) // Or a "not authorized" page
    }
  }

  next()
})

export default router
