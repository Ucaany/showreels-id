'use client'

import Link from 'next/link'
import {
  BarChart3,
  CreditCard,
  Lock,
  MousePointerClick,
  Plus,
  Sparkles,
  UploadCloud,
  Video,
  Wand2,
} from 'lucide-react'
import { PrefetchLink } from '@/components/prefetch-link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { useProfile, useVideos, useDashboardSummary } from '@/hooks/use-dashboard-data'
import { CACHE_KEYS } from '@/lib/swr-config'

type QuickAction = {
  href: string
  title: string
  description: string
  cta: string
  icon: typeof Wand2
  locked?: boolean
  prefetchData?: string | string[]
}

type MetricCard = {
  label: string
  value: number
  helper: string
  icon: typeof Wand2
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('id-ID').format(value)
}

function BentoCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm md:p-6',
        className
      )}
    >
      {children}
    </section>
  )
}

function HeroCard({
  userName,
  canUseBuildLink,
}: {
  userName: string | null
  canUseBuildLink: boolean
}) {
  return (
    <BentoCard className="overflow-hidden lg:col-span-2">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            <Sparkles className="h-3.5 w-3.5" />
            Dashboard Creator
          </div>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            Selamat datang, {userName || 'Kreator'}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
            Kelola profil, link bio, portfolio video, dan analytics dalam satu dashboard.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <PrefetchLink 
            href={canUseBuildLink ? '/dashboard/link-builder' : '/dashboard/billing'}
            prefetchData={canUseBuildLink ? [CACHE_KEYS.LINKS, CACHE_KEYS.LINK_TYPES] : CACHE_KEYS.BILLING_PLAN}
          >
            <Button className="inline-flex h-10 items-center gap-2 rounded-xl bg-zinc-800 px-3.5 text-sm font-medium text-white hover:bg-zinc-700">
              {canUseBuildLink ? <Wand2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              {canUseBuildLink ? 'Buat Bio' : 'Unlock Build Link'}
            </Button>
          </PrefetchLink>
        </div>
      </div>
    </BentoCard>
  )
}

function MetricsGrid({ metrics }: { metrics: MetricCard[] }) {
  return (
    <BentoCard className="lg:col-span-2">
      <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
        Ringkasan Aktivitas
      </h3>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon
          return (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4"
            >
              <div className="rounded-lg bg-white p-2 shadow-sm">
                <Icon className="h-5 w-5 text-slate-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500">{metric.label}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {formatNumber(metric.value)}
                </p>
                <p className="mt-1 text-xs text-slate-400">{metric.helper}</p>
              </div>
            </div>
          )
        })}
      </div>
    </BentoCard>
  )
}

function QuickActionsGrid({ actions }: { actions: QuickAction[] }) {
  return (
    <>
      {actions.map((action, idx) => {
        const Icon = action.icon
        return (
          <BentoCard key={idx}>
            <div className="flex h-full flex-col">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                <Icon className="h-6 w-6 text-slate-700" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{action.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">
                {action.description}
              </p>
              <div className="mt-4">
                <PrefetchLink
                  href={action.href}
                  prefetchData={action.prefetchData}
                  disablePrefetch={action.locked}
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    className="inline-flex items-center gap-2"
                  >
                    {action.locked && <Lock className="h-3.5 w-3.5" />}
                    {action.cta}
                  </Button>
                </PrefetchLink>
              </div>
            </div>
          </BentoCard>
        )
      })}
    </>
  )
}

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-48 animate-pulse rounded-2xl bg-slate-200 lg:col-span-2" />
        <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200 lg:col-span-2" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    </div>
  )
}

function ErrorState({ error }: { error: Error }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-medium text-red-900">Error loading dashboard</p>
        <p className="mt-2 text-sm text-red-700">{error.message}</p>
      </div>
    </div>
  )
}

/**
 * Dashboard Client Component dengan SWR
 * Menggunakan client-side data fetching dengan cache dan prefetching
 */
export function DashboardClient({ canUseBuildLink }: { canUseBuildLink: boolean }) {
  // Fetch data dengan SWR hooks
  const { data: profile, error: profileError, isLoading: profileLoading } = useProfile()
  const { data: videos, error: videosError, isLoading: videosLoading } = useVideos()
  const { data: summary, error: summaryError, isLoading: summaryLoading } = useDashboardSummary()

  // Loading state
  if (profileLoading || videosLoading || summaryLoading) {
    return <LoadingSkeleton />
  }

  // Error state
  const error = profileError || videosError || summaryError
  if (error) {
    return <ErrorState error={error} />
  }

  // Prepare metrics
  const metrics: MetricCard[] = [
    {
      label: 'Total Video',
      value: videos?.length || 0,
      helper: 'Video yang sudah diupload',
      icon: Video,
    },
    {
      label: 'Total Views',
      value: summary?.totalViews || 0,
      helper: '7 hari terakhir',
      icon: BarChart3,
    },
    {
      label: 'Total Clicks',
      value: summary?.totalClicks || 0,
      helper: '7 hari terakhir',
      icon: MousePointerClick,
    },
  ]

  // Prepare quick actions
  const quickActions: QuickAction[] = [
    {
      href: '/dashboard/videos/new',
      title: 'Upload Video Baru',
      description: 'Tambahkan video portfolio terbaru ke koleksi Anda',
      cta: 'Upload Video',
      icon: UploadCloud,
      prefetchData: CACHE_KEYS.VIDEOS,
    },
    {
      href: '/dashboard/analytics',
      title: 'Lihat Analytics',
      description: 'Pantau performa video dan traffic profil Anda',
      cta: 'Buka Analytics',
      icon: BarChart3,
      prefetchData: [
        CACHE_KEYS.ANALYTICS_SUMMARY('7d'),
        CACHE_KEYS.ANALYTICS_TRAFFIC('7d'),
      ],
    },
    {
      href: '/dashboard/billing',
      title: 'Kelola Billing',
      description: 'Upgrade plan atau lihat riwayat transaksi',
      cta: 'Buka Billing',
      icon: CreditCard,
      prefetchData: [CACHE_KEYS.BILLING_PLAN, CACHE_KEYS.BILLING_TRANSACTIONS],
    },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-3">
        <HeroCard userName={profile?.name || null} canUseBuildLink={canUseBuildLink} />
        <BentoCard>
          <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
            Quick Link
          </h3>
          <div className="mt-6 space-y-3">
            <PrefetchLink 
              href="/dashboard/profile"
              prefetchData={CACHE_KEYS.PROFILE}
              className="block rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit Profil
            </PrefetchLink>
            <PrefetchLink 
              href="/dashboard/videos"
              prefetchData={CACHE_KEYS.VIDEOS}
              className="block rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Kelola Video
            </PrefetchLink>
            <PrefetchLink 
              href="/dashboard/settings"
              className="block rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Pengaturan
            </PrefetchLink>
          </div>
        </BentoCard>
        <MetricsGrid metrics={metrics} />
        <QuickActionsGrid actions={quickActions} />
      </div>
    </div>
  )
}
