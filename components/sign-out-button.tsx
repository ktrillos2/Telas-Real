
"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function SignOutButton() {
    return (
        <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-muted-foreground hover:text-destructive"
        >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
        </Button>
    );
}
