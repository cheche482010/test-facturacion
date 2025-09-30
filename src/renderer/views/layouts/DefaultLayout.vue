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

<script>
import defaultLayoutLogic from './DefaultLayout.js'

export default defaultLayoutLogic
</script>
