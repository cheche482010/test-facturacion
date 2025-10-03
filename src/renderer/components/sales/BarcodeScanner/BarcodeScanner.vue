<template>
  <v-dialog v-model="dialog" max-width="500px" persistent>
    <v-card>
      <v-card-title>
        <span class="text-h5">Escáner de Código de Barras</span>
      </v-card-title>

      <v-card-text>
        <div class="text-center">
          <!-- Camera preview -->
          <div v-if="isScanning" class="scanner-container mb-4">
            <video
              ref="videoElement"
              class="scanner-video"
              autoplay
              playsinline
            ></video>
            <div class="scanner-overlay">
              <div class="scanner-line"></div>
            </div>
          </div>

          <!-- Manual input fallback -->
          <v-text-field
            v-model="manualCode"
            label="Código de Barras"
            variant="outlined"
            density="compact"
            placeholder="Escanee o ingrese manualmente"
            @keyup.enter="searchProduct"
            autofocus
          >
            <template #append-inner>
              <v-btn
                icon="mdi-magnify"
                size="small"
                variant="text"
                @click="searchProduct"
              />
            </template>
          </v-text-field>

          <!-- Scanner controls -->
          <div class="d-flex justify-center gap-2 mb-4">
            <v-btn
              v-if="!isScanning"
              color="primary"
              variant="outlined"
              @click="startScanning"
              :disabled="!cameraSupported"
            >
              <v-icon left>mdi-camera</v-icon>
              Iniciar Escáner
            </v-btn>
            <v-btn
              v-else
              color="error"
              variant="outlined"
              @click="stopScanning"
            >
              <v-icon left>mdi-camera-off</v-icon>
              Detener Escáner
            </v-btn>
          </div>

          <!-- Status messages -->
          <v-alert
            v-if="!cameraSupported"
            type="warning"
            variant="tonal"
            class="mb-4"
          >
            Cámara no disponible. Use entrada manual.
          </v-alert>

          <v-alert
            v-if="error"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            {{ error }}
          </v-alert>

          <!-- Recent scans -->
          <div v-if="recentScans.length > 0" class="mt-4">
            <v-divider class="mb-3" />
            <div class="text-subtitle-2 mb-2">Códigos recientes:</div>
            <v-chip
              v-for="scan in recentScans"
              :key="scan"
              class="ma-1"
              size="small"
              @click="selectCode(scan)"
            >
              {{ scan }}
            </v-chip>
          </div>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="closeDialog">Cancelar</v-btn>
        <v-btn
          color="primary"
          :disabled="!manualCode"
          @click="searchProduct"
        >
          Buscar Producto
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import barcodeScannerLogic from './BarcodeScanner.js'

export default barcodeScannerLogic
</script>

<style scoped>
.scanner-container {
  position: relative;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
}

.scanner-video {
  width: 100%;
  height: 300px;
  object-fit: cover;
}

.scanner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scanner-line {
  width: 80%;
  height: 2px;
  background: #ff4444;
  box-shadow: 0 0 10px #ff4444;
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% {
    transform: translateY(-150px);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateY(150px);
    opacity: 0;
  }
}

.gap-2 {
  gap: 8px;
}
</style>
