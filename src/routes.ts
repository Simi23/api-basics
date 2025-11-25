import {
  basicAuth,
  defineEventHandler,
  getValidatedQuery,
  H3,
  HTTPError,
  readValidatedBody,
  setCookie,
  setResponseStatus,
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

/**
 * @openapi
 * /interface:
 *   get:
 *     summary: List interfaces
 *     description: Returns all of the interfaces
 *     tags:
 *       - Unauthenticated endpoints
 *     parameters:
 *       - name: sort
 *         in: query
 *         required: false
 *         description: Sorts results based on `Inventory` field
 *         schema:
 *           type: string
 *           enum:
 *             - id
 *             - switchName
 *             - interface
 *             - vlanId
 *             - speedMbps
 *             - status
 *             - description
 *       - name: dir
 *         in: query
 *         required: false
 *         description: Direction for the sort. Default is ascending.
 *         schema:
 *           type: string
 *           enum:
 *             - asc
 *             - desc
 *       - name: skip
 *         in: query
 *         required: false
 *         description: Skips the first N results. Used for pagination.
 *         schema:
 *           type: integer
 *       - name: limit
 *         in: query
 *         required: false
 *         description: Limits the response to N objects.
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         $ref: '#/components/responses/QueryResponse'
 *       '400':
 *         $ref: '#/components/responses/InvalidQuery'
 */
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

/**
 * @openapi
 * /interface/{interfaceId}:
 *   get:
 *     summary: Get interface
 *     description: Gets interface data by ID
 *     tags:
 *       - Unauthenticated endpoints
 *     parameters:
 *       - name: interfaceId
 *         in: path
 *         required: true
 *         description: 'The ID of the interface to look for, e.g. `xxl8uiq4ubgtld4dm3ikgyln`'
 *         schema:
 *           type: string
 *           format: cuid2
 *     responses:
 *       '200':
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Interface'
 *       '404':
 *         $ref: '#/components/responses/InterfaceNotFound'
 */
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

/**
 * @openapi
 * /interface/{interfaceId}:
 *   delete:
 *     summary: Delete interface
 *     description: Deletes interface data by ID
 *     tags:
 *       - Unauthenticated endpoints
 *     parameters:
 *       - name: interfaceId
 *         in: path
 *         required: true
 *         description: 'The ID of the interface to delete, e.g. `xxl8uiq4ubgtld4dm3ikgyln`'
 *         schema:
 *           type: string
 *           format: cuid2
 *     responses:
 *       '200':
 *         description: "OK"
 *       '404':
 *         $ref: '#/components/responses/InterfaceNotFound'
 */
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

/**
 * @openapi
 * /interface:
 *   post:
 *     summary: Create interface
 *     description: Create a new interface
 *     tags:
 *       - Unauthenticated endpoints
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Interface'
 *     responses:
 *       '201':
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Interface'
 *       '400':
 *         $ref: '#/components/responses/InvalidBody'
 */
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

  event.res.status = 201;

  return newObject;
});

////////////
// Update //
////////////

/**
 * @openapi
 * /interface/{interfaceId}:
 *   put:
 *     summary: Update interface
 *     description: Update an interface. All data fields need to be sent.
 *     tags:
 *       - Unauthenticated endpoints
 *     parameters:
 *       - name: interfaceId
 *         in: path
 *         required: true
 *         description: 'The ID of the interface to update, e.g. `xxl8uiq4ubgtld4dm3ikgyln`'
 *         schema:
 *           type: string
 *           format: cuid2
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Interface'
 *     responses:
 *       '200':
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Interface'
 *       '400':
 *         $ref: '#/components/responses/InvalidBody'
 *       '404':
 *         $ref: '#/components/responses/InterfaceNotFound'
 */
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

