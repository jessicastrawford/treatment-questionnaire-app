<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/10"
    @click="handleBackdropClick"
  >
    <div
      class="relative bg-white rounded-lg shadow-xl mx-4 p-6 max-h-[90vh] overflow-y-auto"
      @click.stop
    >
      <button
        v-if="showCloseButton"
        @click="$emit('close')"
        class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10 cursor-pointer"
      >
        <i class="pi pi-times"></i>
      </button>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isOpen: boolean
  showCloseButton?: boolean
  closeOnBackdrop?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showCloseButton: true,
  closeOnBackdrop: true,
})

const emit = defineEmits<{
  close: []
}>()

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    emit('close')
  }
}
</script>
