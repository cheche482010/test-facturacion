<template>
  <v-container fluid class="login-container">
    <v-row justify="center" align="center" style="min-height: 100vh;">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="login-card" elevation="8">
          <v-card-title class="text-center text-h4 py-6">
            Sistema de Facturación
          </v-card-title>
          
          <v-card-text>
            <v-form @submit.prevent="handleLogin" ref="loginForm">
              <v-text-field
                v-model="form.username"
                label="Usuario"
                prepend-icon="mdi-account"
                variant="outlined"
                :rules="[rules.required]"
                required
              />
              
              <v-text-field
                v-model="form.password"
                label="Contraseña"
                prepend-icon="mdi-lock"
                variant="outlined"
                type="password"
                :rules="[rules.required]"
                required
              />
              
              <v-btn
                type="submit"
                color="primary"
                size="large"
                block
                :loading="loading"
                class="mt-4"
              >
                Iniciar Sesión
              </v-btn>
            </v-form>
          </v-card-text>
          
          <v-card-actions class="justify-center pb-6">
            <v-alert
              v-if="error"
              type="error"
              variant="tonal"
              class="w-100"
            >
              {{ error }}
            </v-alert>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const loginForm = ref(null)
const loading = ref(false)
const error = ref('')

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  required: v => !!v || 'Este campo es requerido'
}

const handleLogin = async () => {
  if (!loginForm.value.validate()) return
  
  loading.value = true
  error.value = ''
  
  try {
    await authStore.login({ username: form.username, password: form.password })
    router.push('/dashboard')
  } catch (err) {
    error.value = err.message || 'Error al iniciar sesión'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  border-radius: 16px;
}
</style>
