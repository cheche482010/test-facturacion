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

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'code-scanned'])

// Estado reactivo
const isScanning = ref(false)
const manualCode = ref('')
const error = ref('')
const cameraSupported = ref(false)
const videoElement = ref(null)
const recentScans = ref([])

// Stream de video
let videoStream = null
let scannerInterval = null

// Computed properties
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Métodos
const checkCameraSupport = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    cameraSupported.value = devices.some(device => device.kind === 'videoinput')
  } catch (err) {
    console.warn('Error checking camera support:', err)
    cameraSupported.value = false
  }
}

const startScanning = async () => {
  if (!cameraSupported.value) return

  try {
    error.value = ''
    
    // Solicitar acceso a la cámara
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment', // Cámara trasera preferida
        width: { ideal: 640 },
        height: { ideal: 480 }
      }
    })

    if (videoElement.value) {
      videoElement.value.srcObject = videoStream
      isScanning.value = true
      
      // Simular detección de código de barras
      // En una implementación real, usarías una librería como QuaggaJS o ZXing
      startBarcodeDetection()
    }
  } catch (err) {
    console.error('Error accessing camera:', err)
    error.value = 'No se pudo acceder a la cámara. Verifique los permisos.'
  }
}

const stopScanning = () => {
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop())
    videoStream = null
  }
  
  if (scannerInterval) {
    clearInterval(scannerInterval)
    scannerInterval = null
  }
  
  isScanning.value = false
  error.value = ''
}

const startBarcodeDetection = () => {
  // Simulación de detección de código de barras
  // En una implementación real, integrarías con una librería de detección
  scannerInterval = setInterval(() => {
    // Aquí iría la lógica real de detección
    // Por ahora, solo es una simulación
  }, 100)
}

const searchProduct = () => {
  if (!manualCode.value.trim()) return

  const code = manualCode.value.trim()
  
  // Agregar a códigos recientes
  if (!recentScans.value.includes(code)) {
    recentScans.value.unshift(code)
    if (recentScans.value.length > 5) {
      recentScans.value.pop()
    }
  }

  // Emitir evento con el código
  emit('code-scanned', code)
  closeDialog()
}

const selectCode = (code) => {
  manualCode.value = code
  searchProduct()
}

const closeDialog = () => {
  stopScanning()
  manualCode.value = ''
  error.value = ''
  dialog.value = false
}

// Lifecycle hooks
onMounted(() => {
  checkCameraSupport()
})

onUnmounted(() => {
  stopScanning()
})
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
