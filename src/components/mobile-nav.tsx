import { cn } from "@/lib/utils";
import React from "react";
import { Button } from "@/components/ui/button";
import { Portal, PortalBackdrop } from "@/components/portal";
import { navLinks } from "@/components/header";
import { XIcon, MenuIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { AvatarBadge } from "@/components/avatar-badge";
import { LanguageSwitcher } from "@/components/language-switcher";
import Link from "next/link";

export function MobileNav() {
	const [open, setOpen] = React.useState(false);
	const { data: session, status } = useSession();
	const isAuth = status === "authenticated" && !!session?.user;

	return (
		<div className="md:hidden">
			<Button
				aria-controls="mobile-menu"
				aria-expanded={open}
				aria-label="Toggle menu"
				className="md:hidden"
				onClick={() => setOpen(!open)}
				size="icon"
				variant="outline"
			>
				{open ? (
					<XIcon className="size-4.5" />
				) : (
					<MenuIcon className="size-4.5" />
				)}
			</Button>
			{open && (
				<Portal className="top-14" id="mobile-menu">
					<PortalBackdrop />
					<div
						className={cn(
							"data-[slot=open]:zoom-in-97 ease-out data-[slot=open]:animate-in",
							"size-full p-4"
						)}
						data-slot={open ? "open" : "closed"}
					>
						<div className="grid gap-y-2">
							{navLinks.map((link) => (
								<Button className="justify-start" key={link.label} variant="ghost" render={<a href={link.href} />} nativeButton={false}>{link.label}</Button>
							))}
						</div>
						<div className="mt-6">
							<LanguageSwitcher />
						</div>
						<div className="mt-6 flex flex-col gap-2">
							{isAuth ? (
								<Link
									href="/dashboard"
									className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
									onClick={() => setOpen(false)}
								>
									<AvatarBadge
										name={session.user?.name || "Creator"}
										avatarUrl={session.user?.image || ""}
										size="sm"
									/>
									<span className="truncate">{session.user?.name || "Dashboard"}</span>
								</Link>
							) : (
								<>
									<Button className="w-full" variant="outline" render={<a href="/auth/login" />} nativeButton={false}>
										Masuk
									</Button>
									<Button className="w-full" render={<a href="/auth/signup" />} nativeButton={false}>
										Daftar Gratis
									</Button>
								</>
							)}
						</div>
					</div>
				</Portal>
			)}
		</div>
	);
}
