"use client"

import { useState } from "react"
import { ArrowRightLeft, Calculator } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface InlineCalculatorProps {
  pricePerKilo: number
  pricePerMeter: number
  yieldValue?: number // metros por kilo
}

export function InlineCalculator({ pricePerKilo, pricePerMeter, yieldValue }: InlineCalculatorProps) {
  const [mode, setMode] = useState<"meters-to-kilos" | "kilos-to-meters">("meters-to-kilos")
  const [amount, setAmount] = useState<string>("")

  // Calculate yield if not explicitly provided
  const effectiveYield = yieldValue || (pricePerMeter > 0 ? pricePerKilo / pricePerMeter : 0)

  const handleToggleMode = () => {
    setMode((prev) => (prev === "meters-to-kilos" ? "kilos-to-meters" : "meters-to-kilos"))
    setAmount("") // Reset amount on toggle
  }

  const numericAmount = parseFloat(amount) || 0

  let outputAmount = 0
  let outputUnit = ""
  let estimatedPrice = 0

  if (effectiveYield > 0 && numericAmount > 0) {
    if (mode === "meters-to-kilos") {
      // Input is meters
      outputAmount = numericAmount / effectiveYield
      outputUnit = "kg"
      estimatedPrice = outputAmount * pricePerKilo
    } else {
      // Input is kilos
      outputAmount = numericAmount * effectiveYield
      outputUnit = "m"
      estimatedPrice = numericAmount * pricePerKilo
    }
  }

  return (
    <div className="mt-4 p-4 bg-muted/30 border border-border/50 rounded-xl space-y-4">
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Calculadora de equivalencia
        </h4>
        <Button variant="ghost" size="sm" onClick={handleToggleMode} className="h-8 text-xs gap-1 px-2">
          <ArrowRightLeft className="h-3 w-3" />
          Invertir
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground block">
            {mode === "meters-to-kilos" ? "Si necesito (Metros):" : "Si compro (Kilos):"}
          </label>
          <div className="relative">
            <Input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-10 text-sm pl-3 pr-10"
              min="0"
              step="0.1"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
              {mode === "meters-to-kilos" ? "m" : "kg"}
            </div>
          </div>
        </div>

        <div className="space-y-2 flex flex-col justify-end">
          <label className="text-xs text-muted-foreground block">
            {mode === "meters-to-kilos" ? "Equivale aprox. a:" : "Rinde aprox. para:"}
          </label>
          <div className="h-10 px-3 bg-background border border-border rounded-md flex items-center justify-between">
            <span className="font-medium text-sm">
              {numericAmount > 0 ? outputAmount.toFixed(2) : "0.00"}
            </span>
            <span className="text-xs text-muted-foreground">{outputUnit || (mode === "meters-to-kilos" ? "kg" : "m")}</span>
          </div>
        </div>
      </div>

      {numericAmount > 0 && (
        <div className="pt-3 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs text-muted-foreground block">Costo estimado:</span>
            <span className="text-lg font-bold text-primary">${Math.round(estimatedPrice).toLocaleString('es-CO')}</span>
          </div>
          <p className="text-[10px] text-muted-foreground sm:text-right max-w-[200px] leading-tight">
            * El valor indicado por la calculadora es aproximado, ya que el costo final se determina con base en el peso real de los cortes.
          </p>
        </div>
      )}
    </div>
  )
}
