import React from "react";

export function PageSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-6 w-48 bg-slate-200 rounded-lg"></div>
            <div className="h-5 w-24 bg-teal-100 rounded-full"></div>
          </div>
          <div className="h-4 w-72 bg-slate-200/70 rounded"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 bg-slate-200 rounded-lg"></div>
          <div className="h-9 w-32 bg-teal-200/80 rounded-lg"></div>
        </div>
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column (Queue / Sidebar Card) */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="h-4 w-28 bg-slate-200 rounded"></div>
              <div className="h-4 w-12 bg-slate-100 rounded"></div>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-12 bg-teal-100 rounded"></div>
                  <div className="h-3 w-14 bg-slate-200 rounded"></div>
                </div>
                <div className="h-4 w-32 bg-slate-200 rounded"></div>
                <div className="h-3 w-20 bg-slate-100 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (Hero Banner + Content Form) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Patient Banner */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-16 bg-teal-200 rounded-xl"></div>
                <div className="space-y-1.5">
                  <div className="h-5 w-40 bg-slate-200 rounded"></div>
                  <div className="h-3.5 w-56 bg-slate-100 rounded"></div>
                </div>
              </div>
              <div className="h-8 w-48 bg-rose-100/70 rounded-xl"></div>
            </div>

            {/* Vitals Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-slate-50 rounded-xl border border-slate-100"></div>
              ))}
            </div>
          </div>

          {/* Tab Strip */}
          <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-xl">
            <div className="h-8 w-28 bg-white rounded-lg shadow-2xs"></div>
            <div className="h-8 w-32 bg-slate-200/50 rounded-lg"></div>
            <div className="h-8 w-32 bg-slate-200/50 rounded-lg"></div>
          </div>

          {/* Form / Content Area */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-5 w-48 bg-slate-200 rounded"></div>
              <div className="h-7 w-28 bg-teal-100 rounded-lg"></div>
            </div>

            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-4 w-44 bg-slate-200 rounded"></div>
                  <div className="h-20 w-full bg-slate-50 rounded-xl border border-slate-200/70"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
