import { defineHook } from "workflow";
import { z } from "zod";

export const contactAgentHook = defineHook({
  schema: z.object({
    approved: z.boolean(),
    message: z.string().optional(),
  }),
});
