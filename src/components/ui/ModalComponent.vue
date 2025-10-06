<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm"
    @click="handleBackdropClick"
  >
    <div class="relative mx-4 max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl" @click.stop>
      <button
        v-if="showCloseButton"
        @click="$emit('close')"
        class="absolute top-4 right-4 z-10 cursor-pointer text-gray-400 transition-colors hover:text-gray-600"
      >
        <i class="pi pi-times"></i>
      </button>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isOpen: boolean;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showCloseButton: true,
  closeOnBackdrop: true,
});

const emit = defineEmits<{
  close: [];
}>();

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    emit("close");
  }
};
</script>
