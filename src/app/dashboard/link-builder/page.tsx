import { LinkBuilderEditor } from "@/components/builder/link-builder-editor";
import { requireCurrentUser } from "@/server/current-user";

export default async function LinkBuilderPage() {
  const user = await requireCurrentUser();
  return <LinkBuilderEditor user={user} />;
}
