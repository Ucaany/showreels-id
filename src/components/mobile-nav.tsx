"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Portal, PortalBackdrop } from "@/components/portal";
import { XIcon, MenuIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { AvatarBadge } from "@/components/avatar-badge";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlagIcon } from "@/components/landing-new/FlagIcon";
import { usePreferences } from "@/hooks/use-preferences";

function MobileLangSwitcher() {
	const { locale, setLocale } = usePreferences();
	const current = locale === "id" ? "ID" : "EN";

	return (
		<div className="flex items-center gap-2">
			{(["ID", "EN"] as const).map((code) => {
				const isActive = current === code;
				return (
					<button
						type="button"
						key={code}
						onClick={() => setLocale(code.toLowerCase() as "id" | "en")}
						className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition ${
							isActive
								? "border-blue-300 bg-blue-50 text-slate-900"
								: "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
						}`}
					>
						<FlagIcon code={code} className="h-[14px] w-[20px] rounded-[2px]" />
						{code}
					</button>
				);
			})}
		</div>
	);
}

export function MobileNav() {
	const [open, setOpen] = React.useState(false);
	const { data: session, status } = useSession();
	const isAuth = status === "authenticated" && !!session?.user;

	return (
		<div className="sm:hidden">
			<Button
				aria-controls="mobile-menu"
				aria-expanded={open}
				aria-label="Toggle menu"
				onClick={() => setOpen(!open)}
				size="icon"
				variant="outline"
				className="border-black"
			>
				{open ? (
					<XIcon className="size-4.5" />
				) : (
					<MenuIcon className="size-4.5" />
				)}
			</Button>
			{open && (
				<Portal className="top-[4.55rem]" id="mobile-menu">
					<PortalBackdrop />
					<div
						className={cn(
							"data-[slot=open]:zoom-in-97 ease-out data-[slot=open]:animate-in",
							"size-full p-4"
						)}
						data-slot={open ? "open" : "closed"}
					>
						<div className="mb-6 flex items-center justify-between">
							<span className="text-sm font-semibold text-slate-600">Bahasa</span>
							<MobileLangSwitcher />
						</div>
						<div className="flex flex-col gap-2">
							{isAuth ? (
								<Link
									href="/dashboard"
									className="flex items-center gap-2 rounded-xl border border-black bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
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
									<Button
										className="w-full border-black"
										variant="outline"
										render={<a href="/auth/login" />}
										nativeButton={false}
									>
										Masuk
									</Button>
									<Button
										className="w-full border border-black bg-black text-white hover:bg-slate-800"
										render={<a href="/auth/signup" />}
										nativeButton={false}
									>
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
