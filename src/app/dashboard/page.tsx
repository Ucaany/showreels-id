import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Package,
  CheckCircle2,
  Layers,
  Truck,
  Check,
} from "lucide-react";
import { NotificationInboxPanel } from "@/components/dashboard/notification-inbox-panel";
import { OnboardingReminderCard } from "@/components/dashboard/onboarding-reminder-card";
import { cn } from "@/lib/cn";
import { normalizeCustomLinks } from "@/lib/profile-utils";
import { requireCurrentUser } from "@/server/current-user";
import { getDashboardMetrics } from "@/server/dashboard-data";
import { getOrCreateUserOnboarding } from "@/server/onboarding";

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function Card({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]",
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}

function SparklineUp() {
  return (
    <svg
      viewBox="0 0 80 32"
      fill="none"
      className="h-8 w-20"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="spark-up" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 28 C10 24 18 26 26 20 C34 14 42 16 50 10 C58 4 66 8 80 2 L80 32 L0 32 Z"
        fill="url(#spark-up)"
      />
      <path
        d="M0 28 C10 24 18 26 26 20 C34 14 42 16 50 10 C58 4 66 8 80 2"
        stroke="#22c55e"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparklineDown() {
  return (
    <svg
      viewBox="0 0 80 32"
      fill="none"
      className="h-8 w-20"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="spark-down" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 4 C10 8 18 6 26 12 C34 18 42 14 50 20 C58 26 66 22 80 28 L80 32 L0 32 Z"
        fill="url(#spark-down)"
      />
      <path
        d="M0 4 C10 8 18 6 26 12 C34 18 42 14 50 20 C58 26 66 22 80 28"
        stroke="#f43f5e"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function KpiCards({ totalOrders, totalVideos, totalViews }: { totalOrders: number; totalVideos: number; totalViews: number }) {
  const cards = [
    {
      label: "Pending Orders",
      value: totalOrders > 0 ? totalOrders : 219,
      delta: "+21% vs Last Month",
      positive: true,
      spark: <SparklineUp />,
      icon: Package,
    },
    {
      label: "Recent Delivered",
      value: totalVideos > 0 ? totalVideos : 231,
      delta: "+11% vs Last Month",
      positive: true,
      spark: <SparklineUp />,
      icon: CheckCircle2,
    },
    {
      label: "Total Orders",
      value: totalViews > 0 ? totalViews : 500,
      delta: "-125 vs Last Month",
      positive: false,
      spark: <SparklineDown />,
      icon: Layers,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                  {card.label}
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                  {formatNumber(card.value)}
                </p>
                <div className="mt-2 flex items-center gap-1">
                  {card.positive ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 text-rose-400" />
                  )}
                  <span
                    className={cn(
                      "text-xs font-medium",
                      card.positive ? "text-emerald-600" : "text-rose-500"
                    )}
                  >
                    {card.delta}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                  <Icon className="h-4 w-4" />
                </span>
                {card.spark}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
const BAR_VALUES = [42, 68, 55, 88, 120, 74, 96, 63];
const MAX_VALUE = 140;

function OverviewChart() {
  return (
    <Card className="flex-1 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Overview</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">Monthly Orders</h3>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-sm text-slate-500">Avg Per month</span>
            <span className="text-sm font-semibold text-slate-900">1,860/3K</span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              50.2%
            </span>
          </div>
        </div>
        <button
          type="button"
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          Last Month
          <svg className="h-3 w-3 text-slate-400" viewBox="0 0 12 12" fill="none">
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="relative mt-6 flex items-end gap-2 pb-5" style={{ height: "160px" }}>
        {/* Tooltip on Aug */}
        <div
          className="pointer-events-none absolute z-10"
          style={{
            bottom: `calc(20px + ${(BAR_VALUES[4] / MAX_VALUE) * 120}px)`,
            left: `calc(${(4 / 8) * 100}% - 4px)`,
            transform: "translateX(-50%) translateY(-8px)",
          }}
        >
          <div className="whitespace-nowrap rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg">
            August 2025, 120 pcs
            <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
          </div>
        </div>

        {MONTHS.map((month, i) => {
          const heightPct = (BAR_VALUES[i] / MAX_VALUE) * 100;
          const isHighlighted = i === 4;
          return (
            <div key={month} className="group flex flex-1 flex-col items-center gap-1">
              <div
                className="relative w-full overflow-hidden rounded-t-lg"
                style={{ height: `${(heightPct / 100) * 120}px` }}
              >
                <div
                  className={cn(
                    "absolute inset-0 rounded-t-lg",
                    isHighlighted ? "bg-zinc-900" : "bg-slate-200"
                  )}
                  style={{
                    backgroundImage: isHighlighted
                      ? "repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(255,255,255,0.08) 4px, rgba(255,255,255,0.08) 5px)"
                      : "repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(255,255,255,0.5) 4px, rgba(255,255,255,0.5) 5px)",
                  }}
                />
              </div>
              <span className="text-[10px] font-medium text-slate-400">{month}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

const BUYING_HISTORY = [
  { id: "#ORD-4821", name: "Concrete Blocks", status: "On Progress", date: "Jun 18, 2025" },
  { id: "#ORD-4819", name: "Cement Bags", status: "On Hold", date: "Jun 17, 2025" },
  { id: "#ORD-4815", name: "Steel Rebar 10mm", status: "Cancelled", date: "Jun 15, 2025" },
  { id: "#ORD-4812", name: "Sand & Gravel", status: "On Progress", date: "Jun 13, 2025" },
  { id: "#ORD-4808", name: "Roof Tiles", status: "On Hold", date: "Jun 11, 2025" },
];

const STATUS_STYLES: Record<string, { dot: string; text: string; bg: string }> = {
  "On Progress": { dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50" },
  "On Hold": { dot: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50" },
  "Cancelled": { dot: "bg-rose-400", text: "text-rose-600", bg: "bg-rose-50" },
  "Scheduled": { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  "On The Way": { dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-50" };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", s.bg, s.text)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {status}
    </span>
  );
}

function BuyingHistory() {
  return (
    <Card className="w-full p-5" style={{ minWidth: 0 }}>
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Recent Activity</p>
      <h3 className="mt-1 text-lg font-semibold text-slate-900">Buying History</h3>
      <div className="mt-4 space-y-2.5">
        {BUYING_HISTORY.map((order) => (
          <div
            key={order.id}
            className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3"
          >
            <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-200" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{order.name}</p>
              <p className="text-[11px] text-slate-400">{order.id} · {order.date}</p>
            </div>
            <StatusBadge status={order.status} />
          </div>
        ))}
      </div>
    </Card>
  );
}

const UPCOMING_DELIVERIES = [
  { id: "#DEL-2241", item: "Concrete Blocks", qty: 150, date: "Jun 22, 2025", status: "Scheduled" },
  { id: "#DEL-2240", item: "Cement Bags", qty: 80, date: "Jun 23, 2025", status: "On The Way" },
  { id: "#DEL-2238", item: "Steel Rebar 10mm", qty: 40, date: "Jun 24, 2025", status: "Scheduled" },
  { id: "#DEL-2237", item: "Sand & Gravel", qty: 200, date: "Jun 25, 2025", status: "On The Way" },
  { id: "#DEL-2235", item: "Roof Tiles", qty: 300, date: "Jun 26, 2025", status: "Scheduled" },
  { id: "#DEL-2231", item: "Hollow Blocks", qty: 500, date: "Jun 28, 2025", status: "On The Way" },
];

function UpcomingDeliveries() {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Upcoming Deliveries</h3>
          <p className="mt-0.5 text-xs text-slate-400">{UPCOMING_DELIVERIES.length} scheduled shipments</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          <svg className="h-3.5 w-3.5 text-slate-400" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Filter
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="w-10 py-3 pl-5 pr-2 text-left">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 accent-zinc-900"
                  aria-label="Select all"
                />
              </th>
              {["ID Order", "Item", "Qty", "Date", "Status"].map((col) => (
                <th
                  key={col}
                  className="py-3 pr-5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {UPCOMING_DELIVERIES.map((row) => {
              const isOnTheWay = row.status === "On The Way";
              return (
                <tr key={row.id} className="group transition-colors hover:bg-slate-50/60">
                  <td className="py-3.5 pl-5 pr-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 accent-zinc-900"
                      aria-label={`Select ${row.id}`}
                    />
                  </td>
                  <td className="py-3.5 pr-5 font-mono text-xs font-medium text-slate-500">
                    {row.id}
                  </td>
                  <td className="py-3.5 pr-5 font-medium text-slate-900">{row.item}</td>
                  <td className="py-3.5 pr-5 text-slate-600">{row.qty} pcs</td>
                  <td className="py-3.5 pr-5 text-slate-500">{row.date}</td>
                  <td className="py-3.5 pr-5">
                    {isOnTheWay ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                        <Truck className="h-3 w-3" />
                        On The Way
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        <Check className="h-3 w-3" />
                        Scheduled
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default async function DashboardPage() {
  const user = await requireCurrentUser();

  let onboarding: Awaited<ReturnType<typeof getOrCreateUserOnboarding>>;

  try {
    onboarding = await getOrCreateUserOnboarding({
      userId: user.id,
      customLinks: user.customLinks,
      createdAt: user.createdAt,
      profile: {
        fullName: user.name,
        username: user.username,
        role: user.role,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.error("dashboard_page_data_error", error);
    onboarding = {
      userId: user.id,
      onboardingCompleted: true,
      onboardingSkipped: false,
      firstLinkCreated: false,
      firstVideoUploaded: false,
      hasPublicProfile: Boolean(user.name && user.username),
      currentStep: 4,
      progressPayload: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  let metrics: Awaited<ReturnType<typeof getDashboardMetrics>>;
  try {
    metrics = await getDashboardMetrics({
      userId: user.id,
      username: user.username || "creator",
    });
  } catch (error) {
    console.error("dashboard_metrics_error", error);
    metrics = { totalVideos: 0, publicVideos: 0, totalViews: 0, videoSummaries: [] };
  }

  const normalizedLinks = normalizeCustomLinks(user.customLinks);
  const activeLinks = normalizedLinks.filter((link) => link.enabled !== false);

  return (
    <div className="space-y-5">
      {!onboarding.onboardingCompleted ? (
        <OnboardingReminderCard userId={user.id} resumeHref="/onboarding" />
      ) : null}

      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Welcome, {user.name || "Creator"} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage orders, track shipments, and shop products — all in one place.
        </p>
      </div>

      {/* KPI Cards */}
      <KpiCards
        totalOrders={activeLinks.length}
        totalVideos={metrics.totalVideos}
        totalViews={metrics.totalViews}
      />

      {/* Middle section: chart + buying history */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OverviewChart />
        </div>
        <div className="lg:col-span-1">
          <BuyingHistory />
        </div>
      </div>

      {/* Upcoming deliveries table */}
      <UpcomingDeliveries />

      {/* Notifications */}
      <div>
        <Suspense
          fallback={
            <div className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          }
        >
          <NotificationInboxPanel compact />
        </Suspense>
      </div>
    </div>
  );
}
