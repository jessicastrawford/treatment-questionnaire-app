<template>
  <div class="min-h-screen flex items-center justify-center p-4 relative">
    <!-- Animated Borders -->
    <div class="text-center w-full relative z-10">
      <div
        class="border-expand-top absolute top-0 left-1/2 transform -translate-x-1/2 h-px bg-gray-400 transition-all duration-1000 ease-out"
        :class="isAnimating ? 'w-full' : 'w-0'"
      ></div>
      <div class="p-12">
        <h1 class="text-4xl text-gray-900 mb-6 font-bold">
          {{ store.questionnaireData?.meta.title }}
        </h1>
        <p class="text-xl text-gray-700 mb-6">
          {{ store.questionnaireData?.meta.description }}
        </p>

        <ButtonComponent @click="handleStartquestionnaire" size="medium" variant="primary">
          Get Started
        </ButtonComponent>
      </div>
      <div
        class="border-expand-bottom absolute bottom-0 left-1/2 transform -translate-x-1/2 h-px bg-gray-400 transition-all duration-1000 ease-out"
        :class="isAnimating ? 'w-full' : 'w-0'"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useQuestionnaireStore } from "@/stores/questionnaireStore";
import ButtonComponent from "@/components/ui/ButtonComponent.vue";

const router = useRouter();
const store = useQuestionnaireStore();
const isAnimating = ref(false);

onMounted(async () => {
  await store.loadQuestionnaire();
});

//DO I NEED TO CLEAN UP HERE?
function handleStartquestionnaire() {
  // Start the border animation
  isAnimating.value = true;

  // After animation completes, navigate to questionnaire
  setTimeout(() => {
    router.push("/questionnaire");
  }, 1200);
}
</script>

<style scoped>
.border-expand-top,
.border-expand-bottom {
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
