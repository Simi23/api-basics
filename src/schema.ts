import z from "zod";

/**
 * @openapi
 * components:
 *   tags:
 *     - name: Unauthenticated endpoints
 *       description: All endpoints with no authentication needed
 *
 *     - name: Endpoints with basic authentication
 *       description: "Endpoints authenticated with the `Authorization: Basic ...` header scheme"
 *
 *     - name: Endpoints with bearer authentication
 *       description: "Endpoints authenticated with the `Authorization: Bearer ...` header scheme"
 *
 *     - name: Session-authenticated endpoints
 *       description: Endpoints authenticated via session cookies
 */

/**
 * @openapi
 * components:
 *   securitySchemes:
 *     basicAuth:
 *       type: http
 *       scheme: basic
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *     sessionAuth:
 *       type: apiKey
 *       in: cookie
 *       name: sessionId
 */

/**
 * @openapi
 * components:
 *   responses:
 *     Unauthorized:
 *       description: "Exception is thrown if an unauthorized request is made (wrong credentials)."
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: integer
 *                 const: 401
 *               message:
 *                 type: string
 *                 const: "Unauthorized"
 *     InterfaceNotFound:
 *       description: Exception is thrown if an interface with the given ID is not found
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: integer
 *                 const: 404
 *               message:
 *                 type: string
 *                 const: "Interface with id <xyz> not found"
 *     InvalidBody:
 *       description: Exception is thrown if an incorrect value is supplied in the request body.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: integer
 *                 const: 400
 *               message:
 *                 type: string
 *                 const: "Request body invalid!"
 *     InvalidQuery:
 *       description: Exception is thrown if an incorrect value is supplied to a query parameter.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: integer
 *                 const: 400
 *               message:
 *                 type: string
 *                 const: "Query parameter invalid!"
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     Interface:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: cuid2
 *           readOnly: true
 *           examples:
 *             - "qmvfl67osiobvlex5cmchy6u"
 *         switchName:
 *           type: string
 *           description: Name of the switch the interface belongs to
 *           examples:
 *             - "SW-CORE-1"
 *         interface:
 *           type: string
 *           description: Name of the interface
 *           examples:
 *             - "TenGigabitEthernet1/0/1"
 *         vlanId:
 *           type: integer
 *           description: Number of the VLAN which the interface belongs to
 *           examples:
 *             - 10
 *         speedMbps:
 *           type: integer
 *           description: Link speed of the interface in megabytes per second
 *           examples:
 *             - 10000
 *         status:
 *           type: string
 *           description: Interface status, one of `connected`, `down` and `error`
 *           enum:
 *             - "connected"
 *             - "down"
 *             - "error"
 *           examples:
 *             - "connected"
 *         description:
 *           type: string
 *           description: Interface description
 *           examples:
 *             - "=> PATCH-1-12"
 */

export const interfaceSchema = z.object({
  id: z.cuid2().optional(),
  switchName: z.string(),
  interface: z.string(),
  vlanId: z.int(),
  speedMbps: z.int(),
  status: z.string(),
  description: z.string().min(0),
});

/**
 * @openapi
 * components:
 *   responses:
 *     QueryResponse:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               total:
 *                 type: integer
 *                 description: How many records exist in total for this resource
 *                 examples:
 *                   - 7893
 *               skip:
 *                 type: integer
 *                 description: How many records were skipped with the `skip` query parameter
 *                 examples:
 *                   - 500
 *               limit:
 *                 type: integer
 *                 description: How many records the response was limited to with the `limit` query parameter
 *                 examples:
 *                   - 100
 *               data:
 *                 type: array
 *                 items:
 *                   $ref: "#/components/schemas/Interface"
 */

export const querySchema = z.object({
  sort: interfaceSchema.keyof().optional(),
  dir: z.union([z.literal("asc"), z.literal("desc")]).optional(),
  skip: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

/**
 * @openapi
 * components:
 *   schemas:
 *     Credential:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *           description: A valid username
 *           examples:
 *             - "user"
 *         password:
 *           type: string
 *           description: Password for the user
 *           examples:
 *             - "password"
 */

export const loginSchema = z.object({
  username: z.literal("user"),
  password: z.literal("password"),
});

export const bearerSchema = z.templateLiteral(["Bearer ", z.string()]);
