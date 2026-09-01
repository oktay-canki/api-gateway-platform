import { errors, SignJWT, jwtVerify, type JWTPayload } from "jose";

import { config } from "@/config/env";
import AppError from "@/infrastructure/errors/app-error";

export interface AuthJwtPayload extends JWTPayload {
  userId: string;
}

export class JwtService {
  private getSecret() {
    if (!config.auth.jwtSecret) {
      throw new AppError("JWT_SECRET is not defined", 500);
    }

    return new TextEncoder().encode(config.auth.jwtSecret);
  }

  async sign(payload: AuthJwtPayload): Promise<string> {
    return new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(config.auth.jwtExpiration)
      .sign(this.getSecret());
  }

  async verify(token: string): Promise<AuthJwtPayload> {
    try {
      const { payload } = await jwtVerify(token, this.getSecret());

      if (typeof payload.userId !== "string") {
        throw new AppError("Invalid JWT payload", 401);
      }

      return {
        ...payload,
        userId: payload.userId,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error instanceof errors.JOSEError) {
        throw new AppError("Invalid or expired token", 401);
      }

      throw error;
    }
  }
}
