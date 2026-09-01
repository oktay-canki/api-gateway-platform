import { Schema } from "mongoose";

import ITimestamps from "@/interfaces/ITimestamps";
import { hashPassword } from "@/lib/crypto";

export const PLANS = ["free", "pro"] as const;

export type Plan = (typeof PLANS)[number];

export interface IUser extends ITimestamps {
  name: string;
  email: string;
  passwordHash: string;
  plan: Plan;
}

export const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    plan: {
      type: String,
      enum: PLANS,
      default: "free",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("passwordHash")) {
    return;
  }

  this.passwordHash = await hashPassword(this.passwordHash);
});
