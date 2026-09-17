export function ProductTabsSkeleton() {
    return (
        <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <div className="h-9 w-64 bg-muted/60 rounded-lg mx-auto mb-4 animate-pulse" />
                    <div className="h-5 w-80 bg-muted/40 rounded-lg mx-auto animate-pulse" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {[1, 2, 3, 4].map((n) => (
                        <div key={n} className="rounded-xl border border-border/50 bg-card p-3 space-y-3 animate-pulse">
                            <div className="aspect-square w-full rounded-lg bg-muted/40" />
                            <div className="h-4 w-3/4 rounded bg-muted/50" />
                            <div className="h-4 w-1/2 rounded bg-muted/40" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
