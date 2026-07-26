# `@lucid-softworks/http-app`

A compact composition root for routes, middleware, and problem responses.

```ts
import { HttpApp } from "@lucid-softworks/http-app";

const app = new HttpApp().get("/health", () => new Response("ok"));

const request = new Request("https://example.com/health");
const response = await app.fetch(request);
```

Routes use `HttpRouter`, middleware uses onion composition, and thrown values
become safe problem responses. `handler()` can be passed directly to a runtime
adapter such as `http-server-node`.
