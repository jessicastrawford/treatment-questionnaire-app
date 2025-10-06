<!-- src/views/QuestionnaireView.vue -->
<template>
  <!-- Loading State -->
  <div v-if="store.isLoading" class="flex min-h-screen items-center justify-center">
    <div class="text-center">
      <div class="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-orange-500"></div>
      <p class="mt-4 text-gray-700">Loading your questionnaire...</p>
    </div>
  </div>

  <!-- Main Questionnaire Interface -->
  <div v-else-if="store.currentQuestion || store.resultPageIds.length > 0" class="fade-in min-h-screen lg:flex">
    <TreatmentProgressSidebar />
    <div class="flex-1">
      <ResultsPage v-if="store.resultPageIds.length > 0 && !store.isInFilteringFlow" onClick="" />
      <QuestionComponent
        v-else
        :question="store.currentQuestion"
        :has-progress="store.hasProgress"
        :progress-percentage="store.progress.percentage"
        @answer="handleAnswer"
        @back="handleBack"
      />
    </div>
  </div>

  <!-- Error State -->
  <div v-else-if="store.error" class="flex min-h-screen items-center justify-center bg-red-50 p-4">
    <div class="max-w-lg text-center">
      <div class="rounded-lg border border-red-200 bg-white p-8 shadow-lg">
        <h2 class="mb-4 text-2xl font-semibold text-red-600">Something went wrong</h2>
        <p class="mb-6 text-red-500">{{ store.error }}</p>
        <button
          @click="store.loadQuestionnaire()"
          class="rounded-lg bg-red-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-600"
        >
          Try Again
        </button>
      </div>
    </div>
  </div>

  <!-- No Question State (shouldn't normally happen) -->
  <div v-else class="flex min-h-screen items-center justify-center">
    <div class="text-center">
      <h2 class="mb-4 text-xl text-gray-600">questionnaire not ready</h2>
      <button @click="restartQuestionnaire()" class="text-orange-600 underline hover:text-orange-700">
        Return to start
      </button>
    </div>
  </div>
  <ModalComponent :isOpen="showSessionModal">
    <div>you have a session</div>
  </ModalComponent>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useQuestionnaireStore } from "@/stores/questionnaireStore";
import QuestionComponent from "@/components/questionnaire/QuestionComponent.vue";
import TreatmentProgressSidebar from "@/components/layout/TreatmentProgressSidebar.vue";
import ResultsPage from "@/components/questionnaire/ResultsPage.vue";
import ModalComponent from "@/components/ui/ModalComponent.vue";

const store = useQuestionnaireStore();

const showSessionModal = ref(false);

onMounted(async () => {
  // Load questionnaire data if not already loaded
  if (!store.questionnaireData) {
    await store.loadQuestionnaire();
  }
});

function handleAnswer(selectedValue: string[]) {
  // Was going to add a check whether selectedValue is available or not for appropriate returning out and error handling, but in this casse I am going to trust the disabled functionality on the button, as this is set to be disabled if there are no values in the selectedValue array, only in very rare edge cases would this fail.
  const result = store.answerQuestion(selectedValue);

  if (!result) {
    console.error("Answer processing failed unexpectedly");
  }
}

function restartQuestionnaire() {
  store.resetQuestionnaire();
}

function handleBack() {
  store.goBack();
}
</script>

<style scoped>
.fade-in {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
