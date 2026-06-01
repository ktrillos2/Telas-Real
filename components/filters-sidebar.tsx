"use client"

import { ChevronDown } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

/**
 * Componente reutilizable para filtros de productos
 * Compatible con WordPress REST API - estructura escalable
 *
 * Props esperados desde WordPress:
 * - priceRanges: Array de objetos {id, label, min, max}
 * - widths: Array de strings
 * - elasticities: Array de objetos {value, label}
 * - weights: Array de objetos {id, label, min, max}
 */

interface FiltersSidebarProps {
  priceRange: string
  setPriceRange: (value: string) => void
  selectedWidths: string[]
  toggleWidth: (width: string) => void
  selectedElasticities: string[]
  toggleElasticity: (elasticity: string) => void
  weightRange: string
  setWeightRange: (value: string) => void
}

export function FiltersSidebar({
  priceRange,
  setPriceRange,
  selectedWidths,
  toggleWidth,
  selectedElasticities,
  toggleElasticity,
  weightRange,
  setWeightRange,
}: FiltersSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Precio Filter */}
      <div>
        <h3 className="text-lg font-light mb-4 flex items-center justify-between">
          Precio
          <ChevronDown className="h-4 w-4" />
        </h3>
        <RadioGroup value={priceRange} onValueChange={setPriceRange}>
          <div className="flex items-center space-x-2 mb-2">
            <RadioGroupItem value="todos" id="precio-todos" />
            <Label htmlFor="precio-todos" className="font-light text-sm cursor-pointer">
              Todos
            </Label>
          </div>
          <div className="flex items-center space-x-2 mb-2">
            <RadioGroupItem value="bajo" id="precio-bajo" />
            <Label htmlFor="precio-bajo" className="font-light text-sm cursor-pointer">
              Hasta $20.000
            </Label>
          </div>
          <div className="flex items-center space-x-2 mb-2">
            <RadioGroupItem value="medio" id="precio-medio" />
            <Label htmlFor="precio-medio" className="font-light text-sm cursor-pointer">
              $20.000 - $28.000
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="alto" id="precio-alto" />
            <Label htmlFor="precio-alto" className="font-light text-sm cursor-pointer">
              Más de $28.000
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Ancho Filter */}
      <div>
        <h3 className="text-lg font-light mb-4 flex items-center justify-between">
          Ancho
          <ChevronDown className="h-4 w-4" />
        </h3>
        <div className="space-y-2">
          {["1.50", "1.55", "1.60", "1.70"].map((width) => (
            <div key={width} className="flex items-center space-x-2">
              <Checkbox
                id={`width-${width}`}
                checked={selectedWidths.includes(width)}
                onCheckedChange={() => toggleWidth(width)}
              />
              <Label htmlFor={`width-${width}`} className="font-light text-sm cursor-pointer">
                {width} metros
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Elasticidad Filter */}
      <div>
        <h3 className="text-lg font-light mb-4 flex items-center justify-between">
          Elasticidad Tela
          <ChevronDown className="h-4 w-4" />
        </h3>
        <div className="space-y-2">
          {[
            { value: "alta", label: "Alta" },
            { value: "media", label: "Media" },
            { value: "limitada", label: "Limitada" },
            { value: "nula", label: "Nula" },
          ].map((elasticity) => (
            <div key={elasticity.value} className="flex items-center space-x-2">
              <Checkbox
                id={`elasticity-${elasticity.value}`}
                checked={selectedElasticities.includes(elasticity.value)}
                onCheckedChange={() => toggleElasticity(elasticity.value)}
              />
              <Label htmlFor={`elasticity-${elasticity.value}`} className="font-light text-sm cursor-pointer">
                {elasticity.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Peso Filter */}
      <div>
        <h3 className="text-lg font-light mb-4 flex items-center justify-between">
          Peso
          <ChevronDown className="h-4 w-4" />
        </h3>
        <RadioGroup value={weightRange} onValueChange={setWeightRange}>
          <div className="flex items-center space-x-2 mb-2">
            <RadioGroupItem value="todos" id="peso-todos" />
            <Label htmlFor="peso-todos" className="font-light text-sm cursor-pointer">
              Todos
            </Label>
          </div>
          <div className="flex items-center space-x-2 mb-2">
            <RadioGroupItem value="ligero" id="peso-ligero" />
            <Label htmlFor="peso-ligero" className="font-light text-sm cursor-pointer">
              Ligero (hasta 170g)
            </Label>
          </div>
          <div className="flex items-center space-x-2 mb-2">
            <RadioGroupItem value="medio" id="peso-medio" />
            <Label htmlFor="peso-medio" className="font-light text-sm cursor-pointer">
              Medio (170-220g)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="pesado" id="peso-pesado" />
            <Label htmlFor="peso-pesado" className="font-light text-sm cursor-pointer">
              Pesado (más de 220g)
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  )
}
