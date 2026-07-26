import { HttpError } from "@lucid-softworks/http-errors";
import { describe, expect, it } from "vitest";

import { HttpApp } from "../src/index.js";

describe("HTTP app", () => {
  it("combines middleware with GET, POST, and generic routes", async () => {
    const app = new HttpApp()
      .use(async (_request, context, next) => {
        context.state.set("middleware", true);
        const response = await next();
        response.headers.set("x-middleware", "yes");
        return response;
      })
      .get("/users/:id", (_request, context) =>
        Response.json({
          id: context.params.id,
          middleware: context.state.get("middleware"),
        }),
      )
      .post("/users", () => new Response(null, { status: 201 }))
      .route("DELETE", "/users/:id", () => new Response(null, { status: 204 }));

    const get = await app.fetch(new Request("https://example.com/users/42"));
    expect(await get.json()).toEqual({ id: "42", middleware: true });
    expect(get.headers.get("x-middleware")).toBe("yes");
    expect(
      (
        await app.fetch(
          new Request("https://example.com/users", { method: "POST" }),
        )
      ).status,
    ).toBe(201);
    expect(
      (
        await app.fetch(
          new Request("https://example.com/users/42", { method: "DELETE" }),
        )
      ).status,
    ).toBe(204);
  });

  it("converts public and unknown errors into problem responses", async () => {
    const app = new HttpApp()
      .get("/known", () => {
        throw new HttpError(409, "duplicate");
      })
      .get("/unknown", () => {
        throw new Error("secret");
      });
    const known = await app.fetch(new Request("https://example.com/known"));
    expect(known.status).toBe(409);
    expect(await known.json()).toMatchObject({
      detail: "duplicate",
      instance: "/known",
    });
    const unknown = await app.handler()(
      new Request("https://example.com/unknown"),
      {
        params: {},
        requestId: "manual",
        state: new Map(),
        waitUntil: () => undefined,
      },
    );
    expect(unknown.status).toBe(500);
    expect(await unknown.json()).toMatchObject({
      detail: "Internal Server Error",
    });
  });
});
