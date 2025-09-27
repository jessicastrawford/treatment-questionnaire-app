<!-- src/components/QuestionComponent.vue -->
<template>
  <div class="min-h-screen flex flex-col">
    <!-- Main Content Area -->
    <div class="flex p-8 pb-0 mt-[126px]">
      <!-- <div v-if="question.type === 'face-map'"> -->

      <!-- </div> -->
      <div class="w-full max-w-4xl">
        <!-- Question -->
        <div :class="{ 'mb-12': question.type !== 'face-map' }">
          <h1 class="text-gray-900 text-2xl font-normal leading-relaxed">
            {{ question.text }}
          </h1>
          <!-- ✅ Dynamic instruction based on question type -->
          <div v-if="question.type === 'multiple-choice'">
            <div>Please select <span class="font-bold">all</span> that apply.</div>
          </div>
          <div v-else>Please choose just <span class="font-bold">one option</span>.</div>
        </div>

        <FaceMapComponent :question="question" @selected-area="selectedArea" v-if="question.type === 'face-map'" />

        <!-- Options - Horizontal Layout for this question type -->
        <div class="flex flex-wrap gap-3 mb-16" v-else>
          <label v-for="option in question.options" :key="option.value" class="relative cursor-pointer">
            <div
              class="group relative overflow-hidden transition-all duration-200 ease-out px-[50px] py-[20px] cursor-pointer rounded"
              :class="{
                // Default state
                'text-black border border-black bg-white hover:ring-1 hover:ring-black': !isSelected(option.value),

                // Selected state - orange theme
                'text-white border border-[#ff6900] bg-[#ff6900] ring-1 ring-[#ff6900]': isSelected(option.value),
              }"
              @click="handleClick(option.value)"
            >
              <!-- Text content -->
              <span class="relative z-10 transition-colors duration-300 ease-out">
                {{ option.text }}
              </span>
            </div>
          </label>
        </div>
        <div
          class="mt-6 py-2 px-4 rounded-lg w-fit bg-[var(--accent-2-1)] border border-[var(--accent-2-2)]"
          v-if="!hasProgress"
        >
          <div class="flex items-start gap-3">
            <i class="pi pi-info-circle mt-0.5 text-[var(--accent-2)]"></i>
            <div>
              <p class="text-sm text-[var(--accent-2)]">
                <strong>Not sure about specifics?</strong> Select "I'm not sure" to get more guided help from our
                chatbot.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Section with Progress and Navigation -->
    <div class="relative m-8">
      <!-- Progress Bar as Border (Background - Light Grey) -->
      <div class="absolute top-0 left-0 w-full h-[3px] bg-gray-300"></div>
      <div
        class="absolute top-0 left-0 h-[3px] bg-gray-600 transition-all duration-500 ease-out"
        :style="{ width: progressPercentage + '%' }"
      ></div>

      <!-- Content with top padding to account for progress bar -->
      <div class="pt-[25px]">
        <div class="flex justify-between items-center" :class="{ 'justify-end': !hasProgress }">
          <ButtonComponent variant="secondary" size="small" v-if="hasProgress" @click="$emit('back')"
            >Back</ButtonComponent
          >

          <!-- Next Button - Only enabled if something is selected -->
          <ButtonComponent size="small" :disabled="!canProceed" @click="handleNext" variant="primary">
            Continue
          </ButtonComponent>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { QuestionConfig } from "@/types/QuestionConfig";
import ButtonComponent from "../ui/ButtonComponent.vue";
import FaceMapComponent from "./FaceMapComponent.vue";

interface Props {
  question: QuestionConfig;
  hasProgress?: boolean;
  progressPercentage?: number;
  totalQuestions?: number;
}

const props = withDefaults(defineProps<Props>(), {
  hasProgress: false,
  progressPercentage: 0,
  totalQuestions: 8,
});

const emit = defineEmits<{
  answer: [value: string[]];
  back: [];
}>();

const selectedValues = ref<string[]>([]);

const selectedArea = (areaValues: string[]) => {
  selectedValues.value = areaValues;
};

// Handle clicking on a lozenge - just store the selection
function handleClick(value: string) {
  if (props.question.type === "single-choice") {
    selectedValues.value = [value];
  } else if (props.question.type === "multiple-choice") {
    const index = selectedValues.value.indexOf(value);
    if (index > -1) {
      selectedValues.value.splice(index, 1);
    } else {
      selectedValues.value.push(value);
    }
  }
}

// ✅ CHANGED: Unified selection check
function isSelected(value: string): boolean {
  return selectedValues.value.includes(value);
}

// ✅ CHANGED: Unified validation
const canProceed = computed(() => {
  return selectedValues.value.length > 0;
});

function handleNext() {
  if (canProceed.value) {
    emit("answer", selectedValues.value); // Always emit array
    selectedValues.value = []; // Reset for next question
  }
}
</script>
