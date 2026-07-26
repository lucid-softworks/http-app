import {
  createHttpContext,
  type HttpContext,
  type HttpHandler,
} from "@lucid-softworks/http-core";
import { httpErrorResponse } from "@lucid-softworks/http-errors";
import {
  composeHttpMiddleware,
  type HttpMiddleware,
} from "@lucid-softworks/http-middleware";
import { HttpRouter } from "@lucid-softworks/http-router";

/** A small application composition root for routers and middleware. */
export class HttpApp {
  readonly router: HttpRouter = new HttpRouter();
  private readonly middleware: HttpMiddleware[] = [];

  use(layer: HttpMiddleware): this {
    this.middleware.push(layer);
    return this;
  }

  route(method: string, pattern: string, handler: HttpHandler): this {
    this.router.add(method, pattern, handler);
    return this;
  }

  get(pattern: string, handler: HttpHandler): this {
    return this.route("GET", pattern, handler);
  }

  post(pattern: string, handler: HttpHandler): this {
    return this.route("POST", pattern, handler);
  }

  handler(): HttpHandler {
    const routed: HttpHandler = (request, context) =>
      this.router.handle(request, context);
    const composed = composeHttpMiddleware(this.middleware, routed);
    return async (request, context): Promise<Response> => {
      try {
        return await composed(request, context);
      } catch (error) {
        return httpErrorResponse(error, new URL(request.url).pathname);
      }
    };
  }

  fetch(
    request: Request,
    context: HttpContext = createHttpContext(),
  ): Promise<Response> {
    return Promise.resolve(this.handler()(request, context));
  }
}
