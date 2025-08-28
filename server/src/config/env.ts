import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  port: z
    .string()
    .default("3000")
    .transform((val) => parseInt(val, 10)),
});

export const env = schema.parse({
  port: process.env.PORT,
});
