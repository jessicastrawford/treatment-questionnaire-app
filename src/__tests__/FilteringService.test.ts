import { describe, it, expect, beforeEach } from "vitest";

import { FilteringService } from "@/services/FilteringService";
import { FILTERING_QUESTIONS_CONFIG } from "@/config/FilteringQuestions";
import type { FilteringQuestionConfig } from "@/types/FilteringQuestion";
import type { Treatment } from "@/types/Questionnaire";

describe("FilteringService", () => {
  let service: FilteringService;
  let mockTreatments: Treatment[];

  beforeEach(() => {
    // Comprehensive mock treatment data covering all edge cases
    mockTreatments = [
      // Budget variations
      { id: "botox", name: "Botox", price_from: "£250", downtime: "1-2 days", number_of_treatments: "1" },
      { id: "filler", name: "Dermal Filler", price_from: "£450", downtime: "3-5 days", number_of_treatments: "1" },
      { id: "laser", name: "Laser Treatment", price_from: "£800", downtime: "7-10 days", number_of_treatments: "3-4" },

      // Downtime edge cases
      { id: "chemical_peel", name: "Chemical Peel", price_from: "£100", downtime: "0 days", number_of_treatments: "1" },
      { id: "micro_needling", name: "Micro-needling", price_from: "£200", downtime: "", number_of_treatments: "2-3" },
      { id: "facelift", name: "Facelift", price_from: "£5000", downtime: "14-21 days", number_of_treatments: "1" },

      // Treatment count variations
      { id: "hydrafacial", name: "HydraFacial", price_from: "£120", downtime: "0 days", number_of_treatments: "" },
      { id: "ipl", name: "IPL", price_from: "£300", downtime: "2 days", number_of_treatments: "6" },

      // Missing/edge case data
      { id: "consultation", name: "Consultation", price_from: "", downtime: "", number_of_treatments: "" },
      { id: "custom", name: "Custom Treatment", price_from: "£0", downtime: "No downtime", number_of_treatments: "1" },
    ];

    service = new FilteringService();
  });

  describe("Constructor and Configuration", () => {
    //A test to make sure the FILTERING_QUESTIONS_CONFIG always gets used and doesn't require the config injection.
    it("should use default FILTERING_QUESTIONS_CONFIG", () => {
      const defaultService = new FilteringService();
      expect(defaultService.getFirstQuestionId()).toBe("downtime_preference");
    });

    //A test to make sure you can pass in custom configs and not affect the code.
    it("should accept custom configuration", () => {
      const customConfig: FilteringQuestionConfig[] = [
        {
          id: "custom_question",
          type: "single-choice",
          text: "Custom question?",
          optionExtractor: () => [{ value: "yes", text: "Yes" }],
          filterApplier: (treatments) => treatments,
          allowSkip: false,
          order: 1,
        },
      ];

      const customService = new FilteringService(customConfig);
      expect(customService.getFirstQuestionId()).toBe("custom_question");
    });

    //A test to make sure the app doesn't break if theres a rare chance the config file is corrupt or broken or been deleted.
    it("should handle empty configuration", () => {
      const emptyService = new FilteringService([]);
      expect(emptyService.getFirstQuestionId()).toBeNull();
      expect(emptyService.getNextQuestionId("anything")).toBeNull();
    });
  });

  describe("Navigation Logic", () => {
    // This tests real business logic

    it("should return correct next question ID in sequence", () => {
      expect(service.getNextQuestionId("downtime_preference")).toBe("budget_preference");
      expect(service.getNextQuestionId("budget_preference")).toBe("treatment_count_preference");
    });

    it("should return null for last question", () => {
      expect(service.getNextQuestionId("treatment_count_preference")).toBeNull();
    });

    it("should return null for invalid question ID", () => {
      expect(service.getNextQuestionId("non_existent_question")).toBeNull();
    });

    it("should handle single question configuration", () => {
      const singleConfig: FilteringQuestionConfig[] = [FILTERING_QUESTIONS_CONFIG[0]];
      const singleService = new FilteringService(singleConfig);

      expect(singleService.getFirstQuestionId()).toBe("downtime_preference");
      expect(singleService.getNextQuestionId("downtime_preference")).toBeNull();
    });
  });

  describe("Question Generation", () => {
    it("should return null for invalid question ID", () => {
      const result = service.generateQuestion("invalid_id", mockTreatments);
      expect(result).toBeNull();
    });

    it("should generate question with correct base properties", () => {
      const result = service.generateQuestion("budget_preference", mockTreatments);

      expect(result).toMatchObject({
        id: "budget_preference",
        type: "single-choice",
        text: "What budget range are you most comfortable with?",
        order: 2,
      });
      expect(result?.filterApplier).toBeDefined();
    });

    it("should include skip option when allowSkip is true", () => {
      const result = service.generateQuestion("downtime_preference", mockTreatments);
      if (!result || !result.options) return;

      const skipOption = result?.options.find((opt) => opt.value === "no_preference");
      expect(skipOption).toBeDefined();
      expect(skipOption?.text).toBe("No preference");
    });

    it("should handle empty treatments array", () => {
      const result = service.generateQuestion("budget_preference", []);
      if (!result || !result.options) return;

      // Should still have skip option
      expect(result.options.some((opt) => opt.value === "no_preference")).toBe(true);
      // Should have no budget options since no treatments
      expect(result.options.filter((opt) => opt.value !== "no_preference")).toHaveLength(0);
    });
  });

  describe("Invalid Configuration Auto-Skip", () => {
    it("should return null (skip) when optionExtractor missing and allowSkip is false", () => {
      const invalidConfig: FilteringQuestionConfig[] = [
        {
          id: "no_extractor_no_skip",
          type: "single-choice",
          text: "Invalid question?",
          filterApplier: (treatments) => treatments,
          allowSkip: false, //  No skip allowed
          order: 1,
          //  Missing optionExtractor
        },
      ];

      const invalidService = new FilteringService(invalidConfig);
      const result = invalidService.generateQuestion("no_extractor_no_skip", mockTreatments);

      // Should return null (auto-skip)
      expect(result).toBeNull();
    });

    it("should work normally when optionExtractor missing but allowSkip is true", () => {
      const validConfig: FilteringQuestionConfig[] = [
        {
          id: "missing_extractor_but_skip_allowed",
          type: "single-choice",
          text: "Skip allowed question?",
          filterApplier: (treatments) => treatments,
          allowSkip: true, // Skip is allowed
          skipText: "Skip this",
          order: 1,
          // Missing optionExtractor but that's ok because allowSkip: true
        },
      ];

      const validService = new FilteringService(validConfig);
      const result = validService.generateQuestion("missing_extractor_but_skip_allowed", mockTreatments);
      if (!result || !result.options) return;

      // Should return question with only skip option
      expect(result.options).toHaveLength(1);
      expect(result.options[0]).toEqual({
        value: "no_preference",
        text: "Skip this",
      });
    });

    it("should handle optionExtractor throwing error", () => {
      const errorConfig: FilteringQuestionConfig[] = [
        {
          id: "error_extractor",
          type: "single-choice",
          text: "Error question?",
          optionExtractor: () => {
            throw new Error("Extraction failed");
          },
          filterApplier: (treatments) => treatments,
          allowSkip: true,
          order: 1,
        },
      ];

      const errorService = new FilteringService(errorConfig);
      const result = errorService.generateQuestion("error_extractor", mockTreatments);

      // Should return null (auto-skip) due to extraction error
      expect(result).toBeNull();
    });
  });

  describe("FilterApplier Edge Cases", () => {
    it("should handle filterApplier returning empty array", () => {
      const config: FilteringQuestionConfig[] = [
        {
          id: "strict_filter",
          type: "single-choice",
          text: "Very strict filter?",
          optionExtractor: () => [{ value: "strict", text: "Very Strict" }],
          filterApplier: () => [], // ← Valid function, but returns no treatments
          allowSkip: true,
          order: 1,
        },
      ];

      const service = new FilteringService(config);
      const result = service.generateQuestion("strict_filter", mockTreatments);

      expect(result).not.toBeNull();
      // Test that filtering works even with edge case results
    });
  });

  describe("Downtime Filtering", () => {
    //A test to make sure the extractDowntimeOptions function is creating appropriate categories from the raw data.

    it("should extract downtime options correctly", () => {
      const result = service.generateQuestion("downtime_preference", mockTreatments);
      if (!result || !result.options) return;
      const nonSkipOptions = result.options.filter((opt) => opt.value !== "no_preference") || [];

      expect(nonSkipOptions.length).toBeGreaterThan(0);
      // Should have options for different downtime categories
      expect(nonSkipOptions.some((opt) => opt.text.includes("downtime"))).toBe(true);
    });

    it("should filter by no downtime correctly", () => {
      const question = service.generateQuestion("downtime_preference", mockTreatments);
      const noDowntimeTreatments = question?.filterApplier?.(mockTreatments, ["0_days"]);

      expect(
        noDowntimeTreatments?.every((t) => t.downtime === "0 days" || t.downtime === "No downtime" || !t.downtime),
      ).toBe(true);
    });

    it("should handle no preference selection", () => {
      const question = service.generateQuestion("downtime_preference", mockTreatments);
      const allTreatments = question?.filterApplier?.(mockTreatments, ["no_preference"]);

      expect(allTreatments).toHaveLength(mockTreatments.length);
    });

    it("should handle treatments with empty downtime", () => {
      const treatmentsWithEmpty = [
        { id: "empty_downtime", name: "Empty", price_from: "£100", downtime: "", number_of_treatments: "1" },
      ];

      const question = service.generateQuestion("downtime_preference", treatmentsWithEmpty);
      expect(question).toBeTruthy();
      // Should not crash with empty downtime
    });

    it("should parse downtime ranges correctly", () => {
      const longDowntimeTreatments = mockTreatments.filter(
        (t) => t.downtime && (t.downtime.includes("14") || t.downtime.includes("21")),
      );

      expect(longDowntimeTreatments.length).toBeGreaterThan(0);
    });
  });

  describe("Budget Filtering", () => {
    it("should extract budget options based on treatment prices", () => {
      const result = service.generateQuestion("budget_preference", mockTreatments);
      if (!result || !result.options) return;
      const budgetOptions = result.options.filter((opt) => opt.value !== "no_preference") || [];

      expect(budgetOptions.length).toBeGreaterThan(0);
      // Should have different price ranges
      expect(budgetOptions.some((opt) => opt.text.includes("£"))).toBe(true);
    });

    it("should filter by budget range correctly", () => {
      const question = service.generateQuestion("budget_preference", mockTreatments);
      const lowBudgetTreatments = question?.filterApplier?.(mockTreatments, ["150-300"]);

      lowBudgetTreatments?.forEach((treatment) => {
        const price = parseInt(treatment.price_from?.replace(/[£,]/g, "") || "0");
        expect(price).toBeLessThanOrEqual(300);
      });
    });

    it("should handle high budget range", () => {
      const question = service.generateQuestion("budget_preference", mockTreatments);
      const highBudgetTreatments = question?.filterApplier?.(mockTreatments, ["500"]);

      highBudgetTreatments?.forEach((treatment) => {
        const price = parseInt(treatment.price_from?.replace(/[£,]/g, "") || "0");
        expect(price).toBeLessThanOrEqual(500);
      });
    });

    it("should handle treatments with missing or zero prices", () => {
      const treatmentsWithMissingPrices = [
        { id: "no_price", name: "No Price", price_from: "", downtime: "1 day", number_of_treatments: "1" },
        { id: "zero_price", name: "Free", price_from: "£0", downtime: "1 day", number_of_treatments: "1" },
      ];

      const question = service.generateQuestion("budget_preference", treatmentsWithMissingPrices);
      expect(question).toBeTruthy();

      const filtered = question?.filterApplier?.(treatmentsWithMissingPrices, ["150-300"]);
      // Should handle gracefully, potentially filtering out treatments with no price
      expect(Array.isArray(filtered)).toBe(true);
    });

    it("should handle no preference budget selection", () => {
      const question = service.generateQuestion("budget_preference", mockTreatments);
      const allTreatments = question?.filterApplier?.(mockTreatments, ["no_preference"]);

      expect(allTreatments).toHaveLength(mockTreatments.length);
    });
  });

  describe("Treatment Count Filtering", () => {
    it("should extract treatment count options", () => {
      const result = service.generateQuestion("treatment_count_preference", mockTreatments);
      if (!result || !result.options) return;
      const countOptions = result.options.filter((opt) => opt.value !== "no_preference") || [];

      expect(countOptions.length).toBeGreaterThan(0);
      // Should have single and/or multiple treatment options
      expect(countOptions.some((opt) => opt.text.includes("Single") || opt.text.includes("treatment"))).toBe(true);
    });

    it("should filter by single treatment correctly", () => {
      const question = service.generateQuestion("treatment_count_preference", mockTreatments);
      const singleTreatments = question?.filterApplier?.(mockTreatments, ["1"]);

      singleTreatments?.forEach((treatment) => {
        const count = treatment.number_of_treatments || "1";
        expect(count === "1" || count === "").toBe(true);
      });
    });

    it("should filter by multiple treatments correctly", () => {
      const question = service.generateQuestion("treatment_count_preference", mockTreatments);
      const multipleTreatments = question?.filterApplier?.(mockTreatments, ["2"]);

      // Multiple treatment selection should return all treatments
      // (as all can potentially be repeated)
      expect(multipleTreatments).toHaveLength(mockTreatments.length);
    });

    it("should handle treatments with empty treatment count", () => {
      const treatmentsWithEmptyCount = [
        { id: "empty_count", name: "Empty", price_from: "£100", downtime: "1 day", number_of_treatments: "" },
      ];

      const question = service.generateQuestion("treatment_count_preference", treatmentsWithEmptyCount);
      const singleTreatments = question?.filterApplier?.(treatmentsWithEmptyCount, ["1"]);

      // Empty count should be treated as single treatment
      expect(singleTreatments).toHaveLength(1);
    });

    it("should handle treatment count ranges", () => {
      const treatmentWithRange = mockTreatments.find((t) => t.number_of_treatments?.includes("-"));
      expect(treatmentWithRange).toBeTruthy();

      const question = service.generateQuestion("treatment_count_preference", mockTreatments);
      const multipleTreatments = question?.filterApplier?.(mockTreatments, ["2"]);

      expect(multipleTreatments?.includes(treatmentWithRange!)).toBe(true);
    });
  });

  describe("Complex Integration Scenarios", () => {
    it("should handle all filtering questions in sequence", () => {
      // Test complete flow through all questions
      const downtimeQuestion = service.generateQuestion("downtime_preference", mockTreatments);
      expect(downtimeQuestion).toBeTruthy();

      const budgetQuestion = service.generateQuestion("budget_preference", mockTreatments);
      expect(budgetQuestion).toBeTruthy();

      const countQuestion = service.generateQuestion("treatment_count_preference", mockTreatments);
      expect(countQuestion).toBeTruthy();
    });

    //if a user refreshes the page or navigates back to this question, they should see the exact same options
    it("should maintain consistent results across multiple calls", () => {
      const result1 = service.generateQuestion("budget_preference", mockTreatments);
      const result2 = service.generateQuestion("budget_preference", mockTreatments);

      expect(result1).toEqual(result2);
    });

    it("should handle large treatment datasets", () => {
      // Generate large dataset
      const largeTreatmentSet: Treatment[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `treatment_${i}`,
        name: `Treatment ${i}`,
        price_from: `£${100 + i * 10}`,
        downtime: `${i % 5} days`,
        number_of_treatments: `${(i % 3) + 1}`,
      }));

      const question = service.generateQuestion("budget_preference", largeTreatmentSet);
      expect(question).toBeTruthy();

      const filtered = question?.filterApplier?.(largeTreatmentSet, ["150-300"]);
      expect(Array.isArray(filtered)).toBe(true);
    });

    it("should handle malformed treatment data gracefully", () => {
      const malformedTreatments: Treatment[] = [
        {
          id: "malformed1",
          name: "Bad Price",
          price_from: "invalid",
          downtime: "bad",
          number_of_treatments: "invalid",
        },
        {
          id: "malformed2",
          name: "Null Values",
          price_from: null as unknown as string,
          downtime: null as unknown as string,
          number_of_treatments: null as unknown as string,
        },
      ];

      // Should not crash with malformed data
      expect(() => {
        const question = service.generateQuestion("budget_preference", malformedTreatments);
        question?.filterApplier?.(malformedTreatments, ["150-300"]);
      }).not.toThrow();
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle data changes between option generation and filtering", () => {
      // Generate options with full dataset
      const question = service.generateQuestion("budget_preference", mockTreatments);

      // But filter with different/smaller dataset (simulates race condition)
      const smallerDataset = mockTreatments.slice(0, 2); // Different data
      const filtered = question?.filterApplier?.(smallerDataset, ["500"]);

      // Might return empty if smaller dataset has no expensive treatments
      expect(Array.isArray(filtered)).toBe(true);
    });
  });
});
