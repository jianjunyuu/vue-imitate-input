<script setup lang="ts">
import { ref } from 'vue'
import ImitateInput from './components/ImitateInput.vue'

const value = ref(10)
</script>

<template>
  {{ value }}
  <input v-model.number:value="value">
  <ImitateInput
    :value="Number(value)"
    :precision="0"
    unit="%" @input="v => value = v"
  />
</template>
