import { ref, computed, onMounted, onUnmounted } from 'vue'

export default {
  props: {
    modelValue: Boolean
  },
  emits: ['update:modelValue', 'code-scanned'],
  setup(props, { emit }) {
    const isScanning = ref(false)
    const manualCode = ref('')
    const error = ref('')
    const cameraSupported = ref(false)
    const videoElement = ref(null)
    const recentScans = ref([])

    let videoStream = null
    let scannerInterval = null

    const dialog = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    })

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
        
        videoStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        })

        if (videoElement.value) {
          videoElement.value.srcObject = videoStream
          isScanning.value = true
          
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
      scannerInterval = setInterval(() => {
        // Aquí iría la lógica real de detección
      }, 100)
    }

    const searchProduct = () => {
      if (!manualCode.value.trim()) return

      const code = manualCode.value.trim()
      
      if (!recentScans.value.includes(code)) {
        recentScans.value.unshift(code)
        if (recentScans.value.length > 5) {
          recentScans.value.pop()
        }
      }

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

    onMounted(() => {
      checkCameraSupport()
    })

    onUnmounted(() => {
      stopScanning()
    })

    return {
      isScanning,
      manualCode,
      error,
      cameraSupported,
      videoElement,
      recentScans,
      dialog,
      startScanning,
      stopScanning,
      searchProduct,
      selectCode,
      closeDialog
    }
  }
}