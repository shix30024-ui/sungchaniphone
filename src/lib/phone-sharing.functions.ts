import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { validateSharedPatch } from "@/components/phone/shared-policy";

export const saveSharedPhone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { patch: unknown; revision: number }) => ({ patch: validateSharedPatch(data.patch), revision: data.revision }))
  .handler(async ({ data, context }) => {
    const { data: owner, error: roleError } = await context.supabase.rpc("is_phone_owner");
    if (roleError || !owner) throw new Error("Only the owner can save shared content");
    const { data: revision, error } = await context.supabase.rpc("save_phone_content", { p_patch: data.patch as never, p_revision: data.revision });
    if (error) throw new Error(error.message);
    return revision;
  });