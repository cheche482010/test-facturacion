<template>
    <v-app>
        <v-navigation-drawer v-model="drawer" app>
            <v-list-item>
                <div class="d-flex align-center justify-center mb-2">
                    <v-img v-if="settingsStore.settings.systemLogo" :src="settingsStore.settings.systemLogo"
                        max-height="60" max-width="60" contain></v-img>
                    <v-icon v-else size="60" color="white">mdi-store-outline</v-icon>
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
                    :title="item.title" />
            </v-list>

            <template v-slot:append>
                <div class="pa-2">
                    <v-btn block color="primary" @click="logout">
                        Cerrar Sesión
                    </v-btn>
                </div>
            </template>
        </v-navigation-drawer>

        <v-app-bar app :color="settingsStore.settings.primaryColor" dark>
            <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
            <v-toolbar-title>{{ settingsStore.settings.systemTitle || 'Sistema de Facturación' }}</v-toolbar-title>
        </v-app-bar>

        <v-main>
            <v-container fluid>
                <!-- El contenido de cada vista se renderizará aquí -->
                <router-view />
            </v-container>
        </v-main>
    </v-app>
</template>

<script>
import defaultLayoutLogic from './DefaultLayout.js'

export default defaultLayoutLogic
</script>
