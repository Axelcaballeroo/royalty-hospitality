export default function PublicSiteLoading() {
  return (
    <div className="min-h-screen bg-stone-50 p-5">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="h-[70vh] animate-pulse rounded-lg bg-stone-200" />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-32 animate-pulse rounded-lg bg-stone-200" />
          ))}
        </div>
      </div>
    </div>
  );
}
