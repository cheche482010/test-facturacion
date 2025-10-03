<template>
  <v-dialog :model-value="modelValue" @update:model-value="updateModelValue" max-width="800px" persistent>
    <v-card>
      <v-card-title>
        <span class="text-h5">{{ isEditing ? 'Editar Cliente' : 'Nuevo Cliente' }}</span>
      </v-card-title>

      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field v-model="formData.name" label="Nombre Completo o Razón Social*" required></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="formData.idNumber" label="Cédula o RIF*" required></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="formData.email" label="Email" type="email"></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="formData.phone" label="Teléfono"></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field v-model="formData.address" label="Dirección"></v-text-field>
            </v-col>
             <v-col cols="12" sm="4">
              <v-select v-model="formData.category" :items="['Normal', 'Mayorista', 'Preferencial']" label="Categoría"></v-select>
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field v-model.number="formData.creditLimit" label="Límite de Crédito" type="number" prefix="$"></v-text-field>
            </v-col>
            <v-col cols="12" sm="4">
               <v-switch v-model="formData.status" :label="`Estado: ${formData.status === 'activo' ? 'Activo' : 'Inactivo'}`" color="success" true-value="activo" false-value="inactivo" inset></v-switch>
            </v-col>
          </v-row>
        </v-container>
        <small>*indica campo requerido</small>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue-darken-1" variant="text" @click="closeDialog">
          Cancelar
        </v-btn>
        <v-btn color="blue-darken-1" variant="text" @click="save">
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { ref, watch, computed } from 'vue'

export default {
  props: {
    modelValue: Boolean,
    customer: Object
  },
  emits: ['update:modelValue', 'saved'],
  setup(props, { emit }) {
    const formData = ref({})

    const isEditing = computed(() => !!props.customer)

    watch(() => props.customer, (newVal) => {
      if (newVal) {
        formData.value = { ...newVal }
      } else {
        formData.value = { status: 'activo', creditLimit: 0, category: 'Normal' }
      }
    }, { immediate: true })

    const closeDialog = () => {
      emit('update:modelValue', false)
    }

    const save = () => {
      emit('saved', formData.value)
      closeDialog()
    }

    const updateModelValue = (value) => {
      emit('update:modelValue', value)
    }

    return {
      formData,
      isEditing,
      closeDialog,
      save,
      updateModelValue
    }
  }
}
</script>