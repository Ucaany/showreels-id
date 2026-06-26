import { requireCurrentUser } from "@/server/current-user";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Settings2Icon, UserRoundIcon } from "lucide-react";

export default async function DashboardAccountPage() {
  const user = await requireCurrentUser();

  const initials = (user.name || "U")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Informasi akun dan pengaturan showreels.id kamu.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRoundIcon className="size-4 text-muted-foreground" />
              Informasi Akun
            </CardTitle>
            <CardDescription>Detail akun yang terdaftar.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-16 rounded-xl">
                <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                <AvatarFallback className="rounded-xl text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-semibold">{user.name || "Creator"}</p>
                <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                {user.username && (
                  <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
                )}
              </div>
            </div>

            <div className="divide-y rounded-lg border">
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-xs text-muted-foreground">Nama</span>
                <span className="text-sm font-medium">{user.name || "—"}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-xs text-muted-foreground">Email</span>
                <span className="text-sm font-medium">{user.email}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-xs text-muted-foreground">Username</span>
                <span className="text-sm font-medium">{user.username || "—"}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-xs text-muted-foreground">Role</span>
                <Badge variant="secondary" className="text-xs">{user.role || "creator"}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings2Icon className="size-4 text-muted-foreground" />
              Pengaturan Cepat
            </CardTitle>
            <CardDescription>Akses pengaturan akun kamu.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link
              href="/dashboard/profile"
              className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <UserRoundIcon className="size-4 shrink-0 text-muted-foreground" />
              Edit Profile
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Settings2Icon className="size-4 shrink-0 text-muted-foreground" />
              Settings
            </Link>
            <Link
              href="/dashboard/billing"
              className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Settings2Icon className="size-4 shrink-0 text-muted-foreground" />
              Billing & Langganan
            </Link>
            <Link
              href="/dashboard/settings/security"
              className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Settings2Icon className="size-4 shrink-0 text-muted-foreground" />
              Keamanan & Password
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
