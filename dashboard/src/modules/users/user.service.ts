import argon2 from "argon2";

import { connectDB } from "@/lib/db";
import { User } from "./user.model";
import {
  LoginUserInput,
  RegisterUserInput,
} from "@/modules/users/user.validation";
import { JwtService } from "@/infrastructure/auth/jwt.service";
import AppError from "@/infrastructure/errors/app-error";

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
}
