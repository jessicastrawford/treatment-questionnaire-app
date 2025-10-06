import type { FilteringQuestionConfig } from "../types/FilteringQuestion";
import type { Treatment } from "../types/Questionnaire";
import type { OptionConfig } from "../types/QuestionConfig";
import { BUDGET_OPTIONS_CONFIG, DOWNTIME_OPTIONS_CONFIG } from "./filteringConstants";

// =============================================================================
// FILTERING LOGIC FUNCTIONS
// =============================================================================

// Downtime Filtering

const getMaxDaysFromDowntime = (downtime: string): number => {
  if (!downtime) return 0;
  const numbers = downtime.match(/\d+/g);
  if (!numbers || numbers.length === 0) return 0;
  return Math.max(...numbers.map((num) => parseInt(num, 10)));
};

const formatDowntimeOption = (option: string) => {
  const maxDays = getMaxDaysFromDowntime(option);
  // Find the appropriate category
  const category = DOWNTIME_OPTIONS_CONFIG.find((config) => maxDays <= config.maxDays);
  // Return the category, or fallback to "significant" if no match found
  throw new Error("Deliberate error inside formatDowntimeOption");
};

const extractDowntimeOptions = (treatments: Treatment[]): OptionConfig[] => {
  const downtimes = [...new Set(treatments.map((t) => t.downtime).filter(Boolean))];

  // Get unique categories
  const categorySet = new Set<string>();
  const categoryOptions: OptionConfig[] = [];

  downtimes.forEach((downtime) => {
    const category = formatDowntimeOption(downtime);
    if (!categorySet.has(category)) {
      categorySet.add(category);
      // Use category as both value and text
      categoryOptions.push({
        value: downtime.toLowerCase().replace(/\s+/g, "_"),
        text: category,
      });
    }
  });

  return categoryOptions;
};

const filterByDowntime = (treatments: Treatment[], selectedValues: string[]): Treatment[] => {
  if (selectedValues.includes("no_preference")) return treatments;

  const selectedDowntime = selectedValues[0]?.replace(/_/g, " ");

  // Get the maximum days from the selected downtime range
  const selectedMaxDays = getMaxDaysFromDowntime(selectedDowntime);

  return treatments.filter((treatment) => {
    if (!treatment.downtime) return false;

    // Get the maximum days from the treatment's downtime
    const treatmentMaxDays = getMaxDaysFromDowntime(treatment.downtime);

    // Include treatment if its max downtime is <= selected max downtime
    return treatmentMaxDays <= selectedMaxDays;
  });
};

// Budget Filtering
const extractBudgetOptions = (treatments: Treatment[]): OptionConfig[] => {
  const prices = treatments
    .map((t) => parseInt(t.price_from?.replace(/[£,]/g, "") || "0"))
    .filter((price) => price > 0);

  if (prices.length === 0) return [];

  // Define your hard-coded ranges

  // Only return ranges that have treatments within them
  const options = BUDGET_OPTIONS_CONFIG.filter((range) => {
    // Check if any treatment falls within this range
    return prices.some((price) => price >= range.min && price < range.max);
  });

  return options;
};

const filterByBudget = (treatments: Treatment[], selectedValues: string[]): Treatment[] => {
  if (selectedValues.includes("no_preference")) return treatments;

  const selectedBudget = selectedValues[0]; // e.g., "150-300" or "500"

  return treatments.filter((treatment) => {
    const price = parseInt(treatment.price_from?.replace(/[£,]/g, "") || "0");

    // Extract the highest number from the range
    let maxPrice;

    if (selectedBudget.includes("-")) {
      // For "150-300", get the second number (300)
      const numbers = selectedBudget.split("-");
      maxPrice = parseInt(numbers[1].replace(/[£,]/g, ""));
    } else {
      // For "500", use that number
      maxPrice = parseInt(selectedBudget.replace(/[£,]/g, ""));
    }

    return price <= maxPrice;
  });
};

// Treatment Count Filtering
const extractTreatmentCountOptions = (treatments: Treatment[]): OptionConfig[] => {
  const counts = [...new Set(treatments.map((t) => t.number_of_treatments).filter(Boolean))];

  // Check what types of treatments we have
  const hasSingleTreatments = counts.some((count) => {
    return count.includes("1");
  });

  const hasMultipleTreatments = counts.some((count) => {
    // Check if any count is purely multiple (2+) OR includes ranges with 2+
    const numbers = count.match(/\d+/g);
    if (!numbers) return false;

    // If it's a range like "1-2", "2-3", it has multiple
    if (count.includes("-")) return true;

    // If it's a single number > 1, it's multiple
    const singleNumber = parseInt(numbers[0]);
    return singleNumber > 1;
  });

  const options = [];

  if (hasSingleTreatments) {
    options.push({
      value: "1",
      text: "Single treatment",
    });
  }

  if (hasMultipleTreatments) {
    options.push({
      value: "2",
      text: "More than one treatment",
    });
  }

  return options;
};

const filterByTreatmentCount = (treatments: Treatment[], selectedValues: string[]): Treatment[] => {
  if (selectedValues.includes("no_preference")) return treatments;

  const selectedValue = selectedValues[0]; // "1" or "2"

  return treatments.filter((treatment) => {
    const countStr = treatment.number_of_treatments || "1"; // Handle empty as "1"

    if (selectedValue === "1") {
      // Single treatment ONLY: must be exactly "1" or empty
      return countStr === "1" || countStr === "";
    } else if (selectedValue === "2") {
      // More than one treatment: show EVERYTHING (all treatments can potentially be repeated)
      return true;
    }

    return true;
  });
};

// =============================================================================
// CONFIGURATION
// =============================================================================

export const FILTERING_QUESTIONS_CONFIG: FilteringQuestionConfig[] = [
  {
    id: "downtime_preference",
    type: "single-choice",
    text: "How much downtime can you accommodate?",
    optionExtractor: extractDowntimeOptions,
    filterApplier: filterByDowntime,
    allowSkip: true,
    skipText: "No preference",
    order: 1,
  },
  {
    id: "budget_preference",
    type: "single-choice",
    text: "What budget range are you most comfortable with?",
    optionExtractor: extractBudgetOptions,
    filterApplier: filterByBudget,
    allowSkip: true,
    skipText: "No preference",
    order: 2,
  },
  {
    id: "treatment_count_preference",
    type: "single-choice",
    text: "How many treatment sessions do you prefer?",
    optionExtractor: extractTreatmentCountOptions,
    filterApplier: filterByTreatmentCount,
    allowSkip: true,
    skipText: "No preference",
    order: 3,
  },
];
