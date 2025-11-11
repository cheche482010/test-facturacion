import { ref } from 'vue'
import Calculator from '../../components/sales/Calculator/Calculator.vue'
import CurrencyConverter from '../../components/sales/CurrencyConverter/CurrencyConverter.vue'

export default {
    name: 'CalculatorSection',
    components: {
        Calculator,
        CurrencyConverter
    },
    setup() {
        const tab = ref('calculator')

        return {
            tab
        }
    }
}