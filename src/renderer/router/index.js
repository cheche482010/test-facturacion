import { createRouter, createWebHistory } from "vue-router"

const routes = [
  {
    path: "/",
    name: "Dashboard",
    component: () => import("../views/Dashboard.vue"),
  },
  {
    path: "/sales/new",
    name: "NewSale",
    component: () => import("../views/sales/NewSale.vue"),
  },
  {
    path: "/products",
    name: "Products",
    component: () => import("../views/products/ProductList.vue"),
  },
  {
    path: "/inventory",
    name: "Inventory",
    component: () => import("../views/inventory/InventoryList.vue"),
  },
  {
    path: "/customers",
    name: "Customers",
    component: () => import("../views/customers/CustomerList.vue"),
  },
  {
    path: "/reports",
    name: "Reports",
    component: () => import("../views/reports/ReportsDashboard.vue"),
  },
  {
    path: "/settings",
    name: "Settings",
    component: () => import("../views/settings/Settings.vue"),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
