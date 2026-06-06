export default function AppLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-64 animate-pulse rounded-lg bg-stone-200" />
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-32 animate-pulse rounded-lg bg-stone-200" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-lg bg-stone-200" />
    </div>
  );
}
