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

  // Fetch User Details and linked wholesale company
  const userData = await client.fetch(`
       *[_type == "user" && _id == $userId][0]{
           name,
           email,
           role,
           wholesaleData,
           clienteMayorista->{
             _id,
             nombre,
             codigoCliente,
             nit,
             telefono,
             direccion,
             ciudad,
             objetivoMensual,
             acuerdoPrecio,
             meses
           }
       }
   `, { userId }, { cache: 'no-store' }); // Fresh data

  // Protect route
  if (userData?.role !== "mayorista" && userData?.role !== "admin") {
    redirect("/cuenta");
  }

  const empresa = userData?.clienteMayorista;
  const legacyData = userData?.wholesaleData;
  const hasData = Boolean(empresa || legacyData);

  const mesesList = Array.isArray(empresa?.meses) && empresa.meses.length > 0 
    ? empresa.meses 
    : (legacyData?.historial_meses || []);

  const currentMonthName = new Date().toLocaleString('es-ES', { month: 'long' }).toUpperCase();
  const activeMonth = empresa
    ? (empresa.meses?.find((m: any) => m.mes === currentMonthName) || (empresa.meses?.length ? empresa.meses[empresa.meses.length - 1] : null))
    : null;

  // Calculate Progress Percentages if target exists
  const targetKg = empresa?.objetivoMensual?.kg || legacyData?.volumen_mes_kg || 0;
  const currentKg = activeMonth?.kgCumplido ?? legacyData?.brush_kg_cumplido ?? 0;
  const progressKgPercent = targetKg > 0 ? Math.min(100, Math.round((currentKg / targetKg) * 100)) : 0;

  const targetMt = empresa?.objetivoMensual?.mt || legacyData?.volumen_mes_mt || (targetKg > 0 ? Math.round(targetKg * 3.3 * 100) / 100 : 0);
  const currentMt = activeMonth?.mtCumplido ?? legacyData?.brush_mt_cumplido ?? 0;
  const progressMtPercent = targetMt > 0 ? Math.min(100, Math.round((currentMt / targetMt) * 100)) : 0;

  const faltanteKg = activeMonth?.faltanteKg ?? legacyData?.cuanto_falto_kg ?? Math.max(0, targetKg - currentKg);
  const faltanteMt = activeMonth?.faltanteMt ?? legacyData?.cuanto_falto_mt ?? Math.max(0, targetMt - currentMt);
  const faltanteDinero = activeMonth?.faltanteDinero 
    ? `$${Number(activeMonth.faltanteDinero).toLocaleString('es-CO')}` 
    : legacyData?.cuanto_falto_dinero;
  const cumplimiento = activeMonth?.cumplimiento || (currentKg >= targetKg && targetKg > 0 ? 'SI' : 'NO');

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl min-h-[70vh]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          {userData?.role === "admin" && (
            <Button variant="ghost" className="mb-2 -ml-4" asChild>
              <Link href="/cuenta">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a mi cuenta
              </Link>
            </Button>
          )}
          <h1 className="text-3xl font-light">Panel Mayorista</h1>
          <p className="text-sm text-muted-foreground mt-1">Seguimiento de cuota mensual y acuerdo comercial</p>
        </div>
        <SignOutButton />
      </div>

      {!hasData ? (
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
          
          {/* Tarjeta de bienvenida / encabezado del cliente */}
          <Card className="border-0 shadow-md bg-zinc-900 text-white">
            <CardContent className="p-6 md:p-8">
              <p className="text-base md:text-lg font-light whitespace-pre-line leading-relaxed">
                {empresa 
                  ? `Bienvenido al portal oficial de mayoristas de ${empresa.nombre}. Consulta a continuación el cumplimiento y consumo mensual de tela en tiempo real.` 
                  : (legacyData?.mensaje_personalizado || `Bienvenido ${userData?.name}. Consulta aquí tu avance de consumo mensual.`)}
              </p>
            </CardContent>
          </Card>

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
          {faltanteKg <= 0 && faltanteMt <= 0 && targetKg > 0 ? (
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
                    Te faltan <strong className="underline">{faltanteKg} KG</strong> ({faltanteMt} metros) para superar la cuota mínima.
                  </p>
                </div>
              </div>
              {faltanteDinero && (
                <div className="bg-white/80 px-4 py-2 rounded-lg border border-amber-200 text-right w-full md:w-auto">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium block">Valor Faltante ($)</span>
                  <span className="text-lg font-bold text-red-600">{faltanteDinero}</span>
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
                    {mesesList && mesesList.length > 0 ? (
                      mesesList.map((m: any, idx: number) => {
                        const monthKg = m.kgCumplido ?? m.kg ?? '-';
                        const monthMt = m.mtCumplido ?? m.mt ?? '-';
                        const monthMoney = m.dinero !== undefined ? `$${Number(m.dinero).toLocaleString('es-CO')}` : (m.cuanto_va_dinero || '-');
                        const monthFaltaKg = m.faltanteKg ?? m.falta_kg ?? '-';
                        const monthFaltaMt = m.faltanteMt ?? m.falta_mt ?? '-';
                        const monthFaltaDinero = m.faltanteDinero !== undefined ? `$${Number(m.faltanteDinero).toLocaleString('es-CO')}` : (m.falta_dinero || '-');

                        return (
                          <TableRow key={idx} className="hover:bg-slate-50">
                            <TableCell className="font-bold text-blue-700 uppercase">{m.mes}</TableCell>
                            <TableCell className="text-right font-medium">{monthKg}</TableCell>
                            <TableCell className="text-right font-medium">{monthMt}</TableCell>
                            <TableCell className="text-right font-semibold text-emerald-700">{monthMoney}</TableCell>
                            <TableCell className="text-right text-slate-600">{monthFaltaKg}</TableCell>
                            <TableCell className="text-right text-slate-600">{monthFaltaMt}</TableCell>
                            <TableCell className="text-right text-red-600 font-medium">{monthFaltaDinero}</TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      /* Fallback con los datos actuales si no hay array de meses cargado */
                      <TableRow>
                        <TableCell className="font-bold text-blue-700">ACTUAL</TableCell>
                        <TableCell className="text-right font-medium">{currentKg}</TableCell>
                        <TableCell className="text-right font-medium">{currentMt}</TableCell>
                        <TableCell className="text-right font-semibold text-emerald-700">-</TableCell>
                        <TableCell className="text-right text-slate-600">{faltanteKg}</TableCell>
                        <TableCell className="text-right text-slate-600">{faltanteMt}</TableCell>
                        <TableCell className="text-right text-red-600 font-medium">{faltanteDinero || '-'}</TableCell>
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
                <p className="text-xl font-bold">{targetKg ? `${targetKg} KG` : "-"}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm border-l-4 border-l-blue-500">
              <CardContent className="p-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Acuerdo $ MT</p>
                <p className="text-xl font-bold">
                  {empresa?.acuerdoPrecio?.precioMt 
                    ? `$${Number(empresa.acuerdoPrecio.precioMt).toLocaleString('es-CO')}` 
                    : (legacyData?.acuerdo_mt || "-")}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm border-l-4 border-l-blue-500">
              <CardContent className="p-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Acuerdo $ KG</p>
                <p className="text-xl font-bold">
                  {empresa?.acuerdoPrecio?.precioKg 
                    ? `$${Number(empresa.acuerdoPrecio.precioKg).toLocaleString('es-CO')}` 
                    : (legacyData?.acuerdo_kg || "-")}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm border-l-4 border-l-emerald-500">
              <CardContent className="p-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Meta Mensual $</p>
                <p className="text-xl font-bold text-emerald-700">
                  {targetKg > 0 && empresa?.acuerdoPrecio?.precioKg 
                    ? `$${Math.round(targetKg * empresa.acuerdoPrecio.precioKg).toLocaleString('es-CO')}` 
                    : (legacyData?.acuerdo_kg_mes || "-")}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm border-l-4 border-l-purple-500">
              <CardContent className="p-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Tiempos de Pago</p>
                <p className="text-xs font-medium text-slate-700">{legacyData?.tiempos || "Acumulado fin de mes"}</p>
              </CardContent>
            </Card>
          </div>

          {/* DATOS DE CONTACTO / CLIENTE */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Cliente:</p>
              <p className="font-semibold text-slate-900">{empresa?.nombre || legacyData?.cliente || userData.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Encargado:</p>
              <p className="font-semibold text-slate-900">{legacyData?.encargado || "E-COMMERCE"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Cédula / NIT:</p>
              <p className="font-semibold text-slate-900">{empresa?.nit || legacyData?.cedula || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Ciudad / Dirección:</p>
              <p className="font-semibold text-slate-900">{empresa?.ciudad || empresa?.direccion || legacyData?.direccion || "-"}</p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
