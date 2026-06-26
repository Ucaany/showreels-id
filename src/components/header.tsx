"use client";
import { cn } from "@/lib/utils";
import { useScroll } from "@/hooks/use-scroll";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/mobile-nav";
import { AppLogo } from "@/components/app-logo";
import Link from "next/link";

export const navLinks = [
	{
		label: "Fitur",
		href: "#features",
	},
	{
		label: "Harga",
		href: "#pricing",
	},
	{
		label: "FAQ",
		href: "#faq",
	},
];

export function Header() {
	const scrolled = useScroll(10);

	return (
		<header
			className={cn("fixed left-0 right-0 top-0 z-[70] w-full border-transparent border-b overflow-x-hidden", {
				"border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50":
					scrolled,
				"bg-white/92 backdrop-blur border-slate-200": !scrolled,
			})}
		>
			<nav className="mx-auto flex h-[4.55rem] w-full max-w-[1160px] items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
				<AppLogo />
				<div className="hidden items-center gap-2 md:flex">
					{navLinks.map((link) => (
						<Button key={link.label} size="sm" variant="ghost" render={<a href={link.href} />} nativeButton={false}>{link.label}</Button>
					))}
					<Link href="/auth/login">
						<Button size="sm" variant="outline">
							Masuk
						</Button>
					</Link>
					<Link href="/auth/signup">
						<Button size="sm">Daftar Gratis</Button>
					</Link>
				</div>
				<MobileNav />
			</nav>
		</header>
	);
}
