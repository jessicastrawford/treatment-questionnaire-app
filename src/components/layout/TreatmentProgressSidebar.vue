<template>
  <div class="w-80 p-8 sticky top-0 bg-base-2 h-screen">
    <!-- Header -->
    <div class="mb-4">
      <h1 class="text-3xl font-bold text-gray-900 mb-4 leading-tight">
        {{ store.questionnaireData?.meta.title }}
      </h1>
      <p class="text-contrast-2 text-sm">
        {{ store.questionnaireData?.meta.description }}
      </p>
    </div>

    <!-- Progress Steps -->
    <div class="space-y-0 relative">
      <div
        v-for="(step, index) in steps"
        :key="step.id"
        class="flex items-start relative"
        :class="{ 'pb-6': index < steps.length - 1 }"
        :ref="(el) => (stepRefs[index] = el)"
      >
        <div class="flex-shrink-0 mr-4 mt-1 relative z-10" :ref="(el) => (iconRefs[index] = el)">
          <div
            class="relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
            :class="getCircleClasses(step.status)"
          >
            <span
              v-if="step.status === 'current'"
              :key="store.currentQuestionId"
              class="pointer-events-none absolute inset-0 rounded-full ring-4 ring-orange-200/60 animate-pulse-outline-once"
            ></span>

            <i v-if="step.status === 'completed'" class="pi pi-check text-white text-sm"></i>
            <div v-else class="rounded-full" :class="getDotClasses(step.status)"></div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-grow">
          <h3
            class="text-sm font-semibold mb-1 mt-2 transition-colors duration-300"
            :class="getTitleClasses(step.status)"
          >
            {{ step.title }}
          </h3>
          <p class="text-xs leading-relaxed transition-colors duration-300" :class="getDescriptionClasses(step.status)">
            {{ step.description }}
          </p>

          <!-- Show current answer if completed -->
          <div v-if="step.status === 'completed' && step.answer" class="mt-2">
            <span class="inline-block border bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
              {{ step.answer }}
            </span>
          </div>
        </div>

        <!-- Connecting Line -->
        <div v-if="index < steps.length - 1" class="absolute w-[2px] bg-gray-200" :style="getLineStyle(index)">
          <div
            class="absolute inset-0 bg-orange-300 transform origin-top transition-transform duration-700 ease-out"
            style="will-change: transform"
            :class="step.status === 'completed' ? 'scale-y-100' : 'scale-y-0'"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, watch } from "vue";
import { useQuestionnaireStore } from "@/stores/questionnaireStore";

const store = useQuestionnaireStore();

const stepRefs = ref<HTMLElement[]>([]);
const iconRefs = ref<HTMLElement[]>([]);

const layoutTick = ref(0);
const bumpLayout = () => {
  layoutTick.value++;
};

// remeasure when answers change (lozenges expand, heights change)
watch(
  () => store.answers,
  () => nextTick(bumpLayout),
  { deep: true },
);

function getLineStyle(index: number) {
  const stepEl = stepRefs.value[index];
  const iconEl = iconRefs.value[index];
  const nextIconEl = iconRefs.value[index + 1];

  // Fallback if refs aren't ready yet
  if (!stepEl || !iconEl || !nextIconEl) {
    return { left: "1rem", top: "2.5rem", height: "120px" };
  }

  const stepRect = stepEl.getBoundingClientRect();
  const iconRect = iconEl.getBoundingClientRect();
  const nextIconRect = nextIconEl.getBoundingClientRect();

  // centers relative to the current step container
  const currCenterX = iconRect.left - stepRect.left + iconRect.width / 2;
  const currCenterY = iconRect.top - stepRect.top + iconRect.height / 2;
  const nextCenterY = nextIconRect.top - stepRect.top + nextIconRect.height / 2;

  // ensure positive height (in case DOM ordering/flow ever flips)
  const top = Math.min(currCenterY, nextCenterY);
  const bottom = Math.max(currCenterY, nextCenterY);

  return {
    left: `${currCenterX - 0.5}px`,
    top: `${top}px`,
    height: `${bottom - top}px`,
  };
}

