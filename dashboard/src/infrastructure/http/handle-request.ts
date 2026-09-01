import AppError from "@/infrastructure/errors/app-error";
import { treeifyError, ZodError } from "zod";
import { MongoServerError } from "mongodb";

export function handleRequest(
  handler: () => Promise<Response>,
): Promise<Response> {
  return handler().catch((error) => {
    if (error instanceof ZodError) {
      return Response.json(
        {
          message: "Validation failed",
          errors: treeifyError(error),
        },
        { status: 400 },
      );
    }

    if (error instanceof SyntaxError) {
      return Response.json({ message: "Invalid JSON body" }, { status: 400 });
    }

    if (error instanceof MongoServerError && error.code === 11000) {
      return Response.json(
        { message: "Resource already exists" },
        { status: 409 },
      );
    }

    if (error instanceof AppError) {
      return Response.json(
        { message: error.message },
        { status: error.statusCode },
      );
    }

    console.error(error);

    return Response.json({ message: "Internal server error" }, { status: 500 });
  });
}
