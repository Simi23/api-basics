import { defineMiddleware, getCookie, HTTPError } from "h3";
import { bearerSchema } from "./schema";
import jwt from "jsonwebtoken";
import { appData } from ".";

////////////////////
// JWT Middleware //
////////////////////
export const jwtMiddleware = defineMiddleware((event, next) => {
  const authHeader = event.req.headers.get("Authorization")?.trim();
  const parsed = bearerSchema.safeParse(authHeader);

  if (!parsed.success) {
    throw new HTTPError(`Unauthorized`, {
      status: 401,
    });
  }

  const token = parsed.data.slice(7);

  try {
    const decoded = jwt.verify(token, appData.jwtSecret);
  } catch (error) {
    throw new HTTPError(`Unauthorized`, {
      status: 401,
    });
  }

  return next();
});

////////////////////////
// Session Middleware //
////////////////////////
export const sessionMiddleware = defineMiddleware((event, next) => {
  const sessionId = getCookie(event, "sessionId");

  if (!sessionId) {
    throw new HTTPError(`Unauthorized`, {
      status: 401,
    });
  }

  if (!appData.validSessions.some((s) => s === sessionId)) {
    throw new HTTPError(`Unauthorized`, {
      status: 401,
    });
  }

  return next();
});
