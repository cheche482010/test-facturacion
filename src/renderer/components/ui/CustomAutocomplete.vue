<template>
  <div class="relative">
    <input
      type="text"
      v-model="searchTerm"
      @input="onInput"
      @focus="showOptions = true"
      @blur="onBlur"
      :placeholder="placeholder"
      class="form-input"
    />
    <div
      v-if="showOptions && filteredOptions.length"
      class="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg"
    >
      <ul>
        <li
          v-for="option in filteredOptions"
          :key="option[itemValue]"
          @mousedown="selectOption(option)"
          class="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600"
        >
          {{ option[itemTitle] }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: [String, Number],
  items: {
    type: Array,
    required: true,
  },
  itemTitle: {
    type: String,
    default: 'title',
  },
  itemValue: {
    type: String,
    default: 'value',
  },
  placeholder: String,
});

const emit = defineEmits(['update:modelValue']);

const searchTerm = ref('');
const showOptions = ref(false);

const filteredOptions = computed(() => {
  if (!searchTerm.value) {
    return props.items;
  }
  return props.items.filter((item) =>
    item[props.itemTitle].toLowerCase().includes(searchTerm.value.toLowerCase())
  );
});

const selectOption = (option) => {
  searchTerm.value = option[props.itemTitle];
  emit('update:modelValue', option[props.itemValue]);
  showOptions.value = false;
};

const onInput = () => {
    showOptions.value = true;
    // If the search term does not match any option title, we should clear the modelValue
    const match = props.items.find(item => item[props.itemTitle] === searchTerm.value);
    if (!match) {
        emit('update:modelValue', null);
    }
}

const onBlur = () => {
    // Delay hiding options to allow click event to register
    setTimeout(() => {
        showOptions.value = false;
    }, 200);
}

// When the modelValue is cleared from the parent, clear the search term
watch(() => props.modelValue, (newValue) => {
    if (newValue === null) {
        searchTerm.value = '';
    } else {
        const selected = props.items.find(item => item[props.itemValue] === newValue);
        if (selected) {
            searchTerm.value = selected[props.itemTitle];
        }
    }
});
</script>
