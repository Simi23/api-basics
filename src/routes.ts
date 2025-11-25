import {
  defineEventHandler,
  getValidatedQuery,
  H3,
  HTTPError,
  readValidatedBody,
  setCookie,
} from "h3";
import { interfaceSchema, loginSchema, querySchema } from "./schema";
import { appData } from ".";
import type { Inventory } from "./data";
import { createId } from "@paralleldrive/cuid2";
import jwt from "jsonwebtoken";
import { jwtMiddleware, sessionMiddleware } from "./middleware";

//////////////
// Read all //
//////////////

const readAllHandler = defineEventHandler(async (event) => {
  const q = await getValidatedQuery(event, querySchema.safeParse);

  let output = [...appData.db];
  const addedOptions = {
    total: output.length,
    skip: 0,
    limit: 0,
  };

  if (!q.success) {
    throw new HTTPError(`Query parameter invalid!`, {
      status: 400,
    });
  }

  // Implement sorting
  if (q.data.sort != undefined) {
    const sortBy = q.data.sort;
    const sortDir = q.data.dir ?? "asc";

    output = output.sort((a, b) => {
      let res = String(a[sortBy]).localeCompare(String(b[sortBy]));
      if (sortDir == "desc") {
        res *= -1;
      }

      return res;
    });
  }

  // Implement skipping
  if (q.data.skip != undefined) {
    const start = q.data.skip;
    output = output.slice(start);
    addedOptions.skip = start;
  }

  // Implement taking
  if (q.data.limit != undefined) {
    const take = q.data.limit;
    output = output.slice(0, take);
    addedOptions.limit = take;
  }

  return { ...addedOptions, data: output };
});

//////////////
// Read one //
//////////////
const readOneHandler = defineEventHandler((event) => {
  const id = event.context.params?.id ?? "";

  const element = appData.db.find((i) => i.id === id);

  if (!element) {
    throw new HTTPError(`Interface with id '${id}' not found`, {
      status: 404,
    });
  }

  return element;
});

////////////
// Delete //
////////////
const deleteHandler = defineEventHandler((event) => {
  const id = event.context.params?.id ?? "";

  const element = appData.db.find((i) => i.id === id);

  if (!element) {
    throw new HTTPError(`Interface with id '${id}' not found`, {
      status: 404,
    });
  }

  appData.db = appData.db.filter((i) => i.id !== id);
});

////////////
// Create //
////////////
const createHandler = defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, interfaceSchema.safeParse);

  if (!body.success) {
    throw new HTTPError(`Request body invalid!`, {
      status: 400,
    });
  }

  const newObject: Inventory = {
    id: createId(),
    ...body.data,
  };

  appData.db.push(newObject);

  return newObject;
});

////////////
// Update //
////////////
const updateHandler = defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, interfaceSchema.safeParse);

  if (!body.success) {
    throw new HTTPError(`Request body invalid!`, {
      status: 400,
    });
  }

  const id = event.context.params?.id ?? "-1";

  const index = appData.db.findIndex((i) => i.id === id);

  if (index === -1) {
    throw new HTTPError(`Interface with id '${id}' not found`, {
      status: 404,
    });
  }

  appData.db[index] = {
    id: appData.db[index]?.id ?? "",
    ...body.data,
  };

  return appData.db[index];
});

///////////////
// Get token //
///////////////
const tokenLoginHandler = defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, loginSchema.safeParse);

  if (!body.success) {
    throw new HTTPError(`Unauthorized`, {
      status: 401,
    });
  }

  const token = jwt.sign({ username: "user" }, appData.jwtSecret);

  return {
    token,
  };
});

/////////////////
// Get session //
/////////////////
const sessionLoginHandler = defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, loginSchema.safeParse);

  if (!body.success) {
    throw new HTTPError(`Unauthorized`, {
      status: 401,
    });
  }

  const sessionId = `${createId()}${createId()}`;
  appData.validSessions.push(sessionId);

  setCookie(event, "sessionId", sessionId);
});

export function installRoutes(app: H3) {
  ///////////////////////
  // Routing / no auth //
  ///////////////////////

  // Read all
  app.get("/interface", readAllHandler);

  // Read one
  app.get("/interface/:id", readOneHandler);

  // Delete one
  app.delete("/interface/:id", deleteHandler);

  // Create new
  app.post("/interface", createHandler);

  // Update
  app.put("/interface/:id", updateHandler);

  // Get token
  app.post("/token/login", tokenLoginHandler);

  // Get session
  app.post("/session/login", sessionLoginHandler);

  //////////////////////////
  // Routing / token auth //
  //////////////////////////

  // Read all
  app.get("/token/interface", readAllHandler, { middleware: [jwtMiddleware] });

  ////////////////////////////
  // Routing / session auth //
  ////////////////////////////

  // Read all
  app.get("/session/interface", readAllHandler, {
    middleware: [sessionMiddleware],
  });
}
