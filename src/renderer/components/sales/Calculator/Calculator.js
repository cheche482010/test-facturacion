import { ref } from 'vue'

export default {
  emits: ['result'],
  setup(props, { emit }) {
    const display = ref('0')
    const previousValue = ref(null)
    const operation = ref(null)
    const waitingForOperand = ref(false)

    const buttons = [
      { label: 'C', value: 'clear', color: 'error', variant: 'tonal' },
      { label: '±', value: 'sign', color: 'warning', variant: 'tonal' },
      { label: '%', value: 'percent', color: 'warning', variant: 'tonal' },
      { label: '÷', value: 'divide', color: 'primary', variant: 'tonal' },
      
      { label: '7', value: '7' },
      { label: '8', value: '8' },
      { label: '9', value: '9' },
      { label: '×', value: 'multiply', color: 'primary', variant: 'tonal' },
      
      { label: '4', value: '4' },
      { label: '5', value: '5' },
      { label: '6', value: '6' },
      { label: '−', value: 'subtract', color: 'primary', variant: 'tonal' },
      
      { label: '1', value: '1' },
      { label: '2', value: '2' },
      { label: '3', value: '3' },
      { label: '+', value: 'add', color: 'primary', variant: 'tonal' },
      
      { label: '0', value: '0', cols: 6 },
      { label: '.', value: 'decimal' },
      { label: '=', value: 'equals', color: 'success', variant: 'tonal' }
    ]

    const handleClick = (value) => {
      switch (value) {
        case 'clear':
          clear()
          break
        case 'sign':
          toggleSign()
          break
        case 'percent':
          percent()
          break
        case 'decimal':
          inputDecimal()
          break
        case 'equals':
          calculate()
          break
        case 'add':
        case 'subtract':
        case 'multiply':
        case 'divide':
          performOperation(value)
          break
        default:
          inputNumber(value)
      }
    }

    const clear = () => {
      display.value = '0'
      previousValue.value = null
      operation.value = null
      waitingForOperand.value = false
    }

    const inputNumber = (num) => {
      if (waitingForOperand.value) {
        display.value = num
        waitingForOperand.value = false
      } else {
        display.value = display.value === '0' ? num : display.value + num
      }
    }

    const inputDecimal = () => {
      if (waitingForOperand.value) {
        display.value = '0.'
        waitingForOperand.value = false
      } else if (display.value.indexOf('.') === -1) {
        display.value += '.'
      }
    }

    const toggleSign = () => {
      if (display.value !== '0') {
        display.value = display.value.startsWith('-') 
          ? display.value.slice(1) 
          : '-' + display.value
      }
    }

    const percent = () => {
      const value = parseFloat(display.value)
      display.value = String(value / 100)
    }

    const performOperation = (nextOperation) => {
      const inputValue = parseFloat(display.value)

      if (previousValue.value === null) {
        previousValue.value = inputValue
      } else if (operation.value) {
        const currentValue = previousValue.value || 0
        const newValue = performCalculation(currentValue, inputValue, operation.value)

        display.value = String(newValue)
        previousValue.value = newValue
      }

      waitingForOperand.value = true
      operation.value = nextOperation
    }

    const performCalculation = (firstValue, secondValue, operation) => {
      switch (operation) {
        case 'add':
          return firstValue + secondValue
        case 'subtract':
          return firstValue - secondValue
        case 'multiply':
          return firstValue * secondValue
        case 'divide':
          return secondValue !== 0 ? firstValue / secondValue : 0
        default:
          return secondValue
      }
    }

    const calculate = () => {
      const inputValue = parseFloat(display.value)

      if (previousValue.value !== null && operation.value) {
        const newValue = performCalculation(previousValue.value, inputValue, operation.value)
        display.value = String(newValue)
        
        emit('result', newValue)
        
        previousValue.value = null
        operation.value = null
        waitingForOperand.value = true
      }
    }

    return {
      display,
      buttons,
      handleClick
    }
  }
}