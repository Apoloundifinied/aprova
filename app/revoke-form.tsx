"use client";

import { useActionState } from "react";
import { revokeLink } from "./actions";
import { useNotify } from "./notifications";

export function RevokeForm({ deliveryId }: { deliveryId: string }) {
  const notify = useNotify();
  const [, action, pending] = useActionState(async (_: null, form: FormData) => {
    const result = await revokeLink(form);
    if (result.error) notify(result.error, "error");
    else notify("Link de revisão revogado.");
    return null;
  }, null);

  return <form action={action}>
    <input type="hidden" name="delivery" value={deliveryId} />
    <button type="submit" className="secondary" disabled={pending}>{pending ? "Revogando…" : "Revogar link"}</button>
  </form>;
}
