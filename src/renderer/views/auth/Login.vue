<template>
  <v-app>
    <v-main>
      <v-container fluid class="fill-height" style="background-color: #f5f5f5;">
        <v-row align="center" justify="center">
          <v-col cols="12" sm="8" md="4">
            <v-card class="elevation-12 pa-4">
              <div class="text-center mb-4">
                <v-icon size="64" color="primary">mdi-store-outline</v-icon>
              </div>
              <v-card-title class="text-h5 text-center justify-center">
                Sistema de Facturación
              </v-card-title>
              <v-card-subtitle class="text-center mb-4">
                Ingresa tus credenciales para continuar
              </v-card-subtitle>

              <v-card-text>
                <v-form ref="form" v-model="valid" lazy-validation>
                  <v-text-field
                    v-model="credentials.username"
                    :rules="usernameRules"
                    label="Usuario"
                    prepend-inner-icon="mdi-account"
                    variant="outlined"
                    required
                    @keyup.enter="login"
                  ></v-text-field>

                  <v-text-field
                    v-model="credentials.password"
                    :rules="passwordRules"
                    :type="showPassword ? 'text' : 'password'"
                    label="Contraseña"
                    prepend-inner-icon="mdi-lock"
                    :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    @click:append-inner="showPassword = !showPassword"
                    variant="outlined"
                    required
                    @keyup.enter="login"
                  ></v-text-field>
                </v-form>
              </v-card-text>
              <v-card-actions class="px-4 pb-4">
                <v-btn
                  :disabled="!valid || loading"
                  :loading="loading"
                  color="primary"
                  @click="login"
                  block
                  size="large"
                >
                  Iniciar Sesión
                </v-btn>
              </v-card-actions>
            </v-card>

            <v-alert v-if="error" type="error" class="mt-4" closable>
              {{ error }}
            </v-alert>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'Login',
  data() {
    return {
      valid: false,
      loading: false,
      showPassword: false,
      error: null,
      credentials: {
        username: '',
        password: ''
      },
      usernameRules: [
        v => !!v || 'El usuario es requerido',
        v => v.length >= 3 || 'El usuario debe tener al menos 3 caracteres'
      ],
      passwordRules: [
        v => !!v || 'La contraseña es requerida',
        v => v.length >= 4 || 'La contraseña debe tener al menos 4 caracteres'
      ]
    }
  },
  setup() {
    const authStore = useAuthStore()
    return { authStore }
  },
  created() {
    // Al entrar a la vista de Login, se limpia cualquier sesión previa.
    // Esto asegura que al recargar en desarrollo siempre se muestre el login,
    // evitando la redirección automática si un token viejo sigue en el estado.
    this.authStore.logout()
  },
  methods: {
    async login() {
      // Validamos el formulario de forma asíncrona
      const { valid } = await this.$refs.form.validate()
      if (!valid) return

      this.loading = true
      this.error = null

      try {
        await this.authStore.login(this.credentials)
        this.$router.push('/dashboard')
      } catch (error) {
        this.error = error.message || 'Error al iniciar sesión'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
