<template>
  <div>
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h1 class="text-h5 font-weight-bold">Gestión de Usuarios</h1>
        <p class="text-medium-emphasis">Administra los usuarios del sistema y sus permisos</p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openUserDialog()">
        Nuevo Usuario
      </v-btn>
    </div>

    <!-- Summary Cards -->
    <v-row class="user-management__summary-cards">
      <v-col cols="12" sm="6" md="3">
        <v-card class="d-flex align-center">
          <div class="bg-blue pa-4 ma-4 rounded-lg">
            <v-icon icon="mdi-account-group" size="32" color="white" />
          </div>
          <div class="pa-4">
            <p class="text-h6 font-weight-bold">{{ totalUsers }}</p>
            <p class="text-medium-emphasis">Total Usuarios</p>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="d-flex align-center">
          <div class="bg-green pa-4 ma-4 rounded-lg">
            <v-icon icon="mdi-account-check" size="32" color="white" />
          </div>
          <div class="pa-4">
            <p class="text-h6 font-weight-bold">{{ activeUsers }}</p>
            <p class="text-medium-emphasis">Usuarios Activos</p>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="d-flex align-center">
          <div class="bg-red pa-4 ma-4 rounded-lg">
            <v-icon icon="mdi-account-off" size="32" color="white" />
          </div>
          <div class="pa-4">
            <p class="text-h6 font-weight-bold">{{ inactiveUsers }}</p>
            <p class="text-medium-emphasis">Usuarios Inactivos</p>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="d-flex align-center">
          <div class="bg-purple pa-4 ma-4 rounded-lg">
            <v-icon icon="mdi-shield-account" size="32" color="white" />
          </div>
          <div class="pa-4">
            <p class="text-h6 font-weight-bold">{{ devUsers }}</p>
            <p class="text-medium-emphasis">Usuarios Dev</p>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filtros y búsqueda -->
    <v-card class="user-management__filters">
      <v-card-text>
        <v-row class="d-flex align-center">
          <v-col cols="12" md="4">
            <v-text-field v-model="search" label="Buscar por usuario o nombre..." prepend-inner-icon="mdi-magnify"
              variant="solo-filled" density="compact" flat clearable />
          </v-col>
          <v-col cols="12" md="3">
            <v-select v-model="selectedRole" :items="roleOptions" item-title="text" item-value="value"
              label="Filtrar por rol" variant="solo-filled" density="compact" flat clearable />
          </v-col>
          <v-col cols="12" md="3">
            <v-select v-model="selectedStatus" :items="statusFilterOptions" item-title="text" item-value="value"
              label="Filtrar por estado" variant="solo-filled" density="compact" flat clearable />
          </v-col>
          <v-col cols="12" md="2">
            <v-btn color="primary" variant="outlined" @click="clearFilters">
              Limpiar Filtros
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Tabla de usuarios -->
    <v-card>
      <v-card-item>
        <v-card-title>
          Lista de Usuarios ({{ filteredUsers.length }})
        </v-card-title>
      </v-card-item>
      <v-data-table :headers="headers" :items="filteredUsers" :search="search" :loading="loading" item-value="id" hover
        class="user-management__table">
        <template v-slot:headers>
          <tr>
            <th class="text-left">Usuario</th>
            <th class="text-left">Nombre Completo</th>
            <th class="text-left">Rol</th>
            <th class="text-left">Estado</th>
            <th class="text-left">Último Acceso</th>
            <th class="text-left">Acciones</th>
          </tr>
        </template>

        <template v-slot:item.username="{ item }">
          <div class="font-weight-medium">{{ item.username }}</div>
        </template>

        <template v-slot:item.fullName="{ item }">
          <div>
            <div class="font-weight-medium">{{ item.firstName }} {{ item.lastName }}</div>
            <div class="text-caption text-medium-emphasis">{{ item.email }}</div>
          </div>
        </template>

        <template v-slot:item.role="{ item }">
          <v-chip :color="getRoleColor(item.role)" size="small" variant="flat" label>
            {{ getRoleLabel(item.role) }}
          </v-chip>
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip :color="item.status === 'active' ? 'success' : 'error'" size="small" variant="flat" label>
            {{ item.status === 'active' ? 'Activo' : 'Inactivo' }}
          </v-chip>
        </template>

        <template v-slot:item.lastLogin="{ item }">
          <div class="text-caption">
            {{ item.lastLogin ? formatDate(item.lastLogin) : 'Nunca' }}
          </div>
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="user-management__actions">
            <v-btn icon="mdi-pencil" size="small" variant="text" @click="openUserDialog(item)"></v-btn>
            <v-btn :icon="item.status === 'active' ? 'mdi-account-off' : 'mdi-account-check'" size="small"
              variant="text" :color="item.status === 'active' ? 'warning' : 'success'"
              @click="toggleUserStatus(item)"></v-btn>
            <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="confirmDelete(item)"></v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- User Dialog -->
    <v-dialog v-model="userDialog" max-width="600px">
      <v-card class="user-management__dialog">
        <v-card-title>
          {{ editingUser ? 'Editar Usuario' : 'Nuevo Usuario' }}
        </v-card-title>

        <v-card-text>
          <v-form ref="userForm" v-model="userFormValid">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model="userForm.username" :rules="usernameRules" label="Usuario" required
                  variant="outlined" density="compact"></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model="userForm.firstName" :rules="nameRules" label="Nombre" required variant="outlined"
                  density="compact"></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model="userForm.lastName" :rules="nameRules" label="Apellido" required
                  variant="outlined" density="compact"></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model="userForm.email" :rules="emailRules" label="Email" type="email" required
                  variant="outlined" density="compact"></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-select v-model="userForm.role" :items="roleOptions" :rules="roleRules" label="Rol" required
                  variant="outlined" density="compact"></v-select>
              </v-col>

              <v-col cols="12" md="6">
                <v-select v-model="userForm.isActive" :items="statusOptions" label="Estado" required variant="outlined"
                  density="compact"></v-select>
              </v-col>

              <v-col cols="12" v-if="!editingUser">
                <v-text-field v-model="userForm.password" :rules="passwordRules" type="password" label="Contraseña"
                  required variant="outlined" density="compact"></v-text-field>
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

    <!-- Dialog de confirmación de eliminación -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Confirmar eliminación</v-card-title>
        <v-card-text>
          ¿Está seguro que desea eliminar el usuario "{{ userToDelete?.username }}"?
          <br><br>
          <strong>Esta acción no se puede deshacer.</strong>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" @click="deleteUser">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import userManagementLogic from './UserManagement.js'

export default userManagementLogic
</script>
<style scoped src="./UserManagement.scss"></style>
