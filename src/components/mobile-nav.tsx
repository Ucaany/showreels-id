"use client";
import { cn } from "@/lib/utils";
import React from "react";
import { Portal, PortalBackdrop } from "@/components/portal";
import { navLinks } from "@/components/header";
import { XIcon, MenuIcon } from "lucide-react";
import { useLang } from "@/lib/i18n/landing-context";
import LanguageSwitch from "@/components/landing-new/LanguageSwitch";
import { useSession } from "next-auth/react";
import Link from "next/link";

export function MobileNav() {
	const [open, setOpen] = React.useState(false);
	const { lang } = useLang();
	const { data: session, status } = useSession();
	const isAuth = status === "authenticated" && !!session?.user;

	return (
		<div className="md:hidden">
			{/* Hamburger — only visible when menu is closed */}
			{!open && (
				<button
					aria-label="Open menu"
					className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-800 shadow-sm transition-colors hover:bg-slate-100"
					onClick={() => setOpen(true)}
				>
					<MenuIcon className="size-4.5" />
				</button>
			)}

			{open && (
				<Portal id="mobile-menu">
					<PortalBackdrop />
					{/* Close button pinned top-right inside portal */}
					<button
						aria-label="Close menu"
						className="absolute right-5 top-4 z-10 inline-flex size-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-800 shadow-sm transition-colors hover:bg-slate-100 sm:right-8"
						onClick={() => setOpen(false)}
					>
						<XIcon className="size-4.5" />
					</button>

					<div
						className={cn(
							"data-[slot=open]:zoom-in-97 ease-out data-[slot=open]:animate-in",
							"size-full px-5 pt-16"
						)}
						data-slot="open"
					>
						<div className="grid gap-y-1">
							{navLinks.map((link) => (
								<a
									key={link.label}
									href={link.href}
									onClick={() => setOpen(false)}
									className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
								>
									{lang === "EN" ? link.labelEN : link.label}
								</a>
							))}
						</div>
						<div className="mt-6 flex items-center justify-center">
							<LanguageSwitch />
						</div>
						<div className="mt-4">
							{isAuth ? (
								<Link
									href="/dashboard"
									onClick={() => setOpen(false)}
									className="flex w-full items-center justify-center rounded-full border border-slate-900 bg-transparent py-2.5 text-[14px] font-medium text-slate-900 transition-colors hover:bg-slate-50"
								>
									Dashboard
								</Link>
							) : (
								<Link
									href="/auth/login"
									onClick={() => setOpen(false)}
									className="flex w-full items-center justify-center rounded-full border border-slate-900 bg-transparent py-2.5 text-[14px] font-medium text-slate-900 transition-colors hover:bg-slate-50"
								>
									{lang === "EN" ? "Get Started" : "Mulai Sekarang"}
								</Link>
							)}
						</div>
					</div>
				</Portal>
			)}
		</div>
	);
}
