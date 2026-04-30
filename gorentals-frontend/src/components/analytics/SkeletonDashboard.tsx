export function SkeletonDashboard() {
  return (
    <div className="space-y-8 animate-pulse p-6">
      <div className="h-8 w-48 bg-slate-800 rounded-lg"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-slate-900 border border-slate-800 rounded-2xl"></div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[400px] bg-slate-900 border border-slate-800 rounded-2xl"></div>
        <div className="h-[400px] bg-slate-900 border border-slate-800 rounded-2xl"></div>
      </div>
    </div>
  );
}
