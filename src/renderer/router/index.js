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
        redirect: "/dashboard", // Redirigir la raíz al dashboard
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
        path: "customers",
        name: "Customers",
        component: () => import("@/views/customers/CustomerList.vue"),
      },
      {
        path: "reports",
        name: "Reports",
        component: () => import("@/views/reports/ReportsDashboard.vue"),
      },
      {
        path: "settings",
        name: "Settings",
        component: () => import("@/views/settings/Settings.vue"),
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

  // Si la ruta requiere autenticación y el usuario no está autenticado
  if (requiresAuth && !authStore.isAuthenticated) {
    // Redirigir al login
    next({ name: "Login" })
  }
  // Si el usuario intenta acceder al login pero ya está autenticado
  else if (to.name === "Login" && authStore.isAuthenticated) {
    // Redirigir al dashboard
    next({ name: "Dashboard" })
  }
  // En cualquier otro caso, permitir la navegación
  else {
    next()
  }
})

export default router
