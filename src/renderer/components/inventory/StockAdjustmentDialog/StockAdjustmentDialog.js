import { ref, computed, watch } from 'vue'
import { useInventoryStore } from '../../../stores/inventory'
import { useCategoryStore } from '../../../stores/categories'

export default {
  props: {
    modelValue: Boolean,
    product: Object
  },
  emits: ['update:modelValue', 'saved'],
  setup(props, { emit }) {
    const inventoryStore = useInventoryStore()
    const categoryStore = useCategoryStore()

    const valid = ref(false)
    const saving = ref(false)
    const form = ref(null)

    const reasonOptions = [
      { title: 'Inventario físico', value: 'inventario_fisico' },
      { title: 'Ajuste por diferencia', value: 'ajuste_diferencia' },
      { title: 'Producto dañado', value: 'producto_danado' },
      { title: 'Producto vencido', value: 'producto_vencido' },
      { title: 'Robo/Pérdida', value: 'robo_perdida' },
      { title: 'Error de sistema', value: 'error_sistema' },
      { title: 'Otro', value: 'otro' }
    ]

    const massAdjustmentTypes = [
      { title: 'Cantidad fija', value: 'fixed' },
      { title: 'Porcentaje', value: 'percentage' },
      { title: 'Establecer a cero', value: 'zero' }
    ]

    const rules = {
      required: value => !!value || 'Este campo es requerido',
      positive: value => value >= 0 || 'Debe ser mayor o igual a 0'
    }

    const formData = ref({
      newStock: 0,
      reason: '',
      notes: '',
      category: null,
      adjustmentType: 'fixed',
      adjustmentValue: 0
    })

    const dialog = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    })

    const categories = computed(() => categoryStore.categories)

    const adjustmentQuantity = computed(() => {
      if (!props.product) return 0
      return formData.value.newStock - props.product.currentStock
    })

    const adjustmentType = computed(() => {
      const qty = adjustmentQuantity.value
      if (qty > 0) return 'success'
      if (qty < 0) return 'warning'
      return 'info'
    })

    const adjustmentMessage = computed(() => {
      const qty = adjustmentQuantity.value
      if (qty > 0) return 'Entrada de inventario'
      if (qty < 0) return 'Salida de inventario'
      return 'Sin cambios'
    })

    const resetForm = () => {
      formData.value = {
        newStock: props.product?.currentStock || 0,
        reason: '',
        notes: '',
        category: null,
        adjustmentType: 'fixed',
        adjustmentValue: 0
      }
      form.value?.resetValidation()
    }

    watch(() => props.product, (newProduct) => {
      if (newProduct) {
        formData.value.newStock = newProduct.currentStock
      }
      resetForm()
    }, { deep: true, immediate: true })

    const saveAdjustment = async () => {
      if (!form.value.validate()) return

      saving.value = true
      try {
        if (props.product) {
          await inventoryStore.adjustStock(
            props.product.id,
            formData.value.newStock,
            formData.value.reason,
            formData.value.notes
          )
        } else {
          await inventoryStore.massAdjustment({
            category: formData.value.category,
            adjustmentType: formData.value.adjustmentType,
            adjustmentValue: formData.value.adjustmentValue,
            reason: formData.value.reason,
            notes: formData.value.notes
          })
        }
        emit('saved')
      } catch (error) {
        console.error('Error guardando ajuste:', error)
      } finally {
        saving.value = false
        closeDialog()
      }
    }

    const closeDialog = () => {
      dialog.value = false
    }

    return {
      valid,
      saving,
      form,
      reasonOptions,
      massAdjustmentTypes,
      rules,
      formData,
      dialog,
      categories,
      adjustmentQuantity,
      adjustmentType,
      adjustmentMessage,
      resetForm,
      saveAdjustment,
      closeDialog
    }
  }
}