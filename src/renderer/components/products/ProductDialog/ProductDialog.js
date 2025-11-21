import { ref, computed, watch } from 'vue'
import { useProductStore } from '../../../stores/products'
import { useAppStore } from '../../../stores/app'

export default {
  props: {
    modelValue: Boolean,
    product: Object,
    categories: Array,
  },
  emits: ['update:modelValue', 'saved'],
  setup(props, { emit }) {
    const productStore = useProductStore()
    const appStore = useAppStore()

    const valid = ref(false)
    const saving = ref(false)
    const autoPricing = ref(true)
    const form = ref(null)
    const imageFile = ref(null)
    const imagePreview = ref(null)
    const imageRemoved = ref(false)


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
       categoryId: null,
       costPrice: 0,
       profitPercentage: 30,
       retailPrice: 0,
       currentStock: 0,
       status: 'activo',
       image: null,
     })

    const dialog = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value),
    })

    const isEditing = computed(() => !!props.product)

    const resetForm = () => {
      formData.value = {
        internalCode: '',
        barcode: '',
        name: '',
        description: '',
        categoryId: null,
        costPrice: 0,
        profitPercentage: 30,
        retailPrice: 0,
        currentStock: 0,
        status: 'activo',
        image: null,
      }
       autoPricing.value = true
       imageFile.value = null
       imagePreview.value = null
       imageRemoved.value = false
       form.value?.resetValidation()
     }

    watch(
      () => props.product,
      (newProduct) => {
        if (newProduct) {
          formData.value.internalCode = newProduct.internalCode || ''
          formData.value.barcode = newProduct.barcode || ''
          formData.value.name = newProduct.name || ''
          formData.value.description = newProduct.description || ''
          formData.value.categoryId = newProduct.categoryId || null
          formData.value.costPrice = isNaN(parseFloat(newProduct.costPrice)) ? 0 : parseFloat(newProduct.costPrice)
          formData.value.profitPercentage = isNaN(parseFloat(newProduct.profitPercentage)) ? 30 : parseFloat(newProduct.profitPercentage)
          formData.value.retailPrice = isNaN(parseFloat(newProduct.retailPrice)) ? 0 : parseFloat(newProduct.retailPrice)
          formData.value.currentStock = isNaN(parseInt(newProduct.currentStock)) ? 0 : parseInt(newProduct.currentStock)
          formData.value.status = newProduct.status || 'activo'
          formData.value.image = newProduct.image || null
          autoPricing.value = false
          if (newProduct.image) {
            imagePreview.value = newProduct.image.startsWith('http')
              ? newProduct.image
              : `http://localhost:3001${newProduct.image}`
          } else {
            imagePreview.value = null
          }
          imageFile.value = null
          imageRemoved.value = false
        } else {
          resetForm()
        }
      },
      { immediate: true },
    )

    const onFileChange = (event) => {
      const file = event.target.files[0]
      if (file) {
        imageFile.value = file
        imagePreview.value = URL.createObjectURL(file)
        imageRemoved.value = false
      }
    }

    const removeImage = () => {
      imageFile.value = null
      imagePreview.value = null
      formData.value.image = null
      imageRemoved.value = true
    }

    const calculatePrices = () => {
       const cost = formData.value.costPrice || 0
       const profitPercent = formData.value.profitPercentage || 0

       const profit = cost * (profitPercent / 100)
       formData.value.retailPrice = Math.round((cost + profit) * 100) / 100
     }

     const calculatedSalePrice = computed(() => {
       const cost = formData.value.costPrice || 0
       const profitPercent = formData.value.profitPercentage || 0
       const profit = cost * (profitPercent / 100)
       return Math.round((cost + profit) * 100) / 100
     })

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
        let savedProduct
        if (isEditing.value) {
          
          if (imageRemoved.value) {
            formData.value.image = null
          }
          savedProduct = await productStore.updateProduct(
            props.product.id,
            formData.value,
          )
        } else {
          if (!formData.value.barcode) {
            generateBarcode()
          }
          savedProduct = await productStore.createProduct(formData.value)
        }

        if (imageFile.value) {
          await productStore.uploadProductImage(savedProduct.id, imageFile.value)
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
       statusOptions,
       rules,
       formData,
       dialog,
       isEditing,
       calculatedSalePrice,
       imageFile,
       imagePreview,
       onFileChange,
       removeImage,
       resetForm,
       calculatePrices,
       generateBarcode,
       scanBarcode,
       saveProduct,
       closeDialog,
     }
  },
}