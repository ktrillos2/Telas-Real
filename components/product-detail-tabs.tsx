"use client"

import React, { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PortableText } from "next-sanity"
import { ProductSpecSheet } from "@/components/product-spec-sheet"
import { FileText, Info } from "lucide-react"

export interface ProductAttribute {
  id?: number | string
  name: string
  value?: string
  visible?: boolean
  terms?: Array<{
    id?: number
    name: string
    slug?: string
  }>
}

export interface ProductDetailTabsProps {
  product: any
  description?: any // string | PortableTextBlock[]
  attributes?: ProductAttribute[]
  weight?: string
  dimensions?: {
    length: string
    width: string
    height: string
  }
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export function ProductDetailTabs({
  product,
  description,
  attributes = [],
  weight,
  dimensions,
  activeTab: controlledActiveTab,
  onTabChange,
}: ProductDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<string>(
    controlledActiveTab || "spec-sheet"
  )

  useEffect(() => {
    if (controlledActiveTab) {
      setActiveTab(controlledActiveTab)
    }
  }, [controlledActiveTab])

  const handleTabChange = (val: string) => {
    setActiveTab(val)
    if (onTabChange) {
      onTabChange(val)
    }
  }

  // Combinar attributes y datos del producto
  const enrichedProduct = {
    ...product,
    attributes: attributes.length > 0 ? attributes : product?.attributes || [],
    weight: weight || product?.weight || product?.shipping?.weightKg,
    dimensions: dimensions || product?.dimensions,
  }

  const productDescription = description || product?.description || product?.short_description

  return (
    <div id="detalles-producto-tabs" className="w-full space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <div className="border-b border-border pb-px overflow-x-auto scrollbar-none">
          <TabsList className="flex w-full sm:w-auto h-12 bg-transparent p-0 gap-2 md:gap-4 justify-start">
            {/* Tab Ficha Técnica */}
            <TabsTrigger
              value="spec-sheet"
              className="flex items-center gap-2 h-11 px-4 md:px-6 rounded-xl border border-transparent data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground hover:text-foreground text-sm font-medium transition-all shadow-none cursor-pointer"
            >
              <FileText className="w-4 h-4 text-primary" />
              <span>Ficha Técnica</span>
            </TabsTrigger>

            {/* Tab Descripción */}
            {productDescription && (
              <TabsTrigger
                value="description"
                className="flex items-center gap-2 h-11 px-4 md:px-6 rounded-xl border border-transparent data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground hover:text-foreground text-sm font-medium transition-all shadow-none cursor-pointer"
              >
                <Info className="w-4 h-4" />
                <span>Descripción</span>
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* Contenido Ficha Técnica */}
        <TabsContent value="spec-sheet" className="mt-6 focus-visible:outline-none">
          <ProductSpecSheet product={enrichedProduct} />
        </TabsContent>

        {/* Contenido Descripción */}
        {productDescription && (
          <TabsContent value="description" className="mt-6 focus-visible:outline-none">
            <div className="bg-card border border-border/80 rounded-2xl p-6 md:p-8 shadow-sm">
              <h3 className="text-xl md:text-2xl font-light text-foreground mb-4">
                Descripción Detallada
              </h3>
              <div className="prose prose-neutral dark:prose-invert max-w-none font-light text-muted-foreground leading-relaxed text-sm md:text-base space-y-4">
                {Array.isArray(productDescription) ? (
                  <PortableText value={productDescription} />
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: productDescription }} />
                )}
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
