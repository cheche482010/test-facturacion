<template>
    <v-app>
        <v-navigation-drawer v-model="drawer" app>
            <v-list-item>
                <v-list-item-content>
                    <v-list-item-title class="text-h6">
                        Facturación
                    </v-list-item-title>
                    <v-list-item-subtitle>
                        Menú Principal
                    </v-list-item-subtitle>
                </v-list-item-content>
            </v-list-item>

            <v-divider></v-divider>

            <v-list dense nav>
                <v-list-item v-for="item in menuItems" :key="item.title" :to="item.to" link>
                    <v-list-item-icon>
                        <v-icon>{{ item.icon }}</v-icon>
                    </v-list-item-icon>

                    <v-list-item-content>
                        <v-list-item-title>{{ item.title }}</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
            </v-list>

            <template v-slot:append>
                <div class="pa-2">
                    <v-btn block color="primary" @click="logout">
                        Cerrar Sesión
                    </v-btn>
                </div>
            </template>
        </v-navigation-drawer>

        <v-app-bar app color="primary" dark>
            <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
            <v-toolbar-title>Sistema de Facturación</v-toolbar-title>
        </v-app-bar>

        <v-main>
            <v-container fluid>
                <!-- El contenido de cada vista se renderizará aquí -->
                <router-view />
            </v-container>
        </v-main>
    </v-app>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const drawer = ref(true)
const router = useRouter()
const authStore = useAuthStore()

const menuItems = ref([
    { title: 'Dashboard', icon: 'mdi-view-dashboard', to: '/dashboard' },
    { title: 'Nueva Venta', icon: 'mdi-point-of-sale', to: '/sales/new' },
    { title: 'Productos', icon: 'mdi-package-variant-closed', to: '/products' },
    { title: 'Inventario', icon: 'mdi-warehouse', to: '/inventory' },
    { title: 'Clientes', icon: 'mdi-account-group', to: '/customers' },
    { title: 'Reportes', icon: 'mdi-chart-bar', to: '/reports' },
    { title: 'Configuración', icon: 'mdi-cog', to: '/settings' },
])

const logout = () => {
    authStore.logout()
    router.push('/login')
}
</script>
