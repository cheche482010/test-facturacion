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
      deleteDialog: false,
      statusDialog: false,
      userFormValid: false,
      editingUser: null,
      userToDelete: null,
      userToToggle: null,
      selectedRole: null,
      selectedStatus: null,
      userForm: {
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        role: 'cajero',
        isActive: true,
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
        { text: 'Cajero', value: 'cajero' },
        { text: 'Administrador', value: 'administrador' },
        { text: 'Dev', value: 'dev' }
      ],
      statusOptions: [
        { text: 'Activo', value: true },
        { text: 'Inactivo', value: false }
      ],
      statusFilterOptions: [
        { text: 'Todos', value: null },
        { text: 'Activo', value: 'active' },
        { text: 'Inactivo', value: 'inactive' }
      ],
      usernameRules: [
        v => !!v || 'El usuario es requerido',
        v => v.length >= 3 || 'Mínimo 3 caracteres'
      ],
      nameRules: [
        v => !!v || 'Este campo es requerido',
        v => v.length >= 2 || 'Mínimo 2 caracteres'
      ],
      emailRules: [
        v => !!v || 'El email es requerido',
        v => /.+@.+\..+/.test(v) || 'Email inválido'
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
    },

    filteredUsers() {
      let filtered = this.users

      if (this.selectedRole) {
        filtered = filtered.filter(user => user.role === this.selectedRole)
      }

      if (this.selectedStatus) {
        filtered = filtered.filter(user => user.status === this.selectedStatus)
      }

      return filtered
    },

    totalUsers() {
      return this.users.length
    },

    activeUsers() {
      return this.users.filter(user => user.status === 'active').length
    },

    inactiveUsers() {
      return this.users.filter(user => user.status === 'inactive').length
    },

    devUsers() {
      return this.users.filter(user => user.role === 'dev').length
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
        console.error('Error al cargar usuarios:', error)
        alert('Error al cargar usuarios')
      } finally {
        this.loading = false
      }
    },

    openUserDialog(user = null) {
      this.editingUser = user
      if (user) {
        this.userForm = {
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isActive: user.status === 'active',
          password: ''
        }
      } else {
        this.userForm = {
          username: '',
          firstName: '',
          lastName: '',
          email: '',
          role: 'cajero',
          isActive: true,
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

    confirmDelete(user) {
      this.userToDelete = user
      this.deleteDialog = true
    },

    async deleteUser() {
      try {
        await this.usersStore.deleteUser(this.userToDelete.id)
        alert('Usuario eliminado exitosamente')
        this.deleteDialog = false
        this.userToDelete = null
      } catch (error) {
        console.error('Error al eliminar usuario:', error)
        alert('Error al eliminar usuario')
      }
    },

    clearFilters() {
      this.selectedRole = null
      this.selectedStatus = null
      this.search = ''
    },

    formatDate(dateString) {
      if (!dateString) return 'Nunca'
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    async saveUser() {
      if (!this.$refs.userForm.validate()) return

      this.saving = true
      try {
        if (this.editingUser) {
          await this.usersStore.updateUser(this.editingUser.id, this.userForm)
          alert('Usuario actualizado')
        } else {
          await this.usersStore.createUser(this.userForm)
          alert('Usuario creado')
        }
        this.closeUserDialog()
      } catch (error) {
        console.error('Error al guardar usuario:', error)
        alert(error.message || 'Error al guardar usuario')
      } finally {
        this.saving = false
      }
    },

    confirmToggleUserStatus(user) {
      if (this.isCurrentUser(user)) {
        alert('No puedes desactivar tu propio usuario')
        return
      }
      this.userToToggle = user
      this.statusDialog = true
    },

    async toggleUserStatus() {
      const user = this.userToToggle
      try {
        const newStatus = user.isActive ? false : true
        await this.usersStore.updateUser(user.id, { isActive: newStatus })
        alert(`Usuario ${newStatus ? 'activado' : 'desactivado'}`)
        this.statusDialog = false
        this.userToToggle = null
      } catch (error) {
        console.error('Error al cambiar estado del usuario:', error)
        alert('Error al cambiar estado del usuario')
      }
    },

    getRoleColor(role) {
      const colors = {
        cajero: 'blue',
        administrador: 'red',
        dev: 'purple'
      }
      return colors[role] || 'grey'
    },

    getRoleLabel(role) {
      const labels = {
        cajero: 'Cajero',
        administrador: 'Administrador',
        dev: 'Dev'
      }
      return labels[role] || role
    },

    isCurrentUser(user) {
      return this.authStore.user && this.authStore.user.id === user.id
    }
  }
}