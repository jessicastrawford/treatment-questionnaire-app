import { createRouter, createWebHistory } from 'vue-router'
import WelcomeView from '@/views/WelcomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'TreatmentFinderHome',
      component: WelcomeView,
    },
    {
      path: '/questionnaire',
      name: 'questionnaire',
      component: () => import('@/views/QuestionnaireView.vue'),
    },
  ],
})

export default router
