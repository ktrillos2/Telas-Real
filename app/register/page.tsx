"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { LegalCheckboxes } from "@/components/legal-checkboxes";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [acceptPrivacy, setAcceptPrivacy] = useState(false);
    const [termsError, setTermsError] = useState(false);
    const [privacyError, setPrivacyError] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!acceptTerms) {
            setTermsError(true);
            toast.error("Debes aceptar los Términos y Condiciones para registrarte.");
            return;
        }
        setTermsError(false);

        if (!acceptPrivacy) {
            setPrivacyError(true);
            toast.error("Debes autorizar el tratamiento de tus datos personales.");
            return;
        }
        setPrivacyError(false);

        setLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Cuenta creada exitosamente. Inicia sesión.");
                router.push("/login");
            } else {
                toast.error(data.message || "Error al registrarse");
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/30 p-4">
            <Card className="w-full max-w-md shadow-md rounded-2xl border-border">
                <CardHeader>
                    <CardTitle className="text-2xl font-light">Crear Cuenta</CardTitle>
                    <CardDescription>Regístrate para ver tus compras y guardar favoritos en Telas Real</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre Completo</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Tu nombre y apellido"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="rounded-xl h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="rounded-xl h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="rounded-xl h-11"
                            />
                        </div>

                        {/* Checkboxes Legales: Términos y Condiciones + Tratamiento de Datos */}
                        <div className="pt-2">
                            <LegalCheckboxes
                                acceptTerms={acceptTerms}
                                onAcceptTermsChange={(val) => {
                                    setAcceptTerms(val);
                                    if (val) setTermsError(false);
                                }}
                                acceptPrivacy={acceptPrivacy}
                                onAcceptPrivacyChange={(val) => {
                                    setAcceptPrivacy(val);
                                    if (val) setPrivacyError(false);
                                }}
                                termsId="register-terms"
                                privacyId="register-privacy"
                                variant="compact"
                                errorTerms={termsError}
                                errorPrivacy={privacyError}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 pt-2">
                        <Button type="submit" className="w-full h-11 rounded-xl font-medium" disabled={loading}>
                            {loading ? "Registrando..." : "Registrarse"}
                        </Button>
                        <p className="text-sm text-center text-muted-foreground">
                            ¿Ya tienes cuenta?{" "}
                            <Link href="/login" className="text-primary hover:underline font-medium">
                                Inicia Sesión
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
