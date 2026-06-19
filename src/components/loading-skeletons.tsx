import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Hero Card */}
        <div className="lg:col-span-2">
          <Skeleton height={200} borderRadius={16} />
        </div>
        
        {/* Quick Links */}
        <div>
          <Skeleton height={200} borderRadius={16} />
        </div>
        
        {/* Metrics */}
        <div className="lg:col-span-2">
          <Skeleton height={250} borderRadius={16} />
        </div>
        
        {/* Quick Actions */}
        <div>
          <Skeleton height={250} borderRadius={16} />
        </div>
        <div>
          <Skeleton height={250} borderRadius={16} />
        </div>
        <div>
          <Skeleton height={250} borderRadius={16} />
        </div>
      </div>
    </div>
  )
}

export function VideoListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-xl border border-slate-200 p-4">
          <div className="flex gap-4">
            <Skeleton width={120} height={80} borderRadius={8} />
            <div className="flex-1">
              <Skeleton width="60%" height={24} />
              <Skeleton width="40%" height={16} className="mt-2" />
              <Skeleton width="30%" height={16} className="mt-2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton circle width={80} height={80} />
        <div className="flex-1">
          <Skeleton width="40%" height={24} />
          <Skeleton width="60%" height={16} className="mt-2" />
        </div>
      </div>
      <Skeleton height={200} borderRadius={12} />
      <Skeleton height={150} borderRadius={12} />
    </div>
  )
}

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={120} borderRadius={12} />
        ))}
      </div>
      <Skeleton height={300} borderRadius={12} />
      <Skeleton height={200} borderRadius={12} />
    </div>
  )
}

export function BillingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton height={150} borderRadius={12} />
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <Skeleton key={i} height={200} borderRadius={12} />
        ))}
      </div>
      <Skeleton height={250} borderRadius={12} />
    </div>
  )
}
