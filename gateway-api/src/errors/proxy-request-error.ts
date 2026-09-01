import { GatewayError } from './gateway-error.js';

export class ProxyRequestError extends GatewayError {
  readonly statusCode = 502;

  constructor(message = 'Bad Gateway', options?: ErrorOptions) {
    super(message, options);
  }
}
