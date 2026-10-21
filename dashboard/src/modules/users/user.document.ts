import type ITimestamps from "@/interfaces/ITimestamps";
import type { Plan } from "./user.types";

export interface IUserDocument extends ITimestamps {
  name: string;
  email: string;
  passwordHash: string;
  plan: Plan;
}
