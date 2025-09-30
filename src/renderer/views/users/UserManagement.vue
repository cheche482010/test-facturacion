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
import userManagementLogic from './UserManagement.js'

export default userManagementLogic
</script>