/**
 * @openapi
 * /token/login:
 *   post:
 *     summary: Obtain Bearer token
 *     description: Get a Bearer token in exchange for username/password
 *     tags:
 *       - Unauthenticated endpoints
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Credential'
 *     responses:
 *       '200':
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
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

/**
 * @openapi
 * /session/login:
 *   post:
 *     summary: Obtain session
 *     description: Get a session ID in exchange for username/password
 *     tags:
 *       - Unauthenticated endpoints
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Credential'
 *     responses:
 *       '200':
 *         description: >
 *           Successfully authenticated.
 *           The session ID is returned in a cookie named `sessionId`. You need to include it in subsequent requests.
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               examples:
 *                 - "sessionId=xxl8uiq4ubgtld4dm3ikgylnxxl8uiq4ubgtld4dm3ikgyln; Path=/; HttpOnly"
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
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
  // Routing / basic auth //
  //////////////////////////

  // Read all
  app.get("/basic/interface", readAllHandler, {
    middleware: [basicAuth({ username: "user", password: "password" })],
  });

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

/**
 * @openapi
 * /basic/interface:
 *   get:
 *     summary: List interfaces
 *     description: Returns all of the interfaces
 *     tags:
 *       - Endpoints with basic authentication
 *     security:
 *       - basicAuth: []
 *     parameters:
 *       - name: sort
 *         in: query
 *         required: false
 *         description: Sorts results based on `Inventory` field
 *         schema:
 *           type: string
 *           enum:
 *             - id
 *             - switchName
 *             - interface
 *             - vlanId
 *             - speedMbps
 *             - status
 *             - description
 *       - name: dir
 *         in: query
 *         required: false
 *         description: Direction for the sort. Default is ascending.
 *         schema:
 *           type: string
 *           enum:
 *             - asc
 *             - desc
 *       - name: skip
 *         in: query
 *         required: false
 *         description: Skips the first N results. Used for pagination.
 *         schema:
 *           type: integer
 *       - name: limit
 *         in: query
 *         required: false
 *         description: Limits the response to N objects.
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         $ref: '#/components/responses/QueryResponse'
 *       '400':
 *         $ref: '#/components/responses/InvalidQuery'
 */

/**
 * @openapi
 * /token/interface:
 *   get:
 *     summary: List interfaces
 *     description: Returns all of the interfaces
 *     tags:
 *       - Endpoints with bearer authentication
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: sort
 *         in: query
 *         required: false
 *         description: Sorts results based on `Inventory` field
 *         schema:
 *           type: string
 *           enum:
 *             - id
 *             - switchName
 *             - interface
 *             - vlanId
 *             - speedMbps
 *             - status
 *             - description
 *       - name: dir
 *         in: query
 *         required: false
 *         description: Direction for the sort. Default is ascending.
 *         schema:
 *           type: string
 *           enum:
 *             - asc
 *             - desc
 *       - name: skip
 *         in: query
 *         required: false
 *         description: Skips the first N results. Used for pagination.
 *         schema:
 *           type: integer
 *       - name: limit
 *         in: query
 *         required: false
 *         description: Limits the response to N objects.
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         $ref: '#/components/responses/QueryResponse'
 *       '400':
 *         $ref: '#/components/responses/InvalidQuery'
 */

/**
 * @openapi
 * /session/interface:
 *   get:
 *     summary: List interfaces
 *     description: Returns all of the interfaces
 *     tags:
 *       - "Session-authenticated endpoints"
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - name: sort
 *         in: query
 *         required: false
 *         description: Sorts results based on `Inventory` field
 *         schema:
 *           type: string
 *           enum:
 *             - id
 *             - switchName
 *             - interface
 *             - vlanId
 *             - speedMbps
 *             - status
 *             - description
 *       - name: dir
 *         in: query
 *         required: false
 *         description: Direction for the sort. Default is ascending.
 *         schema:
 *           type: string
 *           enum:
 *             - asc
 *             - desc
 *       - name: skip
 *         in: query
 *         required: false
 *         description: Skips the first N results. Used for pagination.
 *         schema:
 *           type: integer
 *       - name: limit
 *         in: query
 *         required: false
 *         description: Limits the response to N objects.
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         $ref: '#/components/responses/QueryResponse'
 *       '400':
 *         $ref: '#/components/responses/InvalidQuery'
 */
