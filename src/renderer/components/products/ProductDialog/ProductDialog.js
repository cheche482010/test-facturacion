import { ref, computed, watch } from 'vue'
import { useProductStore } from '../../../stores/products'
import { useAppStore } from '../../../stores/app'

export default {
  props: {
    modelValue: Boolean,
    product: Object,
    categories: Array
  },
  emits: ['update:modelValue', 'saved'],
  setup(props, { emit }) {
    const productStore = useProductStore()
    const appStore = useAppStore()

    const valid = ref(false)
    const saving = ref(false)
    const autoPricing = ref(true)
    const form = ref(null)

    const unitOptions = [
      { title: 'Unidad', value: 'unidad' },
      { title: 'Kilogramos', value: 'kg' },
      { title: 'Litros', value: 'litros' },
      { title: 'Metros', value: 'metros' },
      { title: 'Cajas', value: 'cajas' }
    ]

    const statusOptions = [
      { title: 'Activo', value: 'activo' },
      { title: 'Descontinuado', value: 'descontinuado' },
      { title: 'Agotado', value: 'agotado' }
    ]

    const currencyOptions = [
      { title: 'Bolívares (VES)', value: 'VES' },
      { title: 'Dólares (USD)', value: 'USD' }
    ]

    const rules = {
      required: value => !!value || 'Este campo es requerido',
      positive: value => value > 0 || 'Debe ser mayor a 0'
    }

    const formData = ref({
      internalCode: '',
      barcode: '',
      name: '',
      description: '',
      brand: '',
      unit: 'unidad',
      categoryId: null,
      costPrice: 0,
      costCurrency: 'VES',
      profitPercentage: 30,
      retailPrice: 0,
      wholesalePrice: 0,
      dollar_price: 0,
      taxRate: 16,
      currentStock: 0,
      minStock: 5,
      maxStock: 100,
      location: '',
      status: 'activo',
      expirationDate: null
    })

    const dialog = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    })

    const isEditing = computed(() => !!props.product)

    const resetForm = () => {
      formData.value = {
        internalCode: '',
        barcode: '',
        name: '',
        description: '',
        brand: '',
        unit: 'unidad',
        categoryId: null,
        costPrice: 0,
        costCurrency: 'VES',
        profitPercentage: 30,
        retailPrice: 0,
        wholesalePrice: 0,
        dollarPrice: 0,
        taxRate: 16,
        currentStock: 0,
        minStock: 5,
        maxStock: 100,
        location: '',
        status: 'activo',
        expirationDate: null
      }
      autoPricing.value = true
      form.value?.resetValidation()
    }

    watch(() => props.product, (newProduct) => {
      if (newProduct) {
        Object.assign(formData.value, newProduct)
        autoPricing.value = false
      } else {
        resetForm()
      }
    }, { immediate: true })

    const calculatePrices = () => {
      if (!autoPricing.value) return

      const cost = formData.value.costPrice || 0
      const profitPercent = formData.value.profitPercentage || 0
      const exchangeRate = appStore.settings.exchangeRate || 1

      let costInVES = cost
      if (formData.value.costCurrency === 'USD') {
        costInVES = cost * exchangeRate
      }

      const profit = costInVES * (profitPercent / 100)
      formData.value.retailPrice = Math.round((costInVES + profit) * 100) / 100

      formData.value.wholesalePrice = Math.round(formData.value.retailPrice * 0.9 * 100) / 100

      formData.value.dollarPrice = Math.round((formData.value.retailPrice / exchangeRate) * 100) / 100
    }

    const generateBarcode = () => {
      if (!formData.value.barcode) {
        const timestamp = Date.now().toString()
        formData.value.barcode = timestamp.slice(-10)
      }
    }

    const scanBarcode = () => {
      generateBarcode()
    }

    const saveProduct = async () => {
      if (!form.value.validate()) return

      saving.value = true
      try {
        if (isEditing.value) {
          await productStore.updateProduct(props.product.id, formData.value)
        } else {
          if (!formData.value.barcode) {
            generateBarcode()
          }
          await productStore.createProduct(formData.value)
        }
        emit('saved')
      } catch (error) {
        console.error('Error guardando producto:', error)
      } finally {
        saving.value = false
      }
    }

    const closeDialog = () => {
      dialog.value = false
    }

    return {
      valid,
      saving,
      autoPricing,
      form,
      unitOptions,
      statusOptions,
      currencyOptions,
      rules,
      formData,
      dialog,
      isEditing,
      resetForm,
      calculatePrices,
      generateBarcode,
      scanBarcode,
      saveProduct,
      closeDialog
    }
  }
}