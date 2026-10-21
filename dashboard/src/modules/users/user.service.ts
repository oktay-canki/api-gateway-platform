import argon2 from "argon2";

import { connectDB } from "@/lib/db";
import { User } from "./user.model";
import {
  LoginUserInput,
  RegisterUserInput,
} from "@/modules/users/user.validation";
import { JwtService } from "@/infrastructure/auth/jwt.service";
import AppError from "@/infrastructure/errors/app-error";
import { Plan } from "@/modules/users/user.types";
import { RouteRule } from "@/modules/route-rules/route-rule.model";
import { Api } from "@/modules/apis/api.model";

export class UserService {
  constructor(private readonly jwtService: JwtService) {}

  async register(data: RegisterUserInput) {
    await connectDB();

    const existingUser = await User.findOne({
      email: data.email,
    });

    if (existingUser) {
      throw new AppError("User already exists", 409);
    }

    const user = await User.create({
      name: data.name,
      email: data.email,
      passwordHash: data.password,
      plan: data.plan,
    });

    return user;
  }

  async login(data: LoginUserInput) {
    await connectDB();

    const user = await User.findOne({
      email: data.email,
    }).select("+passwordHash");

    if (!user) {
      throw new AppError("Invalid email or password", 400);
    }

    const passwordValid = await argon2.verify(user.passwordHash, data.password);

    if (!passwordValid) {
      throw new AppError("Invalid email or password", 400);
    }

    const token = await this.jwtService.sign({
      userId: user._id.toString(),
    });

    return {
      user,
      token,
    };
  }

  async findById(id: string) {
    await connectDB();

    return User.findById(id);
  }

  async changePlan(userId: string, plan: Plan) {
    await connectDB();

    return User.findOneAndUpdate(
      { _id: userId },
      { $set: { plan } },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );
  }

  async deleteAccount(userId: string) {
    await connectDB();

    const apis = await Api.find({ userId }).select("_id");
    const apiIds = apis.map((api) => api._id);

    await RouteRule.deleteMany({
      apiId: { $in: apiIds },
    });

    await Api.deleteMany({ userId });

    return User.findByIdAndDelete(userId);
  }
}
