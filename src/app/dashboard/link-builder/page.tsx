import Link from "next/link";
import { Lock, Sparkles, UploadCloud, Wand2 } from "lucide-react";
import { LinkBuilderEditor } from "@/components/builder/link-builder-editor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireCurrentUser } from "@/server/current-user";
import { canUseBuildLink } from "@/server/link-builder-access";
import { getCreatorEntitlementsForUser } from "@/server/subscription-policy";

export default async function LinkBuilderPage() {
  const user = await requireCurrentUser();
  const entitlementState = await getCreatorEntitlementsForUser(user.id);

  if (!canUseBuildLink(entitlementState.effectivePlan.planName)) {
    return (
      <div className="space-y-5">
        <Card className="dashboard-clean-card overflow-hidden border-[#cfddf5] bg-white p-0">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.85fr]">
            <div className="p-5 sm:p-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                <Lock className="h-3.5 w-3.5" />
                Build Link Locked
              </div>
              <h1 className="mt-4 font-display text-3xl font-semibold tracking-[-0.04em] text-[#142033] sm:text-4xl">
                Build Link tersedia untuk plan Creator dan Business.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#55709d] sm:text-base">
                Kamu tetap bisa upload video basic di plan Free. Upgrade ke Creator untuk membuka block editor, live preview, publish, dan QR share.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/payment?plan=creator&intent=checkout">
                  <Button>
                    <Sparkles className="h-4 w-4" />
                    Upgrade Creator
                  </Button>
                </Link>
                <Link href="/dashboard/videos/new">
                  <Button variant="secondary">
                    <UploadCloud className="h-4 w-4" />
                    Upload Video Basic
                  </Button>
                </Link>
              </div>
            </div>
            <div className="border-t border-[#dbe7f8] bg-[radial-gradient(circle_at_top_right,#dceaff,transparent_36%),linear-gradient(180deg,#f8fbff,#edf4ff)] p-5 sm:p-7 lg:border-l lg:border-t-0">
              <div className="rounded-[1.6rem] border border-[#cfe0ff] bg-white/90 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#2f73ff]">
                    <Wand2 className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#142033]">Yang terbuka setelah upgrade</p>
                    <p className="text-xs text-[#6078a2]">Block editor, drag/drop, preview, publish, QR share.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <LinkBuilderEditor
      user={user}
      linkBuilderMax={entitlementState.entitlements.linkBuilderMax}
      planName={entitlementState.effectivePlan.planName}
    />
  );
}
