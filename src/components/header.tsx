"use client";
import { cn } from "@/lib/utils";
import { useScroll } from "@/hooks/use-scroll";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/mobile-nav";
import { AppLogo } from "@/components/app-logo";
import { AvatarBadge } from "@/components/avatar-badge";
import { LanguageSwitcher } from "@/components/language-switcher";
import Link from "next/link";
import { useSession } from "next-auth/react";

export const navLinks: { label: string; href: string }[] = [];

export function Header() {
	const scrolled = useScroll(10);
	const { data: session, status } = useSession();
	const isAuth = status === "authenticated" && !!session?.user;

	return (
		<header
			className={cn(
				"fixed left-0 right-0 top-0 z-[70] w-full overflow-x-hidden border-b border-transparent transition-all ease-out",
				{
					"border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50":
						scrolled,
					"bg-white/92 backdrop-blur border-slate-200": !scrolled,
				}
			)}
		>
			<nav className="mx-auto flex h-[4.55rem] w-full max-w-[1160px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
				<AppLogo />

				<div className="flex items-center gap-2 sm:gap-3">
					<LanguageSwitcher />

					{isAuth ? (
						<Link
							href="/dashboard"
							className="inline-flex items-center gap-2 rounded-full border border-black bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
						>
							<AvatarBadge
								name={session.user?.name || "Creator"}
								avatarUrl={session.user?.image || ""}
								size="sm"
							/>
							<span className="hidden max-w-[120px] truncate sm:inline">
								{session.user?.name || "Dashboard"}
							</span>
						</Link>
					) : (
						<div className="flex items-center gap-2">
							<Link href="/auth/login">
								<Button
									size="sm"
									variant="outline"
									className="border-black text-black hover:bg-slate-50"
								>
									Masuk
								</Button>
							</Link>
							<Link href="/auth/signup">
								<Button
									size="sm"
									className="border border-black bg-black text-white hover:bg-slate-800"
								>
									Daftar Gratis
								</Button>
							</Link>
						</div>
					)}
				</div>
			</nav>
		</header>
	);
}
