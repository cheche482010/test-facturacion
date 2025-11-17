<template>
  <v-dialog v-model="dialog" max-width="800px" persistent>
    <v-card>
      <v-card-title class="text-h5 text-center bg-primary text-white">
        <v-icon class="mr-2">mdi-receipt</v-icon>
        Factura de Venta
      </v-card-title>

      <v-card-text v-if="sale" class="pa-6">
        <!-- Encabezado de la factura -->
        <div class="text-center mb-6">
          <h2 class="text-h4 font-weight-bold">{{ company.name }}</h2>
          <p class="text-body-1">{{ company.address }}</p>
          <p class="text-body-2">RIF: {{ company.rif }} | Tel: {{ company.phone }}</p>
          <div class="mt-4">
            <p class="text-h6 font-weight-bold">Factura #{{ sale.saleNumber }}</p>
            <p class="text-body-2">Fecha: {{ formatDate(sale.sale_date) }}</p>
          </div>
        </div>

        <v-divider class="my-4"></v-divider>

        <!-- Detalles del cliente y usuario -->
        <v-row class="mb-4">
          <v-col cols="6">
            <div class="text-subtitle-2 font-weight-bold">Atendido por:</div>
            <div>{{ sale.user?.firstName }} {{ sale.user?.lastName }}</div>
          </v-col>
          <v-col cols="6">
            <div class="text-subtitle-2 font-weight-bold">Cliente:</div>
            <div>Cliente General</div>
          </v-col>
        </v-row>

        <!-- Tabla de productos -->
        <div class="mb-4">
          <div class="text-subtitle-1 font-weight-bold mb-2">Productos</div>
          <table class="product-table border">
            <thead>
              <tr>
                <th style="width: 35%">Producto</th>
                <th style="width: 20%; text-align: end">Precio Unit.</th>
                <th style="width: 10%; text-align: center">Cant.</th>
                <th style="width: 17%; text-align: end">Total USD</th>
                <th style="width: 18%; text-align: end">Total Bs</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in sale.items || []" :key="item.id">
                <td>{{ item.product?.name || 'Producto no encontrado' }}</td>
                <td style="text-align: end">{{ formatCurrency(item.unitPriceBs / exchangeRate, 'USD') }}</td>
                <td style="text-align: center">{{ Math.floor(item.quantity) }}</td>
                <td style="text-align: end">{{ formatCurrency((item.unitPriceBs / exchangeRate) * item.quantity, 'USD') }}</td>
                <td style="text-align: end">{{ formatCurrency(item.subtotalBs, 'VES') }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="2"><strong>Total</strong></td>
                <td style="text-align: center"><strong>{{ totalQuantity }}</strong></td>
                <td style="text-align: end"><strong>{{ formatCurrency(sale.totalUsd, 'USD') }}</strong></td>
                <td style="text-align: end"><strong>{{ formatCurrency(sale.totalBs, 'VES') }}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Métodos de pago -->
        <div class="mb-4" v-if="sale.payments && sale.payments.length > 0">
          <div class="text-subtitle-1 font-weight-bold mb-2">Métodos de Pago</div>
          <table class="payment-table border">
            <thead>
              <tr>
                <th style="width: 30%">Método</th>
                <th style="width: 25%; text-align: end">Monto</th>
                <th style="width: 25%; text-align: center">Referencia</th>
                <th style="width: 20%; text-align: center">Nota</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="payment in sale.payments" :key="payment.id">
                <td>
                  <v-icon class="mr-2" size="small">{{ getIconForMethod(payment.paymentMethod?.name) }}</v-icon>
                  {{ payment.paymentMethod?.name }}
                </td>
                <td style="text-align: end">{{ formatCurrency(payment.amount, payment.paymentMethod?.name?.toLowerCase().includes('usd') ? 'USD' : 'VES') }}</td>
                <td style="text-align: center">{{ payment.reference || '-' }}</td>
                <td style="text-align: center">{{ payment.notes || '-' }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="3"><strong>Total Pagado</strong></td>
                <td style="text-align: end"><strong>{{ formatCurrency(totalPaid, 'VES') }}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Cambio -->
        <div v-if="changeAmount > 0">
          <div class="text-subtitle-2 font-weight-bold">Cambio:</div>
          <div class="text-body-2">Se dio cambio de {{ formatCurrency(changeAmount, changeCurrency) }}</div>
        </div>

        <!-- Totales -->
        <v-row>
          <v-col cols="8"></v-col>
          <v-col cols="4">
            <v-card variant="outlined" class="pa-3">
              <div class="d-flex justify-space-between mb-2">
                <span class="font-weight-medium">Subtotal USD:</span>
                <span>{{ formatCurrency(sale.totalUsd, 'USD') }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="font-weight-medium">Total Bs:</span>
                <span class="font-weight-bold">{{ formatCurrency(sale.totalBs, 'VES') }}</span>
              </div>
              <v-divider class="my-2"></v-divider>
              <div class="d-flex justify-space-between">
                <span class="font-weight-bold text-primary">TOTAL PAGADO:</span>
                <span class="font-weight-bold text-primary">{{ formatCurrency(sale.totalBs, 'VES') }}</span>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Notas -->
        <div v-if="sale.notes" class="mt-4">
          <div class="text-subtitle-2 font-weight-bold">Notas:</div>
          <div class="text-body-2">{{ sale.notes }}</div>
        </div>
      </v-card-text>

      <v-card-actions v-if="sale" class="pa-4 bg-grey-lighten-4">
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          variant="outlined"
          @click="printReceipt"
          class="mr-2"
        >
          <v-icon class="mr-2">mdi-printer</v-icon>
          Imprimir
        </v-btn>
        <v-btn
          color="success"
          variant="flat"
          @click="completeSale"
          :loading="completing"
        >
          <v-icon class="mr-2">mdi-check</v-icon>
          Completar Venta
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'SaleReceiptDialog',
  props: {
    modelValue: Boolean,
    sale: Object,
    exchangeRate: {
      type: Number,
      default: 1
    }
  },
  emits: ['update:modelValue', 'sale-completed'],
  data() {
    return {
      completing: false,
      company: {
        name: 'Mi Empresa',
        rif: 'J-12345678-9',
        address: 'Dirección de la empresa',
        phone: '0212-1234567'
      }
    }
  },
  computed: {
    dialog: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    },
    totalQuantity() {
      if (!this.sale?.items) return 0
      return this.sale.items.reduce((sum, item) => sum + Math.floor(item.quantity), 0)
    },
    totalPaid() {
      if (!this.sale?.payments) return 0
      return this.sale.payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0)
    },
    changeAmount() {
      return this.totalPaid - parseFloat(this.sale?.totalBs || 0)
    },
    changeCurrency() {
      if (this.changeAmount <= 0) return null
      // Asumir que el cambio se da en la moneda del último pago
      const lastPayment = this.sale.payments[this.sale.payments.length - 1]
      return lastPayment?.paymentMethod?.name?.toLowerCase().includes('usd') ? 'USD' : 'VES'
    }
  },
  methods: {
    formatDate(date) {
      return new Date(date).toLocaleDateString('es-VE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    formatCurrency(amount, currency = 'VES') {
      return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: currency
      }).format(amount)
    },
    getIconForMethod(name) {
      const icons = {
        'Efectivo BS': 'mdi-cash',
        'Efectivo USD': 'mdi-cash-multiple',
        'Transferencia': 'mdi-bank-transfer',
        'POS': 'mdi-credit-card-chip',
        'Pago Móvil': 'mdi-cellphone',
        'Crédito': 'mdi-credit-card'
      }
      return icons[name] || 'mdi-cash'
    },
    printReceipt() {
      window.print()
    },
    async completeSale() {
      this.completing = true
      try {
        this.$emit('sale-completed')
        this.dialog = false
      } catch (error) {
        console.error('Error completando venta:', error)
      } finally {
        this.completing = false
      }
    }
  }
}
</script>

<style scoped>
.product-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
}

.product-table th,
.product-table td {
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  font-size: 0.875rem;
}

.product-table th {
  background-color: #f5f5f5;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.87);
}



.product-table .total-row td {
  font-weight: bold;
}

.payment-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
}

.payment-table th,
.payment-table td {
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  font-size: 0.875rem;
}

.payment-table th {
  background-color: #f5f5f5;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.87);
}

@media print {
  .v-card-actions {
    display: none !important;
  }
  .v-dialog {
    position: static !important;
    box-shadow: none !important;
  }
  .product-table {
    font-size: 12px;
  }
}
</style>