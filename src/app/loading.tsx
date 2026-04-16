export default function Loading() {
  return (
    <div className="min-h-screen p-4 lg:p-6">
      {/* Hero skeleton */}
      <div className="rounded-xl bg-[#1c2033] h-48 mb-6 shimmer" />

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-[#1c2033] h-36 shimmer" />
        ))}
      </div>

      {/* Row skeleton */}
      <div className="flex gap-3 overflow-hidden mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="min-w-[220px] rounded-xl bg-[#1c2033] h-28 shimmer"
          />
        ))}
      </div>
    </div>
  );
}
