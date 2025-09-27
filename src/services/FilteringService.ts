import { FILTERING_QUESTIONS_CONFIG } from "@/config/FilteringQuestions";
import type { FilteringQuestionConfig } from "@/types/FilteringQuestion";
import type { OptionConfig } from "@/types/QuestionConfig";
import type { Treatment } from "@/types/Questionnaire";

//Using an config here to handle the question text/behaviour, how to extract options from the data (optionExtractor), how to apply filters (filterApplier) and how to order or skip. This is so that a) its easier to maintain, any ne questions or behavioural changes that need to be made its in one place, and also allowing the behaviour to be driven by the data structures not the code.

export class FilteringService {
  // Encapsulation: Private state ensures configuration cannot be modified externally
  // This protects the sorted order and maintains data integrity
  private config: FilteringQuestionConfig[]; //This declares the property exists with type FilteringQuestionConfig

  // Dependency Injection Pattern: Allows configuration to be injected at construction
  // Default parameter provides production config while enabling test injection for custom configs to test etc
  // if i hadn't have passed this in here, in my testing i would have had to have used FILTERING_QUESTIONS_CONFIG as the config, which might be cumbersome.
  // Immediately sorts by order to optimize question sequencing performance
  constructor(config: FilteringQuestionConfig[] = FILTERING_QUESTIONS_CONFIG) {
    // Performance optimization: Sort once during construction rather than on each access
    // Ensures questions are always presented in correct business-defined sequence

    this.config = config.sort((a, b) => a.order - b.order);
  }

  // Factory Pattern: Dynamically constructs question objects based on runtime inputs
  // Type constraint ensures output always conforms to expected interface
  // Null return enables error handling for invalid question IDs
  generateQuestion(questionId: string, relevantTreatments: Treatment[]): FilteringQuestionConfig | null {
    // Configuration lookup - O(n) operation but acceptable for small config arrays
    // Could be optimized with Map if performance becomes critical
    const config = this.config.find((q) => q.id === questionId);
    if (!config) return null; // Fail-fast pattern for invalid inputs

    const options: OptionConfig[] = [];

    // Conditional option injection - allows questions to have different UX patterns
    // Skip functionality provides user experience flexibility
    if (config.allowSkip) {
      options.push({
        value: "no_preference",
        text: config.skipText || "No preference", // Fallback text for robustness
      });
    }

    // Higher-order functions: optionExtractor is a function stored as data
    // This enables dynamic behavior where different questions use different extraction logic
    // Spread operator flattens returned array into individual options for consistent structure
    if (config.optionExtractor) {
      options.push(...config.optionExtractor(relevantTreatments));
    }

    // Template Method Pattern: All questions follow identical output structure
    // Guarantees API consistency regardless of internal question complexity
    // Maps options to standardized format for type safety and UI consistency

    return {
      id: config.id,
      type: config.type,
      text: config.text,
      filterApplier: config.filterApplier, // Function reference for applying filters to data
      order: config.order,
      options: options.map((opt) => ({
        value: opt.value,
        text: opt.text,
      })),
    };
  }

  // Navigation logic encapsulated within service - single responsibility for question flow
  // Uses sorted configuration array to determine sequential progression
  getNextQuestionId(currentQuestionId: string): string | null {
    // Linear search acceptable for small arrays; could optimize with Map for scale

    const currentIndex = this.config.findIndex((q) => q.id === currentQuestionId);
    if (currentIndex === -1 || currentIndex === this.config.length - 1) {
      return null; // End of questionnaire or invalid question
    }
    return this.config[currentIndex + 1].id;
  }

  // Entry point abstraction - hides internal array structure from consumers
  // Defensive programming with optional chaining and fallback
  getFirstQuestionId(): string | null {
    return this.config[0]?.id || null;
  }
}

//Chosen to set this up as class because of complex stateful logic that benefits from OOP designs.
