<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Dashboard</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="3">
        <v-card>
          <v-card-text>
            <div class="text-h6">Ventas Hoy</div>
            <div class="text-h4 primary--text">$1,234.56</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card>
          <v-card-text>
            <div class="text-h6">Productos</div>
            <div class="text-h4 success--text">156</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card>
          <v-card-text>
            <div class="text-h6">Stock Bajo</div>
            <div class="text-h4 warning--text">8</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card>
          <v-card-text>
            <div class="text-h6">Clientes</div>
            <div class="text-h4 info--text">42</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title>Acciones Rápidas</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4">
                <v-btn
                  color="primary"
                  size="large"
                  block
                  to="/sales/new"
                >
                  <v-icon left>mdi-cash-register</v-icon>
                  Nueva Venta
                </v-btn>
              </v-col>
              <v-col cols="12" md="4">
                <v-btn
                  color="success"
                  size="large"
                  block
                  to="/products"
                >
                  <v-icon left>mdi-package-variant-plus</v-icon>
                  Agregar Producto
                </v-btn>
              </v-col>
              <v-col cols="12" md="4">
                <v-btn
                  color="info"
                  size="large"
                  block
                  to="/reports"
                >
                  <v-icon left>mdi-chart-line</v-icon>
                  Ver Reportes
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  console.log('Dashboard cargado');
});
</script>
