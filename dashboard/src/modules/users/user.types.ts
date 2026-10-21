export const PLANS = ["free", "pro"] as const;

export type Plan = (typeof PLANS)[number];

export type UserResponse = {
  id: string;
  name: string;
  email: string;
  plan: Plan;
};
