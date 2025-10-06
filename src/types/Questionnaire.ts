// src/types/Questionnaire.ts
import type { QuestionConfig } from "./QuestionConfig";

export interface MetaConfig {
  version: string;
  startQuestion: string;
  title: string;
  description: string;
}

export interface AppConfig {
  maxSteps: number;
  showProgress: boolean;
  progressTracking: boolean;
  analyticsTracking: boolean;
  animationDuration: number;
  allowBackNavigation: boolean;
}

export interface Treatment {
  id: string;
  url?: string;
  name: string;
  areas?: string[];
  duration?: string;
  price_from: string;
  description?: string;
  results_last?: string;
  results_visible?: string;
  image?: string;
  downtime: string;
  number_of_treatments: string;
}

export interface ResultData {
  id: string;
  title: string;
  treatments: string[];
  description: string;
}

export interface QuestionnaireData {
  meta: MetaConfig;
  questions: Record<string, QuestionConfig>;
  results: Record<string, ResultData>;
  treatments: Record<string, Treatment>;
  config: AppConfig;
}
