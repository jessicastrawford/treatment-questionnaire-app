export const DOWNTIME_OPTIONS_CONFIG = [
  { key: "none", label: "No downtime", maxDays: 0 },
  { key: "minimal", label: "Minimal downtime", maxDays: 3 },
  { key: "moderate", label: "Moderate downtime", maxDays: 6 },
  { key: "significant", label: "Significant downtime", maxDays: Infinity },
];

export const BUDGET_OPTIONS_CONFIG = [
  { value: "0-50", text: "£0 - £150", min: 0, max: 150 },
  { value: "150-300", text: "£150 - £300", min: 150, max: 300 },
  { value: "300-500", text: "£300 - £500", min: 300, max: 500 },
  { value: "500", text: "£500+", min: 500, max: Infinity },
];
