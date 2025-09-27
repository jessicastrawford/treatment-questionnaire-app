// src/types/Question.ts
export interface OptionConfig {
  value: string;
  text: string;
  next?: string;
}

export interface BaseQuestionConfig {
  id: string;
  text: string;
  type: "single-choice" | "multiple-choice" | "face-map";
}

export interface QuestionConfig extends BaseQuestionConfig {
  options: OptionConfig[];
  category?: string;
}
