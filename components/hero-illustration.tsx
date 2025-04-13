export function HeroIllustration() {
  return (
    <div className="relative w-full max-w-[500px] aspect-square">
      <div className="absolute inset-0 bg-gradient-to-r from-slate-100 to-slate-200 rounded-lg shadow-lg overflow-hidden">
        <div className="absolute top-4 left-4 right-4 h-8 bg-white rounded flex items-center px-3">
          <div className="w-3 h-3 rounded-full bg-red-400 mr-2"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
          <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
          <div className="flex-1"></div>
        </div>

        <div className="absolute top-16 left-4 right-4 bottom-4 bg-white rounded shadow-sm p-4">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded bg-slate-200 mr-3"></div>
            <div className="flex-1">
              <div className="h-4 bg-slate-100 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-slate-100 rounded w-1/2"></div>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-slate-100 rounded flex items-center justify-center text-xs text-slate-400"
              >
                {i + 1}
              </div>
            ))}
            {Array.from({ length: 28 }).map((_, i) => (
              <div key={i + 7} className="aspect-square bg-slate-50 rounded"></div>
            ))}
          </div>

          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center">
                <div className="w-4 h-4 rounded bg-slate-200 mr-3"></div>
                <div className="h-4 bg-slate-100 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
