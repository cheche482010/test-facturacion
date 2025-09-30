import { ref, computed, watch } from 'vue'
import { useInventoryStore } from '../../../stores/inventory'
import { useProductStore } from '../../../stores/products'

export default {
  props: {
    modelValue: Boolean
  },
  emits: ['update:modelValue', 'saved'],
  setup(props, { emit }) {
    const inventoryStore = useInventoryStore()
    const productStore = useProductStore()

    const valid = ref(false)
    const saving = ref(false)
    const form = ref(null)
    const selectedProduct = ref(null)

    const movementTypes = [
      { title: 'Entrada', value: 'entrada' },
      { title: 'Salida', value: 'salida' },
      { title: 'Ajuste', value: 'ajuste' },
      { title: 'Devolución', value: 'devolucion' }
    ]

    const reasonOptions = [
      { title: 'Compra a proveedor', value: 'compra' },
      { title: 'Venta a cliente', value: 'venta' },
      { title: 'Ajuste de inventario', value: 'ajuste_inventario' },
      { title: 'Devolución de cliente', value: 'devolucion_cliente' },
      { title: 'Devolución a proveedor', value: 'devolucion_proveedor' },
      { title: 'Pérdida/Daño', value: 'merma' },
      { title: 'Otro', value: 'otro' }
    ]

    const rules = {
      required: value => !!value || 'Este campo es requerido',
      positive: value => value > 0 || 'Debe ser un número positivo'
    }

    const formData = ref({
      productId: null,
      movementType: 'entrada',
      reason: 'compra',
      quantity: 0,
      unitCost: 0,
      notes: ''
    })

    const dialog = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    })

    const products = computed(() => productStore.products)

    const resetForm = () => {
      selectedProduct.value = null
      formData.value = {
        productId: null,
        movementType: 'entrada',
        reason: 'compra',
        quantity: 0,
        unitCost: 0,
        notes: ''
      }
      form.value?.resetValidation()
    }

    const saveMovement = async () => {
      if (!form.value.validate()) return

      saving.value = true
      try {
        await inventoryStore.createMovement({
          ...formData.value,
          productId: selectedProduct.value.id
        })
        emit('saved')
        closeDialog()
      } catch (error) {
        console.error('Error guardando movimiento:', error)
      } finally {
        saving.value = false
      }
    }

    const closeDialog = () => {
      resetForm()
      dialog.value = false
    }

    watch(selectedProduct, (newProduct) => {
      if (newProduct) {
        formData.value.unitCost = newProduct.costPrice
      }
    })

    watch(dialog, (isOpen) => {
      if (isOpen && productStore.products.length === 0) {
        productStore.fetchProducts()
      }
    })

    return {
      valid,
      saving,
      form,
      selectedProduct,
      movementTypes,
      reasonOptions,
      rules,
      formData,
      dialog,
      products,
      resetForm,
      saveMovement,
      closeDialog
    }
  }
}