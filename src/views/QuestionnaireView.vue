<!-- src/views/QuestionnaireView.vue -->
<template>
  <!-- Loading State -->
  <div v-if="store.isLoading" class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
      <p class="mt-4 text-gray-700">Loading your questionnaire...</p>
    </div>
  </div>

  <!-- Main Questionnaire Interface -->
  <div v-else-if="store.currentQuestion || store.resultPageIds.length > 0" class="min-h-screen flex fade-in">
    <TreatmentProgressSidebar />
    <div class="flex-1">
      <ResultsPage v-if="store.resultPageIds.length > 0 && !store.isInFilteringFlow" onClick="" />
      <QuestionComponent
        v-else
        :question="store.currentQuestion!"
        :has-progress="store.hasProgress"
        :progress-percentage="store.progress.percentage"
        @answer="handleAnswer"
        @back="handleBack"
      />
    </div>
  </div>

  <!-- Error State -->
  <div v-else-if="store.error" class="min-h-screen bg-red-50 flex items-center justify-center p-4">
    <div class="text-center max-w-lg">
      <div class="bg-white border border-red-200 rounded-lg p-8 shadow-lg">
        <h2 class="text-2xl font-semibold text-red-600 mb-4">Something went wrong</h2>
        <p class="text-red-500 mb-6">{{ store.error }}</p>
        <button
          @click="store.loadQuestionnaire()"
          class="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  </div>

  <!-- No Question State (shouldn't normally happen) -->
  <div v-else class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <h2 class="text-xl text-gray-600 mb-4">questionnaire not ready</h2>
      <button @click="restartQuestionnaire()" class="text-orange-600 hover:text-orange-700 underline">
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
