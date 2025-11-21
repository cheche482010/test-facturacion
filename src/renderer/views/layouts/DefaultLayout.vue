<template>
    <v-app>
        <v-navigation-drawer v-model="drawer" app
            :color="settingsStore.settings.darkMode ? 'grey-darken-4' : 'grey-lighten-4'">
            <v-list-item>
                <div class="d-flex align-center justify-center mb-2">
                    <v-img v-if="settingsStore.settings.systemLogo" :src="settingsStore.settings.systemLogo"
                        max-height="60" max-width="60" contain></v-img>
                    <v-icon v-else size="60"
                        :color="settingsStore.settings.darkMode ? 'white' : 'primary'">mdi-store-outline</v-icon>
                </div>
                <v-list-item-title class="text-h6 text-center">
                    {{ settingsStore.settings.systemTitle || 'Facturación' }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-center">
                    Menú Principal
                </v-list-item-subtitle>
            </v-list-item>

            <v-divider></v-divider>

            <v-list dense nav>
                <v-list-item v-for="item in menuItems" :key="item.title" :to="item.to" link :prepend-icon="item.icon"
                    :title="item.title">
                    <template v-if="item.title === 'Ventas'" #append>
                        <div v-show="salesStore.hasPendingCart" class="ml-1">
                            <v-tooltip text="Hay una venta sin procesar">
                                <template v-slot:activator="{ props }">
                                    <v-icon color="error" size="small" v-bind="props">mdi-alert-box</v-icon>
                                </template>
                            </v-tooltip>
                        </div>
                    </template>
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

        <v-app-bar app :color="settingsStore.settings.primaryColor" :dark="settingsStore.settings.darkMode">
            <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
            <v-toolbar-title>{{ settingsStore.settings.systemTitle || 'Sistema de Facturación' }}</v-toolbar-title>

            <v-spacer></v-spacer>

            <!-- Dólar del Día -->
            <v-chip v-if="currentDolarRate && currentDolarRate.dataValues && currentDolarRate.dataValues.rate"
                color="success" variant="flat" prepend-icon="mdi-currency-usd" class="mr-2" size="small">
                Bs {{ formatCurrency(currentDolarRate.dataValues.rate) }}
                <v-tooltip activator="parent" location="bottom">
                    Última actualización: {{ formatDateTime(currentDolarRate.dataValues.updatedAt) }}
                </v-tooltip>
            </v-chip>
            <v-chip v-else color="warning" variant="flat" prepend-icon="mdi-currency-usd-off" size="small">
                Dólar no disponible
            </v-chip>
        </v-app-bar>

        <v-main>
            <v-container fluid>
                <router-view />
            </v-container>
        </v-main>
    </v-app>
</template>

<script>
import defaultLayoutLogic from './DefaultLayout.js'

export default defaultLayoutLogic
</script>
