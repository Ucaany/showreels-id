"use client";
import { cn } from "@/lib/utils";
import { useScroll } from "@/hooks/use-scroll";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/mobile-nav";
import { AppLogo } from "@/components/app-logo";
import { AvatarBadge } from "@/components/avatar-badge";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlagIcon } from "@/components/landing-new/FlagIcon";
import { usePreferences } from "@/hooks/use-preferences";

export const navLinks: { label: string; href: string }[] = [];

function LangSwitcher() {
	const { locale, setLocale } = usePreferences();
	const [open, setOpen] = useState(false);
	const current = locale === "id" ? "ID" : "EN";

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-label="Pilih bahasa"
				aria-expanded={open}
				className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50"
			>
				<FlagIcon code={current} className="h-[16px] w-[24px] rounded-[3px]" />
			</button>

			<AnimatePresence>
				{open && (
					<>
						<div
							className="fixed inset-0 z-40"
							onClick={() => setOpen(false)}
						/>
						<motion.div
							initial={{ opacity: 0, y: -6, scale: 0.96 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: -6, scale: 0.96 }}
							transition={{ duration: 0.18, ease: "easeOut" }}
							className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg"
						>
							{(["ID", "EN"] as const).map((code) => {
								const isActive = current === code;
								return (
									<button
										type="button"
										key={code}
										onClick={() => {
											setLocale(code.toLowerCase() as "id" | "en");
											setOpen(false);
										}}
										className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors ${
											isActive ? "bg-blue-50 text-slate-900" : "text-slate-600 hover:bg-blue-50/60"
										}`}
									>
										<FlagIcon code={code} className="h-[16px] w-[24px] shrink-0 rounded-[3px]" />
										<span className="flex-1 text-[13px] font-semibold">
											{code === "ID" ? "Bahasa Indonesia" : "English"}
										</span>
										{isActive && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
									</button>
								);
							})}
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</div>
	);
}

export function Header() {
	const scrolled = useScroll(10);
	const { data: session, status } = useSession();
	const isAuth = status === "authenticated" && !!session?.user;

	return (
		<header
			className={cn(
				"fixed left-0 right-0 top-0 z-[70] w-full overflow-x-hidden border-b border-transparent transition-all ease-out",
				{
					"border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50": scrolled,
					"bg-white/92 backdrop-blur border-slate-200": !scrolled,
				}
			)}
		>
			<nav className="mx-auto flex h-[4.55rem] w-full max-w-[1160px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
				<AppLogo />

				<div className="flex items-center gap-2 sm:gap-3">
					<LangSwitcher />

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
								<Button size="sm" variant="outline" className="border-black text-black hover:bg-slate-50">
									Masuk
								</Button>
							</Link>
							<Link href="/auth/signup">
								<Button size="sm" className="border border-black bg-black text-white hover:bg-slate-800">
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
