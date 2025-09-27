import type { QuestionConfig } from "@/types/QuestionConfig";
import type { ResultData } from "@/types/Questionnaire";

export function processQuestionAnswer(
  selectedValues: string[],
  questionOptions: Array<{ value: string; next?: string; text: string }>,
  questionnaireData: { questions: Record<string, QuestionConfig>; results: Record<string, ResultData> },
): {
  nextDestination: string | null;
  resultPageIds: string[];
  displayTexts: string[];
  shouldShowFilteringQuestions?: boolean;
} {
  const displayTexts = selectedValues.map((value) => {
    const option = questionOptions.find((opt) => opt.value === value);
    return option?.text || value;
  });

  const nextDestinations = selectedValues
    .map((value) => {
      const option = questionOptions.find((opt) => opt.value === value);
      return option?.next;
    })
    .filter(Boolean) as string[];

  const treatmentPages = nextDestinations.filter((dest) => dest in questionnaireData.results);

  const questionPages = nextDestinations.filter((dest) => dest in questionnaireData.questions);

  let nextDestination: string | null = null;
  let shouldShowFilteringQuestions = false;

  if (treatmentPages.length > 0) {
    shouldShowFilteringQuestions = true;
    nextDestination = "showFilteringQuestions";
  } else if (questionPages.length > 0) {
    nextDestination = questionPages[0];
  }

  return {
    nextDestination,
    resultPageIds: [...new Set(treatmentPages)],
    displayTexts,
    shouldShowFilteringQuestions,
  };
}
