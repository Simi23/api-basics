import z from "zod";

export const interfaceSchema = z.object({
  id: z.cuid2().optional(),
  switchName: z.string(),
  interface: z.string(),
  vlanId: z.int(),
  speedMbps: z.int(),
  status: z.string(),
  description: z.string().min(0),
});

export const querySchema = z.object({
  sort: interfaceSchema.keyof().optional(),
  dir: z.union([z.literal("asc"), z.literal("desc")]).optional(),
  skip: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

export const loginSchema = z.object({
  username: z.literal("user"),
  password: z.literal("password"),
});

export const bearerSchema = z.templateLiteral(["Bearer ", z.string()]);
