"use client"

import { useState, useMemo, useEffect } from "react"
import { Container } from "@/components/ui/container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { Calculator, ArrowRightLeft, Scale, Ruler, Search, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { client } from "@/sanity/lib/client"

export interface FabricData {
    name: string
    pricePerKilo: number
    pricePerRoll: number | null
    yield: number
    pricePerMeter: number | null
}

export default function CalculatorPage() {
    const [selectedFabricName, setSelectedFabricName] = useState<string>("")
    const [amount, setAmount] = useState<string>("")
    const [mode, setMode] = useState<"meters-to-kilos" | "kilos-to-meters">("meters-to-kilos")
    const [fabricData, setFabricData] = useState<FabricData[]>([])
    const [isLoadingData, setIsLoadingData] = useState(true)
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    const filteredFabrics = useMemo(() => {
        if (!searchQuery) return fabricData
        return fabricData.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }, [fabricData, searchQuery])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const query = `*[_type == "calculadoraSettings"][0].fabrics`
                const data = await client.fetch(query)
                // Usar datos de Sanity si existen y tienen longitud > 0
                if (data && data.length > 0) {
                    setFabricData(data)
                } else {
                    setFabricData([])
                }
            } catch (error) {
                console.error("Error fetching calculator data:", error)
                setFabricData([]) 
            } finally {
                setIsLoadingData(false)
            }
        }
        fetchData()
    }, [])

    const selectedFabric = useMemo(() =>
        fabricData.find(f => f.name === selectedFabricName),
        [selectedFabricName, fabricData])

    const result = useMemo(() => {
        if (!selectedFabric || !amount || isNaN(parseFloat(amount))) return null

        const val = parseFloat(amount)
        const rendimiento = selectedFabric.yield

        if (mode === "meters-to-kilos") {
            // Metros ingresados. Quiero saber Kilos.
            // Kilos = Metros / Rendimiento
            const kilos = val / rendimiento
            const estimatedPrice = kilos * selectedFabric.pricePerKilo

            return {
                outputAmount: kilos,
                outputUnit: "Kg",
                estimatedPrice,
                formula: `${val}m / ${rendimiento} (Rendimiento)`
            }
        } else {
            // Kilos ingresados. Quiero saber Metros.
            // Metros = Kilos * Rendimiento
            const meters = val * rendimiento
            // Precio es simplemente Kilos * PrecioKilo (el input son kilos)
            const estimatedPrice = val * selectedFabric.pricePerKilo

            return {
                outputAmount: meters,
                outputUnit: "Metros",
                estimatedPrice,
                formula: `${val}kg * ${rendimiento} (Rendimiento)`
            }
        }
    }, [selectedFabric, amount, mode])

    const toggleMode = () => {
        setMode(prev => prev === "meters-to-kilos" ? "kilos-to-meters" : "meters-to-kilos")
        setAmount("") // Reset input to avoid confusion
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
                <Container className="max-w-4xl mx-auto">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
                            <Calculator className="h-8 w-8 text-primary" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-light mb-4 text-balance">
                            Calculadora de Telas
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Calcula fácilmente la cantidad de tela que necesitas. Convierte entre metros y kilos según el rendimiento específico de cada referencia.
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-12">
                        {/* Input Section */}
                        <div className="md:col-span-7 space-y-6">
                            <Card className="border-none shadow-lg">
                                <CardHeader>
                                    <CardTitle>Datos de Cálculo</CardTitle>
                                    <CardDescription>Selecciona la tela e ingresa la cantidad</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="fabric-select">Seleccionar Tela</Label>
                                        <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
                                            <PopoverPrimitive.Trigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={open}
                                                    className="w-full justify-between h-12 text-base font-normal bg-background"
                                                    disabled={isLoadingData}
                                                >
                                                    <span className="truncate">
                                                        {selectedFabricName
                                                            ? fabricData.find((fabric) => fabric.name === selectedFabricName)?.name
                                                            : isLoadingData ? "Cargando telas..." : "Busca o selecciona una tela..."}
                                                    </span>
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverPrimitive.Trigger>
                                            <PopoverPrimitive.Content 
                                                className="w-[var(--radix-popover-trigger-width)] p-0 z-50 bg-popover text-popover-foreground rounded-md border shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                                                align="start"
                                                sideOffset={4}
                                            >
                                                <div className="flex items-center border-b px-3">
                                                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                                    <input
                                                        className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                                        placeholder="Buscar tela..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                    />
                                                </div>
                                                <div className="max-h-[300px] overflow-y-auto p-1">
                                                    {filteredFabrics.length === 0 ? (
                                                        <div className="py-6 text-center text-sm text-muted-foreground">
                                                            No se encontró la tela.
                                                        </div>
                                                    ) : (
                                                        filteredFabrics.map((fabric) => (
                                                            <div
                                                                key={fabric.name}
                                                                onClick={() => {
                                                                    setSelectedFabricName(fabric.name)
                                                                    setOpen(false)
                                                                }}
                                                                className={cn(
                                                                    "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer",
                                                                    selectedFabricName === fabric.name ? "bg-accent/50 text-accent-foreground" : ""
                                                                )}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        selectedFabricName === fabric.name ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {fabric.name}
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </PopoverPrimitive.Content>
                                        </PopoverPrimitive.Root>
                                        {!selectedFabric && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                                * Selecciona una referencia para ver su rendimiento.
                                            </p>
                                        )}
                                    </div>

                                    {selectedFabric && (
                                        <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between text-sm">
                                            <div>
                                                <span className="font-semibold text-gray-700">Rendimiento:</span>
                                                <div className="text-gray-600">{selectedFabric.yield} metros x Kilo</div>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-700">Precio Kilo:</span>
                                                <div className="text-gray-600">${selectedFabric.pricePerKilo.toLocaleString('es-CO')}</div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-base font-medium">
                                                {mode === "meters-to-kilos" ? "Quiero convertir METROS a KILOS" : "Quiero convertir KILOS a METROS"}
                                            </Label>
                                            <Button variant="ghost" size="sm" onClick={toggleMode} className="gap-2 text-primary hover:text-primary/80">
                                                <ArrowRightLeft className="h-4 w-4" />
                                                Invertir
                                            </Button>
                                        </div>

                                        <div className="relative">
                                            <Input
                                                type="number"
                                                placeholder="Ingresa cantidad"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                className="h-14 text-lg pl-12"
                                                min="0"
                                            />
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                                {mode === "meters-to-kilos" ? <Ruler className="h-5 w-5" /> : <Scale className="h-5 w-5" />}
                                            </div>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 font-medium text-gray-500">
                                                {mode === "meters-to-kilos" ? "Metros" : "Kilos"}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Result Section */}
                        <div className="md:col-span-5">
                            <Card className={cn(
                                "h-full border-primary/20 bg-primary/5 shadow-lg transition-all duration-300",
                                result ? "opacity-100 scale-100" : "opacity-80 grayscale-[0.5]"
                            )}>
                                <CardHeader>
                                    <CardTitle className="text-primary">Resultado Estimado</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    {!result ? (
                                        <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground p-4 border-2 border-dashed border-primary/20 rounded-xl">
                                            <Calculator className="h-10 w-10 mb-2 opacity-20" />
                                            <p>Ingresa los datos para ver el cálculo</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-center space-y-2">
                                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Cantidad Equivalente</p>
                                                <div className="text-5xl font-extrabold text-gray-900 tracking-tight">
                                                    {result.outputAmount.toFixed(2)}
                                                    <span className="text-2xl ml-2 text-gray-500">{result.outputUnit}</span>
                                                </div>
                                            </div>

                                            <div className="my-6 h-px bg-primary/20" />

                                            <div className="text-center space-y-2">
                                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Costo Estimado</p>
                                                <div className="text-4xl font-bold text-primary">
                                                    ${result.estimatedPrice.toLocaleString('es-CO')}
                                                </div>
                                                <p className="text-xs text-gray-400 mt-2">
                                                    * El precio puede variar ligeramente
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </Container>
            </main>
        </div>
    )
}
