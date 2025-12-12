"use client"

import { X, ChevronDown } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"

interface MobileFiltersSidebarProps {
  isOpen: boolean
  onClose: () => void
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
  return (
    <>
      {/* Overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar with slide animation */}
      <div
        className={`fixed left-0 top-0 bottom-0 z-50 w-full sm:w-80 bg-background shadow-lg transform transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background">
          <h2 className="text-xl font-light">Filtros</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-full transition-colors"
            aria-label="Cerrar filtros"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-73px)] p-6 space-y-6">
          <div>
            <h3 className="text-lg font-light mb-4 flex items-center justify-between">
              Precio
              <ChevronDown className="h-4 w-4" />
            </h3>
            <div className="space-y-4">
              <Slider
                min={0}
                max={50000}
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

          <Button onClick={onClose} className="w-full">
            Aplicar Filtros
          </Button>
        </div>
      </div>
    </>
  )
}
