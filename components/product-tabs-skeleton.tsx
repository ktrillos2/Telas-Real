export function ProductTabsSkeleton() {
    return (
        <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-light mb-4">Nuestros Productos</h2>
                    <p className="text-lg font-light text-muted-foreground">
                        Explora nuestras categorías de telas
                    </p>
                </div>
                <div className="flex justify-center py-12">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        </section>
    )
}
