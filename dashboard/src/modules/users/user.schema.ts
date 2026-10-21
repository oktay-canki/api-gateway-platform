import { Schema } from "mongoose";

import { hashPassword } from "@/lib/crypto";
import { PLANS } from "./user.types";
import type { IUserDocument } from "./user.document";

export const userSchema = new Schema<IUserDocument>(
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
