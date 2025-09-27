import type { BaseQuestionConfig, OptionConfig } from "./QuestionConfig";
import type { Treatment } from "./Questionnaire";

export interface FilteringQuestionConfig extends BaseQuestionConfig {
  optionExtractor?: (treatments: Treatment[]) => OptionConfig[];
  filterApplier: (treatments: Treatment[], selectedValues: string[]) => Treatment[];
  allowSkip?: boolean;
  skipText?: string;
  order: number;

  // Will be populated dynamically, so optional
  options: OptionConfig[];
}
