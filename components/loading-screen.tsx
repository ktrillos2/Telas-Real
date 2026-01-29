
import { cn } from "@/lib/utils"

interface LoadingScreenProps extends React.HTMLAttributes<HTMLDivElement> { }

export function LoadingScreen({ className, ...props }: LoadingScreenProps) {
    return (
        <div className={cn("flex min-h-[50vh] flex-col items-center justify-center gap-4", className)} {...props}>
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground animate-pulse">Cargando...</p>
        </div>
    )
}
