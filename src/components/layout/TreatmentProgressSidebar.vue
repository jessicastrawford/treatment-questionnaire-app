<template>
  <!-- MOBILE PROGRESS (visible only on mobile) -->
  <div class="block px-5 py-3 md:hidden">
    <div class="mt-2 flex items-end justify-between">
      <h1 class="text-3xl leading-tight font-bold text-gray-900">
        {{ store.questionnaireData?.meta.title }}
      </h1>
      <div class="relative h-20 w-20">
        <svg class="h-20 w-20 -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
          <!-- Track -->
          <circle cx="32" cy="32" r="28" class="stroke-gray-200" stroke-width="6" fill="none" />
          <!-- Progress -->
          <circle
            cx="32"
            cy="32"
            r="28"
            class="stroke-orange-500 transition-[stroke-dashoffset] duration-500 ease-out"
            stroke-linecap="round"
            stroke-width="6"
            fill="none"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
          />
        </svg>

        <!-- Center content: count or tick -->
        <div class="absolute inset-0 grid place-items-center">
          <i
            v-if="isComplete"
            class="pi pi-check grid h-8 w-8 place-items-center rounded-full bg-orange-500 text-base text-white"
            aria-label="Completed"
          ></i>
          <div v-else class="flex flex-col items-center leading-none">
            <span class="text-sm font-semibold text-gray-900">{{ completedCount }}</span>
            <span class="text-[10px] text-gray-500">/ {{ totalSteps }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- DESKTOP STEPPER (your original, visible md+) -->
  <div class="bg-base-2 sticky top-0 hidden h-screen w-80 p-8 md:block">
    <!-- Header -->
    <div class="mb-4">
      <h1 class="mb-4 text-3xl leading-tight font-bold text-gray-900">
        {{ store.questionnaireData?.meta.title }}
      </h1>
      <p class="text-contrast-2 text-sm">
        {{ store.questionnaireData?.meta.description }}
      </p>
    </div>

    <!-- Progress Steps -->
    <div class="relative space-y-0">
      <div
        v-for="(step, index) in steps"
        :key="step.id"
        class="relative flex items-start"
        :class="{ 'pb-6': index < steps.length - 1 }"
        :ref="(el) => (stepRefs[index] = el as HTMLElement)"
      >
        <div class="relative z-10 mt-1 mr-4 flex-shrink-0" :ref="(el) => (iconRefs[index] = el as HTMLElement)">
          <div
            class="relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300"
            :class="getCircleClasses(step.status)"
          >
            <span
              v-if="step.status === 'current' && store.currentQuestionId"
              :key="store.currentQuestionId"
              class="animate-pulse-outline-once pointer-events-none absolute inset-0 rounded-full ring-4 ring-orange-200/60"
            ></span>

            <i v-if="step.status === 'completed'" class="pi pi-check text-sm text-white"></i>
            <div v-else class="rounded-full" :class="getDotClasses(step.status)"></div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-grow">
          <h3
            class="mt-2 mb-1 text-sm font-semibold transition-colors duration-300"
            :class="getTitleClasses(step.status)"
          >
            {{ step.title }}
          </h3>
          <p class="text-xs leading-relaxed transition-colors duration-300" :class="getDescriptionClasses(step.status)">
            {{ step.description }}
          </p>

          <!-- Show current answer if completed -->
          <div v-if="step.status === 'completed' && step.answer" class="mt-2">
            <span class="inline-block rounded-full border bg-orange-100 px-2 py-1 text-xs text-orange-800">
              {{ step.answer }}
            </span>
          </div>
        </div>

        <!-- Connecting Line -->
        <div v-if="index < steps.length - 1" class="absolute w-[2px] bg-gray-200" :style="getLineStyle(index)">
          <div
            class="absolute inset-0 origin-top transform bg-orange-300 transition-transform duration-700 ease-out"
            style="will-change: transform"
            :class="step.status === 'completed' ? 'scale-y-100' : 'scale-y-0'"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useQuestionnaireStore } from "@/stores/questionnaireStore";

const store = useQuestionnaireStore();

const stepRefs = ref<HTMLElement[]>([]);
const iconRefs = ref<HTMLElement[]>([]);

// ----- Step config & status (unchanged) -----
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

  // Special nodes
  if (questionId === "results") {
    return store.currentQuestionId === "results" ? "current" : "upcoming";
  }
  if (questionId === "filtering") {
    if (store.isInFilteringFlow) return "current";
    if (store.currentQuestionId === "results") return "completed";
    return "upcoming";
  }

  // Normal nodes
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

function getThirdQuestionId(): string | null {
  const secondQuestionId = getSecondQuestionId();
  if (!secondQuestionId) return null;
  const secondAnswer = store.answers.get(secondQuestionId);
  if (!secondAnswer) return null;
  const selectedOption = secondAnswer.values[0];
  return `${selectedOption}_concerns`;
}

// ----- Mobile progress computations (reuses `steps`) -----
const totalSteps = computed(() => steps.value.length || 0);
const completedCount = computed(() => steps.value.filter((s) => s.status === "completed").length);
const progress = computed(() => (totalSteps.value ? completedCount.value / totalSteps.value : 0));

// SVG circle math
const radius = 28;
const circumference = 2 * Math.PI * radius;
const dashOffset = computed(() => circumference * (1 - progress.value));
const isComplete = computed(() => progress.value >= 1);
const currentTitle = computed(() => steps.value.find((s) => s.status === "current")?.title ?? "");

// ----- Desktop vertical connector line positioning -----
function getLineStyle(index: number) {
  const stepEl = stepRefs.value[index];
  const iconEl = iconRefs.value[index];
  const nextIconEl = iconRefs.value[index + 1];

  if (!stepEl || !iconEl || !nextIconEl) {
    return { left: "1rem", top: "2.5rem", height: "120px" };
  }

  const stepRect = stepEl.getBoundingClientRect();
  const iconRect = iconEl.getBoundingClientRect();
  const nextIconRect = nextIconEl.getBoundingClientRect();

  const currCenterX = iconRect.left - stepRect.left + iconRect.width / 2;
  const currCenterY = iconRect.top - stepRect.top + iconRect.height / 2;
  const nextCenterY = nextIconRect.top - stepRect.top + nextIconRect.height / 2;

  const top = Math.min(currCenterY, nextCenterY);
  const bottom = Math.max(currCenterY, nextCenterY);

  return {
    left: `${currCenterX - 0.5}px`,
    top: `${top}px`,
    height: `${bottom - top}px`,
  };
}

// ----- Styling helpers (unchanged) -----
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
  return status === "current" ? "w-3 h-3 bg-white" : "w-3 h-3 bg-gray-400";
}

function getTitleClasses(status: string): string {
  return status === "completed" || status === "current" ? "text-gray-900" : "text-gray-400";
}

function getDescriptionClasses(status: string): string {
  return status === "completed" || status === "current" ? "text-gray-500" : "text-gray-400";
}
</script>

<style scoped>
@keyframes pulse-outline-once {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  70% {
    transform: scale(1.35);
    opacity: 0;
  }
  100% {
    transform: scale(1.35);
    opacity: 0;
  }
}
.animate-pulse-outline-once {
  animation: pulse-outline-once 0.8s ease-out;
  will-change: transform, opacity;
}
</style>
