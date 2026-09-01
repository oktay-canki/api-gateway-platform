export abstract class GatewayError extends Error {
  abstract readonly statusCode: number;

  protected constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}
