<template>
  <div class="h-full p-5 lg:p-8">
    <h1 class="mb-3 text-3xl font-bold">Your Personalised Treatment Guide</h1>
    <h4 class="text-lg">
      Based on your responses, here are the treatments that may be the most beneficial for your aesthetic goals:
    </h4>
    <div class="mt-8 mb-8 grid grid-cols-1 gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="result in store.currentlyFilteredTreatments"
        :key="result.id"
        class="border-b-2 border-[var(--contrast-3)]"
      >
        <div class="group relative">
          <img :src="result.image" class="h-64 w-full object-cover transition duration-300 group-hover:brightness-55" />
          <div
            class="absolute inset-0 flex items-center justify-center opacity-0 transition duration-300 group-hover:opacity-100"
          >
            <ButtonComponent size="large" variant="secondary" @click="handleTreatmentClick(result)" :showIcon="false">
              View treatment
            </ButtonComponent>
          </div>
        </div>

        <h3 class="mt-4 mb-2 text-lg font-bold">{{ result.name }}</h3>
        <h3 class="mb-4">{{ result.description }}</h3>
      </div>
    </div>
    <div class="bg-base-2 my-6 p-6">
      <h4 class="text-[24px] font-bold">Let's get started! Book your consultation today:</h4>
      <ButtonComponent size="large" variant="primary" @click="navigateToConsultation" :showIcon="false" class="mt-4">
        Book consultation
      </ButtonComponent>
    </div>

    <section class="bg-base-2 flex flex-col gap-6 rounded-sm px-8 py-6 lg:flex-row lg:gap-12">
      <article>
        <h4 class="text-[24px] font-bold">Need more help?</h4>
        <section>
          <p class="my-3">Still feel like you need more guidance through our treatments?</p>
          <address class="not-italic">
            <p class="my-3">Contact Skin Excellence Clinics at:</p>
            <p>
              <a href="mailto:info@skinexcellenceclinics.co.uk"
                >Email: <span class="underline">info@skinexcellenceclinics.co.uk</span></a
              >
            </p>
            <p>
              Phone: <a href="tel:+4408002982391"><span class="underline">0800 2982391</span></a>
            </p>
          </address>
        </section>
      </article>
      <article>
        <h4 class="text-[24px] font-bold">Want to see different results?</h4>
        <p class="my-3">Retake the questionnaire to explore treatments for other areas or concerns.</p>
        <ButtonComponent size="small" variant="secondary" @click="restartQuestionnaire" :showIcon="false">
          Retake Questionnaire
        </ButtonComponent>

        <h4 class="mt-6 text-[24px] font-bold">Have questions first?</h4>
        <p class="my-3">Get instant answers from our AI assistant.</p>
        <ButtonComponent size="small" variant="secondary" @click="restartQuestionnaire" :showIcon="false">
          Chat with AI
        </ButtonComponent>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useQuestionnaireStore } from "@/stores/questionnaireStore";
import ButtonComponent from "../ui/ButtonComponent.vue";
import type { Treatment } from "@/types/Questionnaire";

const store = useQuestionnaireStore();

console.log("store.currentlyFilteredTreatments", store.currentlyFilteredTreatments);

function handleTreatmentClick(treatment: Treatment) {
  window.open(treatment.url, "_blank");
}

function navigateToConsultation(treatment: Treatment) {
  console.log("treatment", treatment);
}

function restartQuestionnaire() {
  store.resetQuestionnaire();
}
</script>
