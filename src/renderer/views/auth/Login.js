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
    this.authStore.logout()
  },
  methods: {
    async login() {
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