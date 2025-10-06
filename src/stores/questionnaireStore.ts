// src/stores/questionnaireStore.ts
import { ref, computed, readonly } from "vue";
import { defineStore } from "pinia";
import { useRoute, useRouter } from "vue-router";
import type { QuestionnaireData } from "@/types/Questionnaire";
import { QuestionnaireService } from "@/services/QuestionnaireService";
import { processQuestionAnswer } from "@/utils/navigationHelper";
import { FilteringService } from "@/services/FilteringService";
import { FILTERING_QUESTIONS_CONFIG } from "@/config/FilteringQuestions";
import type { Treatment } from "@/types/Questionnaire";

export const useQuestionnaireStore = defineStore(
  "questionnaire",
  () => {
    const route = useRoute();
    const router = useRouter();
    const questionnaireService = new QuestionnaireService();

    // =============================================================================
    // Core data and loading questionnaire
    // ============================================================================

    const questionnaireData = ref<QuestionnaireData | null>(null);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    async function loadQuestionnaire() {
      isLoading.value = true;
      error.value = null;

      try {
        const data = await questionnaireService.fetchQuestionnaire();
        questionnaireData.value = data;
      } catch (err) {
        error.value = err instanceof Error ? err.message : "Failed to load questionnaire";
        console.error("Error loading questionnaire:", err);
      } finally {
        isLoading.value = false;
      }
    }

    // =============================================================================
    // URL PERSISTENCE
    // =============================================================================

    const answers = ref<Map<string, { values: string[]; displayText: string[]; isFiltering?: boolean }>>(new Map());
    const resultPageIds = ref<string[]>([]);
    const navigationHistory = ref<string[]>([]);

    const currentQuestionId = computed({
      get(): string | null {
        // Try URL first for questionnairedata
        const urlQuestion = route.query.question as string;

        if (urlQuestion && FILTERING_QUESTIONS_CONFIG.find((q) => q.id === urlQuestion)) {
          return urlQuestion;
        }

        if (!questionnaireData.value) return null;

        if (urlQuestion && questionnaireData.value?.questions[urlQuestion]) {
          return urlQuestion;
        }

        // Check if on results page
        if (route.query.results === "true") {
          return "results";
        }

        // Fall back to start question
        return questionnaireData.value?.meta?.startQuestion || null;
      },
      //using new value questionId from currentQuestionId and setting it to the params as we move through the questionnaire
      set(questionId: string | null) {
        // create a copy of current URL query parameters to preserve other params
        // (future-proofing for analytics, theming, etc.) not required for this stage but good for future proofing.
        const newQuery = { ...route.query };

        //navigating to results page: transform URL structure
        if (questionId === "results") {
          delete newQuery.question; //remove question from the params
          newQuery.results = "true"; // then add the results to the params

          if (resultPageIds.value.length > 0) {
            newQuery.resultIds = resultPageIds.value.join(","); // i've added the result ids to the params so that the link could be shared - they might need to share the link with the clinic as an example
          }

          //otherwise if we're in the questionnaire (either from the back button or normally) continue adding the question params to the url and delete any reference to the results
        } else if (questionId) {
          newQuery.question = questionId;
          delete newQuery.results;
          delete newQuery.resultIds;
        } else {
          //otherwise if not in results or questionniare (i.e starting again) remove all para
          delete newQuery.question;
          delete newQuery.results;
          delete newQuery.resultIds;
        }

        // Performance optimization: only trigger router update if URL actually changes
        // Prevents unnecessary re-renders and duplicate browser history entries
        if (JSON.stringify(newQuery) !== JSON.stringify(route.query)) {
          router.push({ query: newQuery });
        }
      },
    });

    // =============================================================================
    // Question computed properties
    // =============================================================================

    const isInFilteringFlow = ref(false);
    const filteringService = new FilteringService();
    const currentlyFilteredTreatments = ref<Treatment[]>([]);

    const currentQuestion = computed(() => {
      // Handle filtering questions first

      if (currentQuestionId.value && FILTERING_QUESTIONS_CONFIG.find((q) => q.id === currentQuestionId.value)) {
        return currentFilteringQuestion.value;
      }

      if (!questionnaireData.value) return null;

      // Handle regular database questions
      if (currentQuestionId.value && questionnaireData.value.questions[currentQuestionId.value]) {
        return questionnaireData.value.questions[currentQuestionId.value];
      }

      return null;
    });

    const currentFilteringQuestion = computed(() => {
      if (!isInFilteringFlow.value || !currentQuestionId.value) {
        return null;
      }

      const question = filteringService.generateQuestion(currentQuestionId.value, currentlyFilteredTreatments.value);

      if (!question) {
        // Invalid question detected - let user manually skip via UI
        console.warn(`Invalid question detected: ${currentQuestionId.value}`);
        // Could show a - skip question button in UI instead of auto-skipping <- logic to be implemented
      }

      return question;
    });

    // =============================================================================
    // Question Actions
    // =============================================================================

    function answerQuestion(selectedValues: string[]) {
      if (!currentQuestion.value || selectedValues.length === 0) return false;

      // ✅ Handle filtering questions
      if (isInFilteringFlow.value && currentQuestionId.value) {
        return handleFilteringAnswer(selectedValues);
      }

      // ✅ Handle regular questions
      return handleRegularAnswer(selectedValues);
    }

    function handleFilteringAnswer(selectedValues: string[]) {
      if (!currentQuestion.value || selectedValues.length === 0) return false;

      // Use service to get next question

      answers.value.set(currentQuestion.value.id, {
        values: selectedValues,
        displayText: selectedValues, // or transform as needed
        isFiltering: true,
      });

      const nextQuestionId = filteringService.getNextQuestionId(currentQuestion.value.id);

      // Apply filters immediately and store result
      updateCurrentlyFilteredTreatments();
      const questionId = currentQuestionId.value;
      if (!questionId) return;

      if (nextQuestionId) {
        navigationHistory.value.push(questionId);
        currentQuestionId.value = nextQuestionId;
      } else {
        // Filtering complete - go to results
        isInFilteringFlow.value = false; //set here to false to distinguise that we are now not in the filtering flow when entering results
        currentQuestionId.value = null;
        currentQuestionId.value = "results";
      }

      return true;
    }

    function handleRegularAnswer(selectedValues: string[]) {
      if (!currentQuestion.value || selectedValues.length === 0) return false;

      navigationHistory.value.push(currentQuestion.value.id);

      const navigation = processQuestionAnswer(selectedValues, currentQuestion.value!.options || [], {
        questions: questionnaireData.value?.questions || {},
        results: questionnaireData.value?.results || {},
      });

      answers.value.set(currentQuestion.value.id, {
        values: selectedValues,
        displayText: navigation.displayTexts,
      });

      // Check if we should start filtering here we need to update the navigation history and the result ids.
      if (navigation.shouldShowFilteringQuestions) {
        isInFilteringFlow.value = true;
        currentQuestionId.value = filteringService.getFirstQuestionId();
        // navigationHistory.value.push(currentQuestion.value);
        resultPageIds.value = navigation.resultPageIds;
        updateCurrentlyFilteredTreatments();
      } else {
        currentQuestionId.value = navigation.nextDestination;
      }

      return true;
    }

    function deleteAnswerFor(questionId: string | undefined) {
      if (!questionId) return;
      if (answers.value.has(questionId)) {
        answers.value.delete(questionId);
      }
    }

    // =============================================================================
    // Filtering Actions
    // =============================================================================

    function updateCurrentlyFilteredTreatments() {
      if (!questionnaireData.value || resultPageIds.value.length === 0) {
        currentlyFilteredTreatments.value = [];
        return;
      }

      const questionnaire = questionnaireData.value; // Cache the reference

      const treatments = getUniqueTreatmentIds(questionnaireData.value, resultPageIds.value)
        .map((id) => questionnaire.treatments[id])
        .filter(Boolean);

      const filteredTreatments = filteringService.applyAllFilters(treatments, answers.value);
      currentlyFilteredTreatments.value = filteredTreatments;
    }

    function getUniqueTreatmentIds(questionnaireData: QuestionnaireData, resultPageIds: string[]) {
      const treatmentSet = new Set<string>();

      for (const pageId of resultPageIds) {
        const resultPage = questionnaireData.results[pageId];
        if (resultPage?.treatments) {
          for (const treatment of resultPage.treatments) {
            treatmentSet.add(treatment);
          }
        }
      }
      return Array.from(treatmentSet);
    }

    // =============================================================================
    // Navigation Actions
    // =============================================================================

    const hasProgress = computed(() => {
      if (currentQuestionId.value === "results") return true;
      return navigationHistory.value.length > 0;
    });

    const progress = computed(() => {
      const totalQuestions = Object.keys(questionnaireData.value?.questions || {}).length;
      const completedQuestions = answers.value.size;

      return {
        current: completedQuestions + 1,
        total: totalQuestions,
        percentage: totalQuestions > 0 ? Math.round(((completedQuestions + 1) / totalQuestions) * 100) : 0,
      };
    });

    function goBack(): boolean {
      // Safety check
      if (navigationHistory.value.length === 0) {
        console.warn("No navigation history - cannot go back");
        return false;
      }

      // Special-case: user is on the results page
      if (currentQuestionId.value === "results") {
        const lastQuestionId = navigationHistory.value[navigationHistory.value.length - 1];
        deleteAnswerFor(lastQuestionId);
        resultPageIds.value = [];
        router.back();
        return true;
      }

      if (isInFilteringFlow.value) {
        updateCurrentlyFilteredTreatments();
      }

      // Regular question page: remove the last question and its answer
      const prevId = navigationHistory.value.pop(); // Safe due to length check above
      deleteAnswerFor(prevId);

      router.back();
      return true;
    }

    function resetQuestionnaire() {
      answers.value.clear();
      resultPageIds.value = [];
      navigationHistory.value = [];
      error.value = null;
      currentlyFilteredTreatments.value = [];
      currentQuestionId.value = questionnaireData.value?.meta?.startQuestion || null;
    }

    return {
      questionnaireData: readonly(questionnaireData),
      currentQuestion,
      currentQuestionId: readonly(currentQuestionId),
      answers: answers,
      resultPageIds: resultPageIds,
      navigationHistory: navigationHistory,
      isLoading: readonly(isLoading),
      error: readonly(error),
      isInFilteringFlow,
      hasProgress,
      currentlyFilteredTreatments,
      progress,
      loadQuestionnaire,
      answerQuestion,
      goBack,
      resetQuestionnaire,
    };
  },
  {
    persist: {
      key: "questionnaire",
      storage: localStorage,
      pick: ["answers", "navigationHistory", "resultPageIds", "isInFilteringFlow", "currentlyFilteredTreatments"],
      serializer: {
        serialize: (state) => {
          const serialized = { ...state };
          if (state.answers instanceof Map) {
            serialized.answers = Array.from(state.answers.entries());
          }
          return JSON.stringify(serialized);
        },
        deserialize: (value) => {
          const parsed = JSON.parse(value);
          if (parsed.answers && Array.isArray(parsed.answers)) {
            parsed.answers = new Map(parsed.answers);
          }
          return parsed;
        },
      },
    },
  },
);