const stepConfig = computed(() => [
  {
    id: "step1",
    title: "Area selection",
    description: "Which area of your body would you like to focus on?",
    questionId: "body_area",
  },
  {
    id: "step2",
    title: "Target Zone",
    description: "Which specific part of this area needs attention?",
    questionId: getSecondQuestionId(),
  },
  {
    id: "step3",
    title: "Concerns Identified",
    description: "What specific issues would you like to address?",
    questionId: getThirdQuestionId(),
  },
  {
    id: "step5",
    title: "Treatment preferences",
    description: "Your investment level with downtime and budget considerations",
    questionId: getFilteringQuestionId(),
  },
  {
    id: "step8",
    title: "Personalised results",
    description: "Your customised treatment plan with recommended options",
    questionId: "results",
  },
]);

const steps = computed(() =>
  stepConfig.value.map((config) => ({
    ...config,
    status: getStepStatus(config.questionId),
    answer: getStepAnswer(config.questionId),
  })),
);

function getStepStatus(questionId: string | null): "completed" | "current" | "upcoming" {
  if (!questionId) return "upcoming";
  if (questionId === "results") {
    return store.currentQuestionId === "results" ? "current" : "upcoming";
  }
  if (questionId === "filtering") {
    if (store.isInFilteringFlow) return "current";
    if (store.currentQuestionId === "results") return "completed";
    return "upcoming";
  }
  if (store.answers.has(questionId)) return "completed";
  if (store.currentQuestionId === questionId) return "current";
  return "upcoming";
}

// Use the new answer structure with displayText
function getStepAnswer(questionId: string | null): string | null {
  if (!questionId) return null;

  const answer = store.answers.get(questionId);

  if (!answer) return null;

  if (answer.displayText && answer.displayText.length > 0) {
    return answer.displayText.length === 1 ? answer.displayText[0] : `${answer.displayText.length} selected`;
  }
  return null;
}

function getFilteringQuestionId(): string | null {
  if (store.isInFilteringFlow) return store.currentQuestionId; // Return actual ID
  if (store.currentQuestionId === "results") return "filtering"; // Completed
  return null;
}

// Use values array from new structure
function getSecondQuestionId(): string | null {
  const bodyAreaAnswer = store.answers.get("body_area");
  if (!bodyAreaAnswer) return null;
  const selectedArea = bodyAreaAnswer.values[0];
  const areaToQuestionMap: Record<string, string> = {
    head_face: "face_concern_area",
    other_body: "body_concern_area",
  };
  return areaToQuestionMap[selectedArea] || null;
}

// Use values array from new structure
function getThirdQuestionId(): string | null {
  const secondQuestionId = getSecondQuestionId();
  if (!secondQuestionId) return null;
  const secondAnswer = store.answers.get(secondQuestionId);
  if (!secondAnswer) return null;
  const selectedOption = secondAnswer.values[0];
  return `${selectedOption}_concerns`;
}

// Styling helpers
function getCircleClasses(status: string): string {
  switch (status) {
    case "completed":
      return "bg-orange-500";
    case "current":
      return "bg-orange-500 ring-4 ring-orange-200";
    default:
      return "bg-gray-200";
  }
}

function getDotClasses(status: string): string {
  switch (status) {
    case "current":
      return "w-3 h-3 bg-white";
    default:
      return "w-3 h-3 bg-gray-400";
  }
}

function getTitleClasses(status: string): string {
  switch (status) {
    case "completed":
    case "current":
      return "text-gray-900";
    default:
      return "text-gray-400";
  }
}

function getDescriptionClasses(status: string): string {
  switch (status) {
    case "completed":
    case "current":
      return "text-gray-500";
    default:
      return "text-gray-400";
  }
}
</script>
