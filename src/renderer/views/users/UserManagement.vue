<template>
  <div>
    <v-row class="mb-4">
      <v-col>
        <h2>Gestión de Usuarios</h2>
      </v-col>
      <v-col cols="auto">
        <v-btn color="primary" @click="openUserDialog()">
          <v-icon left>mdi-plus</v-icon>
          Nuevo Usuario
        </v-btn>
      </v-col>
    </v-row>

    <v-card>
      <v-card-title>
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Buscar usuarios..."
          single-line
          hide-details
        ></v-text-field>
      </v-card-title>
      
      <v-data-table
        :headers="headers"
        :items="users"
        :search="search"
        :loading="loading"
        class="elevation-1"
      >
        <template v-slot:item.role="{ item }">
          <v-chip :color="getRoleColor(item.role)" small>
            {{ getRoleLabel(item.role) }}
          </v-chip>
        </template>
        
        <template v-slot:item.status="{ item }">
          <v-chip :color="item.status === 'active' ? 'success' : 'error'" small>
            {{ item.status === 'active' ? 'Activo' : 'Inactivo' }}
          </v-chip>
        </template>
        
        <template v-slot:item.actions="{ item }">
          <v-icon small class="mr-2" @click="openUserDialog(item)">
            mdi-pencil
          </v-icon>
          <v-icon small @click="toggleUserStatus(item)">
            {{ item.status === 'active' ? 'mdi-account-off' : 'mdi-account-check' }}
          </v-icon>
        </template>
      </v-data-table>
    </v-card>

    <!-- User Dialog -->
    <v-dialog v-model="userDialog" max-width="600px">
      <v-card>
        <v-card-title>
          {{ editingUser ? 'Editar Usuario' : 'Nuevo Usuario' }}
        </v-card-title>
        
        <v-card-text>
          <v-form ref="userForm" v-model="userFormValid">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="userForm.username"
                  :rules="usernameRules"
                  label="Usuario"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="userForm.fullName"
                  :rules="nameRules"
                  label="Nombre Completo"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="userForm.role"
                  :items="roleOptions"
                  :rules="roleRules"
                  label="Rol"
                  required
                ></v-select>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="userForm.status"
                  :items="statusOptions"
                  label="Estado"
                  required
                ></v-select>
              </v-col>
              
              <v-col cols="12" v-if="!editingUser">
                <v-text-field
                  v-model="userForm.password"
                  :rules="passwordRules"
                  type="password"
                  label="Contraseña"
                  required
                ></v-text-field>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeUserDialog">Cancelar</v-btn>
          <v-btn color="primary" :loading="saving" @click="saveUser">
            {{ editingUser ? 'Actualizar' : 'Crear' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
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
</script>
