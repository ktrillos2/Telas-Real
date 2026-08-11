import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { client } from "@/sanity/lib/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SignOutButton } from "@/components/sign-out-button";
import { ArrowLeft, TrendingUp, Package, AlertCircle, CheckCircle2, Target } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function MayoristaPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if ((session.user as any).forcePasswordChange) {
    redirect("/change-password");
  }

  const userId = (session.user as any).id;

  // Fetch User Details
  const userData = await client.fetch(`
       *[_type == "user" && _id == $userId][0]{
           name,
           email,
           role,
           wholesaleData
       }
   `, { userId }, { cache: 'no-store' }); // Ensure fresh data

  // Protect route
  if (userData?.role !== "mayorista" && userData?.role !== "admin") {
    redirect("/cuenta");
  }

  const data = userData?.wholesaleData;

  // Calculate Progress Percentages if target exists
  const targetKg = data?.volumen_mes_kg || 0;
  const currentKg = data?.brush_kg_cumplido || 0;
  const progressKgPercent = targetKg > 0 ? Math.min(100, Math.round((currentKg / targetKg) * 100)) : 0;

  const targetMt = data?.volumen_mes_mt || 0;
  const currentMt = data?.brush_mt_cumplido || 0;
  const progressMtPercent = targetMt > 0 ? Math.min(100, Math.round((currentMt / targetMt) * 100)) : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl min-h-[70vh]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <Button variant="ghost" className="mb-2 -ml-4" asChild>
            <Link href="/cuenta">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a mi cuenta
            </Link>
          </Button>
          <h1 className="text-3xl font-light">Panel Mayorista</h1>
          <p className="text-sm text-muted-foreground mt-1">Seguimiento de cuota mensual y acuerdo comercial</p>
        </div>
        <SignOutButton />
      </div>

      {!data ? (
        <Card className="border-0 shadow-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-light text-muted-foreground">
              Aún no hay información de progreso disponible en tu cuenta.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          
          {/* Mensaje Personalizado de Avance */}
          {data.mensaje_personalizado && (
            <Card className="border-0 shadow-md bg-zinc-900 text-white">
              <CardContent className="p-6 md:p-8">
                <p className="text-base md:text-lg font-light whitespace-pre-line leading-relaxed">
                  {data.mensaje_personalizado}
                </p>
              </CardContent>
            </Card>
          )}

          {/* TARJETAS DE PROGRESO DE CUOTA (BARRAS DE PROGRESO) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Progreso KG */}
            <Card className="border-0 shadow-sm border-t-4 border-t-blue-600">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    Avance Cuota Mensual (KG)
                  </CardTitle>
                  <span className="text-2xl font-bold text-blue-600">{progressKgPercent}%</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-3.5 rounded-full transition-all duration-500" 
                    style={{ width: `${progressKgPercent}%` }} 
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground pt-1">
                  <span>Comprado: <strong className="text-foreground">{currentKg} KG</strong></span>
                  <span>Meta: <strong className="text-foreground">{targetKg} KG</strong></span>
                </div>
              </CardContent>
            </Card>

            {/* Progreso Metros */}
            <Card className="border-0 shadow-sm border-t-4 border-t-emerald-600">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Target className="h-5 w-5 text-emerald-600" />
                    Avance Cuota Mensual (Metros)
                  </CardTitle>
                  <span className="text-2xl font-bold text-emerald-600">{progressMtPercent}%</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-3.5 rounded-full transition-all duration-500" 
                    style={{ width: `${progressMtPercent}%` }} 
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground pt-1">
                  <span>Comprado: <strong className="text-foreground">{currentMt} MT</strong></span>
                  <span>Meta: <strong className="text-foreground">{targetMt} MT</strong></span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* BANNER DE FALTANTE O META CUMPLIDA */}
          {data.cuanto_falto_kg <= 0 && data.cuanto_falto_mt <= 0 && targetKg > 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-6 py-4 rounded-xl flex items-center gap-3 shadow-sm">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="font-semibold">¡Felicidades! Has alcanzado tu cuota comercial de este mes 🎉</p>
                <p className="text-xs text-emerald-700">Mantienes las condiciones preferenciales del acuerdo comercial.</p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 px-6 py-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Pendiente para completar el acuerdo de este mes:</p>
                  <p className="text-xs text-amber-800">
                    Te faltan <strong className="underline">{data.cuanto_falto_kg || 0} KG</strong> ({data.cuanto_falto_mt || 0} metros) para superar la cuota mínima.
                  </p>
                </div>
              </div>
              {data.cuanto_falto_dinero && (
                <div className="bg-white/80 px-4 py-2 rounded-lg border border-amber-200 text-right w-full md:w-auto">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium block">Valor Faltante ($)</span>
                  <span className="text-lg font-bold text-red-600">{data.cuanto_falto_dinero}</span>
                </div>
              )}
            </div>
          )}

          {/* TABLA HISTÓRICA POR MESES (ESTILO EXCEL) */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-900 text-white">
              <CardTitle className="text-lg font-light flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                Histórico de Avance Mensual
              </CardTitle>
              <CardDescription className="text-slate-300 text-xs">
                Registro detallado de tus compras y saldos mes a mes
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-100 hover:bg-slate-100">
                      <TableHead className="font-bold text-slate-800">MES</TableHead>
                      <TableHead className="font-bold text-slate-800 text-right">KG Comprados</TableHead>
                      <TableHead className="font-bold text-slate-800 text-right">MT Comprados</TableHead>
                      <TableHead className="font-bold text-slate-800 text-right">Monto $ Comprado</TableHead>
                      <TableHead className="font-bold text-slate-800 text-right">Falta KG</TableHead>
                      <TableHead className="font-bold text-slate-800 text-right">Falta MT</TableHead>
                      <TableHead className="font-bold text-slate-800 text-right">Falta $</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.historial_meses && data.historial_meses.length > 0 ? (
                      data.historial_meses.map((m: any, idx: number) => (
                        <TableRow key={idx} className="hover:bg-slate-50">
                          <TableCell className="font-bold text-blue-700 uppercase">{m.mes}</TableCell>
                          <TableCell className="text-right font-medium">{m.kg ?? '-'}</TableCell>
                          <TableCell className="text-right font-medium">{m.mt ?? '-'}</TableCell>
                          <TableCell className="text-right font-semibold text-emerald-700">{m.cuanto_va_dinero || '-'}</TableCell>
                          <TableCell className="text-right text-slate-600">{m.falta_kg ?? '-'}</TableCell>
                          <TableCell className="text-right text-slate-600">{m.falta_mt ?? '-'}</TableCell>
                          <TableCell className="text-right text-red-600 font-medium">{m.falta_dinero || '-'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      /* Fallback con los datos actuales si no hay array de meses cargado */
                      <TableRow>
                        <TableCell className="font-bold text-blue-700">ACTUAL</TableCell>
                        <TableCell className="text-right font-medium">{data.brush_kg_cumplido || 0}</TableCell>
                        <TableCell className="text-right font-medium">{data.brush_mt_cumplido || 0}</TableCell>
                        <TableCell className="text-right font-semibold text-emerald-700">-</TableCell>
                        <TableCell className="text-right text-slate-600">{data.cuanto_falto_kg || 0}</TableCell>
                        <TableCell className="text-right text-slate-600">{data.cuanto_falto_mt || 0}</TableCell>
                        <TableCell className="text-right text-red-600 font-medium">{data.cuanto_falto_dinero || '-'}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* DETALLES DEL ACUERDO Y TARIFAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="border-0 shadow-sm border-l-4 border-l-blue-500">
              <CardContent className="p-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Compra Mínima KG</p>
                <p className="text-xl font-bold">{data.volumen_compra_kg ? `${data.volumen_compra_kg} KG` : "-"}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm border-l-4 border-l-blue-500">
              <CardContent className="p-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Acuerdo $ MT</p>
                <p className="text-xl font-bold">{data.acuerdo_mt || "-"}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm border-l-4 border-l-blue-500">
              <CardContent className="p-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Acuerdo $ KG</p>
                <p className="text-xl font-bold">{data.acuerdo_kg || "-"}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm border-l-4 border-l-emerald-500">
              <CardContent className="p-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Meta Mensual $</p>
                <p className="text-xl font-bold text-emerald-700">{data.acuerdo_kg_mes || "-"}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm border-l-4 border-l-purple-500">
              <CardContent className="p-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Tiempos de Pago</p>
                <p className="text-xs font-medium text-slate-700">{data.tiempos || "-"}</p>
              </CardContent>
            </Card>
          </div>

          {/* DATOS DE CONTACTO / CLIENTE */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Cliente:</p>
              <p className="font-semibold text-slate-900">{data.cliente || userData.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Encargado:</p>
              <p className="font-semibold text-slate-900">{data.encargado || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Cédula / NIT:</p>
              <p className="font-semibold text-slate-900">{data.cedula || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Condición de Facturación:</p>
              <p className="font-semibold text-slate-900">{data.facturacion || "-"}</p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
