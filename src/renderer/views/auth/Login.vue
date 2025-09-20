<template>
  <v-container fluid class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>Sistema de Facturación</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form ref="form" v-model="valid" lazy-validation>
              <v-text-field
                v-model="credentials.username"
                :rules="usernameRules"
                label="Usuario"
                prepend-icon="mdi-account"
                required
                @keyup.enter="login"
              ></v-text-field>
              
              <v-text-field
                v-model="credentials.password"
                :rules="passwordRules"
                :type="showPassword ? 'text' : 'password'"
                label="Contraseña"
                prepend-icon="mdi-lock"
                :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append="showPassword = !showPassword"
                required
                @keyup.enter="login"
              ></v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              :disabled="!valid || loading"
              :loading="loading"
              color="primary"
              @click="login"
            >
              Iniciar Sesión
            </v-btn>
          </v-card-actions>
        </v-card>
        
        <v-alert
          v-if="error"
          type="error"
          class="mt-4"
          dismissible
          @input="error = null"
        >
          {{ error }}
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
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
  async mounted() {
    // Check if already authenticated
    if (this.authStore.isAuthenticated) {
      this.$router.push('/dashboard')
    }
  },
  methods: {
    async login() {
      if (!this.$refs.form.validate()) return
      
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
