"use client"

import { useEffect } from "react"
import { X, ChevronDown } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"

interface MobileFiltersSidebarProps {
  isOpen: boolean
  onClose: () => void
  maxPrice: number
  priceRange: [number, number]
  setPriceRange: (value: [number, number]) => void
  selectedWidths: string[]
  toggleWidth: (width: string) => void
  selectedElasticities: string[]
  toggleElasticity: (elasticity: string) => void
  selectedWeightRanges: string[]
  toggleWeightRange: (range: string) => void
  sublimableFilter: string
  setSublimableFilter: (value: string) => void
  selectedCompositions: string[]
  toggleComposition: (composition: string) => void
  availableElasticities: string[]
  availableCompositions: string[]
}

export function MobileFiltersSidebar({
  isOpen,
  onClose,
  maxPrice,
  priceRange,
  setPriceRange,
  selectedWidths,
  toggleWidth,
  selectedElasticities,
  toggleElasticity,
  selectedWeightRanges,
  toggleWeightRange,
  sublimableFilter,
  setSublimableFilter,
  selectedCompositions,
  toggleComposition,
  availableElasticities,
  availableCompositions,
}: MobileFiltersSidebarProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  return (
    <>
      {/* Overlay backdrop (z-[60] to sit above mobile bottom navigation) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar with slide animation (z-[70] to remain strictly above mobile bottom nav) */}
      <div
        className={`fixed left-0 top-0 bottom-0 z-[70] w-full sm:w-80 max-w-[100vw] h-full max-h-[100dvh] bg-background shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        }`}
      >
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-4 border-b bg-background flex-shrink-0">
          <h2 className="text-xl font-light">Filtros</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-full transition-colors"
            aria-label="Cerrar filtros"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Filters Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 overscroll-contain">
          <div>
            <h3 className="text-lg font-light mb-4 flex items-center justify-between">
              Precio
              <ChevronDown className="h-4 w-4" />
            </h3>
            <div className="space-y-4">
              <Slider
                min={0}
                max={maxPrice}
                step={1000}
                value={priceRange}
                onValueChange={(value) => setPriceRange(value as [number, number])}
                className="w-full"
              />
              <div className="flex justify-between text-sm font-light text-muted-foreground">
                <span>${priceRange[0].toLocaleString("es-CO")}</span>
                <span>${priceRange[1].toLocaleString("es-CO")}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-light mb-4 flex items-center justify-between">
              Ancho
              <ChevronDown className="h-4 w-4" />
            </h3>
            <div className="space-y-2">
              {["1.50", "1.55", "1.60", "1.70"].map((width) => (
                <div key={width} className="flex items-center space-x-2">
                  <Checkbox
                    id={`width-${width}-mobile`}
                    checked={selectedWidths.includes(width)}
                    onCheckedChange={() => toggleWidth(width)}
                  />
                  <Label htmlFor={`width-${width}-mobile`} className="font-light text-sm cursor-pointer">
                    {width} metros
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {availableElasticities.length > 0 && (
            <div>
              <h3 className="text-lg font-light mb-4 flex items-center justify-between">
                Elasticidad Tela
                <ChevronDown className="h-4 w-4" />
              </h3>
              <div className="space-y-2">
                {availableElasticities.map((elasticity) => (
                  <div key={elasticity} className="flex items-center space-x-2">
                    <Checkbox
                      id={`elasticity-${elasticity}-mobile`}
                      checked={selectedElasticities.includes(elasticity)}
                      onCheckedChange={() => toggleElasticity(elasticity)}
                    />
                    <Label
                      htmlFor={`elasticity-${elasticity}-mobile`}
                      className="font-light text-sm cursor-pointer"
                    >
                      {elasticity}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-light mb-4 flex items-center justify-between">
              Peso
              <ChevronDown className="h-4 w-4" />
            </h3>
            <div className="space-y-2">
              {["0-200", "201-400", "401-600"].map((range) => {
                const labels = {
                  "0-200": "0 - 200 g/m",
                  "201-400": "201 - 400 g/m",
                  "401-600": "401 - 600 g/m"
                }
                return (
                  <div key={range} className="flex items-center space-x-2">
                    <Checkbox
                      id={`weight-range-${range}-mobile`}
                      checked={selectedWeightRanges.includes(range)}
                      onCheckedChange={() => toggleWeightRange(range)}
                    />
                    <Label htmlFor={`weight-range-${range}-mobile`} className="font-light text-sm cursor-pointer">
                      {labels[range as keyof typeof labels]}
                    </Label>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-light mb-4 flex items-center justify-between">
              Sublimable
              <ChevronDown className="h-4 w-4" />
            </h3>
            <RadioGroup value={sublimableFilter} onValueChange={setSublimableFilter}>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="all" id="sublimable-all-mobile" />
                <Label htmlFor="sublimable-all-mobile" className="font-light text-sm cursor-pointer">
                  Todos
                </Label>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="yes" id="sublimable-yes-mobile" />
                <Label htmlFor="sublimable-yes-mobile" className="font-light text-sm cursor-pointer">
                  Sí
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="sublimable-no-mobile" />
                <Label htmlFor="sublimable-no-mobile" className="font-light text-sm cursor-pointer">
                  No
                </Label>
              </div>
            </RadioGroup>
          </div>

          {availableCompositions.length > 0 && (
            <div>
              <h3 className="text-lg font-light mb-4 flex items-center justify-between">
                Composición
                <ChevronDown className="h-4 w-4" />
              </h3>
              <div className="space-y-2">
                {availableCompositions.map((composition) => (
                  <div key={composition} className="flex items-center space-x-2">
                    <Checkbox
                      id={`composition-${composition}-mobile`}
                      checked={selectedCompositions.includes(composition)}
                      onCheckedChange={() => toggleComposition(composition)}
                    />
                    <Label htmlFor={`composition-${composition}-mobile`} className="font-light text-sm cursor-pointer">
                      {composition}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pinned Footer with Aplicar Filtros (always visible and above bottom mobile nav) */}
        <div className="p-4 border-t bg-background flex-shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
          <Button onClick={onClose} className="w-full h-11 text-base font-medium shadow-sm">
            Aplicar Filtros
          </Button>
        </div>
      </div>
    </>
  )
}
