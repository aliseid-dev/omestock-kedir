import React from 'react'

export function AppSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased flex flex-col lg:flex-row select-none">
      {/* ─── Desktop Left Navigation Sidebar Skeleton (lg+ screens) ─── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 xl:w-72 lg:fixed lg:inset-y-0 lg:z-40 bg-white border-r border-slate-200">
        {/* Brand & Organization Header */}
        <div className="p-5 border-b border-slate-100 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0">
              O
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="h-4 w-28 bg-slate-200 rounded-md animate-pulse" />
              <div className="h-2.5 w-20 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>

          {/* Org Switcher Box Placeholder */}
          <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-100/70 border border-emerald-200/60 shrink-0 animate-pulse" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="h-3.5 w-24 bg-slate-200 rounded animate-pulse" />
                <div className="h-2.5 w-16 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
            <div className="w-4 h-4 bg-slate-200 rounded shrink-0 animate-pulse" />
          </div>
        </div>

        {/* Navigation Item Placeholders */}
        <nav className="flex-1 px-4 py-4 space-y-1.5">
          {[
            { width: 'w-16', active: true },
            { width: 'w-20', active: false },
            { width: 'w-24', active: false },
            { width: 'w-20', active: false },
            { width: 'w-16', active: false },
            { width: 'w-20', active: false },
            { width: 'w-24', active: false },
            { width: 'w-20', active: false },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl ${
                item.active ? 'bg-slate-900 text-white shadow-xs' : 'bg-transparent'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-md ${
                  item.active ? 'bg-slate-700' : 'bg-slate-200'
                } animate-pulse shrink-0`}
              />
              <div
                className={`h-3 ${item.width} rounded ${
                  item.active ? 'bg-slate-700' : 'bg-slate-200'
                } animate-pulse`}
              />
            </div>
          ))}
        </nav>

        {/* User Profile Card Placeholder */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 space-y-3">
          <div className="flex items-center gap-3 p-2">
            <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
              <div className="h-2.5 w-32 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="pt-1 border-t border-slate-200/60">
            <div className="h-8 w-full rounded-xl bg-slate-100 border border-slate-200/80 animate-pulse" />
          </div>
        </div>
      </aside>

      {/* ─── Main Content Container (Padded on desktop for sidebar) ─── */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 xl:pl-72">
        {/* Mobile Top Header Skeleton */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
          <div className="px-3.5 h-14 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-base shadow-xs shrink-0">
                O
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="h-3.5 w-24 bg-slate-200 rounded animate-pulse" />
                <div className="h-2.5 w-16 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 animate-pulse shrink-0" />
              <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse shrink-0" />
            </div>
          </div>
        </header>

        {/* Main Content Workspace (Mimics POS / Inventory View) */}
        <main className="flex-1 p-3.5 sm:p-5 lg:p-6 space-y-4 max-w-7xl w-full mx-auto animate-in fade-in duration-150">
          {/* Top Search & Filter Bar */}
          <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2">
              {/* Search bar shimmer */}
              <div className="h-11 flex-1 bg-slate-100 rounded-xl border border-slate-200/80 animate-pulse" />
              {/* Category filter button shimmer */}
              <div className="h-11 w-11 sm:w-28 bg-slate-100 rounded-xl border border-slate-200/80 animate-pulse shrink-0" />
              {/* Stock check button shimmer */}
              <div className="h-11 w-16 sm:w-36 bg-slate-100 rounded-xl border border-slate-200/80 animate-pulse shrink-0" />
            </div>
          </div>

          {/* Catalog & Checkout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 7 Cols: Product Cards Catalog */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="h-3.5 w-36 bg-slate-200 rounded animate-pulse" />
                <div className="h-3 w-16 bg-slate-100 rounded animate-pulse" />
              </div>

              {/* Product Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-slate-200 p-3 flex flex-col justify-between h-40 shadow-2xs space-y-2"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <div className="h-4 w-12 bg-slate-100 rounded font-mono animate-pulse" />
                        <div className="h-4 w-10 bg-emerald-50 rounded-full animate-pulse" />
                      </div>
                      <div className="h-4 w-5/6 bg-slate-200 rounded animate-pulse" />
                      <div className="h-3 w-2/3 bg-slate-100 rounded animate-pulse" />
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="h-2 w-8 bg-slate-100 rounded animate-pulse" />
                        <div className="h-4 w-16 bg-slate-200 rounded animate-pulse" />
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-slate-900/10 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 5 Cols: Checkout / Cart Drawer Placeholder (lg+ screens) */}
            <div className="hidden lg:block lg:col-span-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-2xs sticky top-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
                  <div className="h-3.5 w-16 bg-slate-100 rounded animate-pulse" />
                </div>

                {/* Customer input row shimmer */}
                <div className="h-10 w-full bg-slate-100 rounded-xl border border-slate-200/80 animate-pulse" />

                {/* Cart Items Placeholder */}
                <div className="space-y-2.5 py-1">
                  {[1, 2, 3].map((row) => (
                    <div
                      key={row}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="h-3.5 w-3/4 bg-slate-200 rounded animate-pulse" />
                        <div className="h-2.5 w-1/2 bg-slate-100 rounded animate-pulse" />
                      </div>
                      <div className="h-4 w-14 bg-slate-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>

                {/* Payment Buttons Shimmer */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="h-10 rounded-xl bg-slate-900/10 animate-pulse" />
                  <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
                  <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
                </div>

                {/* Total & Checkout Button */}
                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="h-3.5 w-12 bg-slate-100 rounded animate-pulse" />
                    <div className="h-5 w-24 bg-slate-200 rounded animate-pulse" />
                  </div>
                  <div className="h-12 w-full rounded-xl bg-emerald-600/30 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
export default AppSkeleton
