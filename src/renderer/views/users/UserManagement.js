import { useUsersStore } from '@/stores/users'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'UserManagement',
  data() {
    return {
      search: '',
      loading: false,
      saving: false,
      userDialog: false,
      userFormValid: false,
      editingUser: null,
      userForm: {
        username: '',
        fullName: '',
        role: 'cashier',
        status: 'active',
        password: ''
      },
      headers: [
        { text: 'Usuario', value: 'username' },
        { text: 'Nombre', value: 'fullName' },
        { text: 'Rol', value: 'role' },
        { text: 'Estado', value: 'status' },
        { text: 'Último Acceso', value: 'lastLogin' },
        { text: 'Acciones', value: 'actions', sortable: false }
      ],
      roleOptions: [
        { text: 'Administrador', value: 'admin' },
        { text: 'Cajero', value: 'cashier' },
        { text: 'Supervisor', value: 'supervisor' }
      ],
      statusOptions: [
        { text: 'Activo', value: 'active' },
        { text: 'Inactivo', value: 'inactive' }
      ],
      usernameRules: [
        v => !!v || 'El usuario es requerido',
        v => v.length >= 3 || 'Mínimo 3 caracteres'
      ],
      nameRules: [
        v => !!v || 'El nombre es requerido'
      ],
      roleRules: [
        v => !!v || 'El rol es requerido'
      ],
      passwordRules: [
        v => !!v || 'La contraseña es requerida',
        v => v.length >= 4 || 'Mínimo 4 caracteres'
      ]
    }
  },
  setup() {
    const usersStore = useUsersStore()
    const authStore = useAuthStore()
    return { usersStore, authStore }
  },
  computed: {
    users() {
      return this.usersStore.users
    }
  },
  async mounted() {
    await this.loadUsers()
  },
  methods: {
    async loadUsers() {
      this.loading = true
      try {
        await this.usersStore.fetchUsers()
      } catch (error) {
        this.$toast.error('Error al cargar usuarios')
      } finally {
        this.loading = false
      }
    },
    
    openUserDialog(user = null) {
      this.editingUser = user
      if (user) {
        this.userForm = { ...user, password: '' }
      } else {
        this.userForm = {
          username: '',
          fullName: '',
          role: 'cashier',
          status: 'active',
          password: ''
        }
      }
      this.userDialog = true
    },
    
    closeUserDialog() {
      this.userDialog = false
      this.editingUser = null
      this.$refs.userForm?.resetValidation()
    },
    
    async saveUser() {
      if (!this.$refs.userForm.validate()) return
      
      this.saving = true
      try {
        if (this.editingUser) {
          await this.usersStore.updateUser(this.editingUser.id, this.userForm)
          this.$toast.success('Usuario actualizado')
        } else {
          await this.usersStore.createUser(this.userForm)
          this.$toast.success('Usuario creado')
        }
        this.closeUserDialog()
      } catch (error) {
        this.$toast.error(error.message || 'Error al guardar usuario')
      } finally {
        this.saving = false
      }
    },
    
    async toggleUserStatus(user) {
      try {
        const newStatus = user.status === 'active' ? 'inactive' : 'active'
        await this.usersStore.updateUser(user.id, { status: newStatus })
        this.$toast.success(`Usuario ${newStatus === 'active' ? 'activado' : 'desactivado'}`)
      } catch (error) {
        this.$toast.error('Error al cambiar estado del usuario')
      }
    },
    
    getRoleColor(role) {
      const colors = {
        admin: 'red',
        supervisor: 'orange',
        cashier: 'blue'
      }
      return colors[role] || 'grey'
    },
    
    getRoleLabel(role) {
      const labels = {
        admin: 'Administrador',
        supervisor: 'Supervisor',
        cashier: 'Cajero'
      }
      return labels[role] || role
    }
  }
}