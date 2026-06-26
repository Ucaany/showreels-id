"use client";
import { cn } from "@/lib/utils";
import { useScroll } from "@/hooks/use-scroll";
import { MobileNav } from "@/components/mobile-nav";
import { useSession } from "next-auth/react";
import { AvatarBadge } from "@/components/avatar-badge";
import LanguageSwitch from "@/components/landing-new/LanguageSwitch";
import { useLang } from "@/lib/i18n/landing-context";
import Link from "next/link";
import Image from "next/image";

export const navLinks = [
	{
		label: "Beranda",
		labelEN: "Home",
		href: "#home",
	},
	{
		label: "Fitur",
		labelEN: "Features",
		href: "#fitur",
	},
	{
		label: "Harga",
		labelEN: "Pricing",
		href: "#harga",
	},
];

export function Header() {
	const scrolled = useScroll(10);
	const { lang } = useLang();
	const { data: session, status } = useSession();
	const isAuth = status === "authenticated" && !!session?.user;

	return (
		<header
			className={cn(
				"fixed inset-x-0 z-50 mx-auto w-full border-b border-transparent md:rounded-xl md:border md:transition-all md:duration-500 md:ease-out",
				scrolled
					? "top-0 md:top-3 border-border/60 bg-white/85 shadow-sm backdrop-blur-xl md:max-w-5xl"
					: "top-0 md:top-4 bg-transparent md:max-w-7xl"
			)}
		>
			<nav className="mx-auto flex h-12 w-full items-center justify-between px-5 sm:px-8 lg:px-10">
			
				{/* Logo */}
				<Link
					href="/"
					aria-label="showreels.id home"
					className="inline-flex items-center gap-2.5"
				>
					<Image
						src="/logo.png"
						alt="showreels.id"
						width={30}
						height={30}
						className="h-[30px] w-[30px] rounded-lg object-contain"
						unoptimized
					/>
					<span className="text-[0.95rem] font-semibold text-slate-900">
						showreels.id
					</span>
				</Link>

				{/* Desktop nav — center */}
				<div className="hidden items-center gap-1 md:flex">
					{navLinks.map((link) => (
						<a
							key={link.label}
							href={link.href}
							className="rounded-full px-3.5 py-1.5 text-[13.5px] font-medium text-slate-600 transition-colors hover:text-slate-900 hover:bg-slate-100/60"
						>
							{lang === "EN" ? link.labelEN : link.label}
						</a>
					))}
				</div>

				{/* Right side */}
				<div className="hidden items-center gap-3 md:flex">
					<LanguageSwitch />
					{isAuth ? (
						<Link
							href="/dashboard"
							aria-label="Buka dashboard"
							className="inline-flex items-center rounded-full transition-opacity hover:opacity-80"
						>
							<AvatarBadge
								name={session?.user?.name || "Creator"}
								avatarUrl={session?.user?.image || undefined}
								size="sm"
							/>
						</Link>
					) : (
						<Link
							href="/auth/login"
							className="inline-flex h-8 items-center rounded-full border border-slate-900 bg-transparent px-4 text-[13px] font-medium text-slate-900 transition-colors hover:bg-slate-50"
						>
							{lang === "EN" ? "Get Started" : "Mulai Sekarang"}
						</Link>
					)}
				</div>

				<MobileNav />
			</nav>
		</header>
	);
}
