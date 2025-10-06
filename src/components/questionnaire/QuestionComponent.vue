<template>
  <div class="flex min-h-screen flex-col">
    <!-- Main Content Area -->
    <div class="flex p-5 pb-0 lg:mt-[106px] lg:p-8">
      <!-- <div v-if="question.type === 'face-map'"> -->

      <!-- </div> -->
      <div class="w-full max-w-4xl">
        <!-- Question -->
        <div :class="{ 'mb-12': question.type !== 'face-map' }">
          <h1 class="text-2xl leading-relaxed font-normal text-gray-900">
            {{ question.text }}
          </h1>
          <div v-if="question.type === 'multiple-choice'">
            <div>Please select <span class="font-bold">all</span> that apply.</div>
          </div>
          <div v-else>Please choose just <span class="font-bold">one option</span>.</div>
        </div>

        <FaceMapComponent :question="question" @selected-area="selectedArea" v-if="question.type === 'face-map'" />

        <div class="mb-16 flex flex-wrap justify-center gap-3 lg:justify-start" v-else>
          <label
            v-for="option in question.options"
            :key="option.value"
            class="relative w-full cursor-pointer text-center lg:w-auto"
          >
            <div
              class="group relative cursor-pointer overflow-hidden rounded px-[50px] py-[20px] transition-all duration-200 ease-out"
              :class="{
                'border border-black bg-white text-black hover:ring-1 hover:ring-black': !isSelected(option.value),
                'border-luminous-vivid-orange bg-luminous-vivid-orange ring-luminous-vivid-orange border text-white ring-1':
                  isSelected(option.value),
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
        <div class="border-accent-2-2 bg-accent-2-1 mt-6 w-fit rounded-lg border px-4 py-2" v-if="!hasProgress">
          <div class="flex items-start gap-3">
            <i class="pi pi-info-circle text-accent-2 mt-0.5"></i>
            <div>
              <p class="text-accent-2 text-sm">
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
      <div class="absolute top-0 left-0 h-[3px] w-full bg-gray-300"></div>
      <div
        class="absolute top-0 left-0 h-[3px] bg-gray-600 transition-all duration-500 ease-out"
        :style="{ width: progressPercentage + '%' }"
      ></div>

      <!-- Content with top padding to account for progress bar -->
      <div class="pt-[25px]">
        <div class="flex items-center justify-between" :class="{ 'justify-end': !hasProgress }">
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

function isSelected(value: string): boolean {
  return selectedValues.value.includes(value);
}

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
