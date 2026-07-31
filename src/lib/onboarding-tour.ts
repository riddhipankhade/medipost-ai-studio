export type TourStep = {
  /** CSS selector for the element to spotlight. The first *visible* match wins,
   *  so the same selector can safely exist in both the desktop sidebar and the
   *  mobile nav sheet without colliding. */
  target: string;
  title: string;
  description: string;
};

export const dashboardTourSteps: TourStep[] = [
  {
    target: '[data-tour="new-generation"]',
    title: "Start here",
    description: "Generate a ready-to-post caption, patient handout, or carousel in under 30 seconds.",
  },
  {
    target: '[data-tour="credits-card"]',
    title: "Your generations",
    description: "This tracks how many AI generations you have left this month on your current plan.",
  },
  {
    target: '[data-tour="plan-card"]',
    title: "Your plan",
    description: "See your active plan and renewal date at a glance — upgrade anytime from Subscription.",
  },
  {
    target: '[data-tour="quick-actions"]',
    title: "Quick actions",
    description: "Jump straight into the most common content types without opening the full Content Studio.",
  },
  {
    target: '[data-tour="nav-brand"]',
    title: "Brand Kit",
    description: "Add your clinic logo, colors, and voice once here — every generation will use it automatically.",
  },
  {
    target: '[data-tour="nav-history"]',
    title: "Content History",
    description: "Every past generation is saved here, so you can reuse or repurpose it anytime.",
  },
  {
    target: '[data-tour="nav-settings"]',
    title: "Need a refresher?",
    description: "Full documentation and a button to replay this tour live in Settings, anytime.",
  },
];
