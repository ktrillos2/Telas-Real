"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PortableText } from "next-sanity"

interface ProductAttribute {
  id: number
  name: string
  terms: Array<{
    id: number
    name: string
    slug: string
  }>
}

interface ProductDetailTabsProps {
  description: any // string | PortableTextBlock[]
  attributes?: ProductAttribute[]
  weight?: string
  dimensions?: {
    length: string
    width: string
    height: string
  }
}

export function ProductDetailTabs({ description, attributes = [], weight, dimensions }: ProductDetailTabsProps) {
  return (
    <Tabs defaultValue="description" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="description">Descripción</TabsTrigger>
        <TabsTrigger value="info">Información Adicional</TabsTrigger>
      </TabsList>

      <TabsContent value="description" className="mt-6">
        <div className="prose prose-sm max-w-none font-light text-muted-foreground">
          {Array.isArray(description) ? (
            <PortableText value={description} />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: description }} />
          )}
        </div>
      </TabsContent>

      <TabsContent value="info" className="mt-6">
        <div className="space-y-4">
          {(attributes.length > 0 || weight || dimensions) ? (
            <table className="w-full text-sm">
              <tbody>
                {weight && (
                  <tr className="border-b border-border">
                    <td className="py-3 font-normal text-muted-foreground">Peso</td>
                    <td className="py-3 font-light">{weight} kg</td>
                  </tr>
                )}
                {dimensions && (
                  <tr className="border-b border-border">
                    <td className="py-3 font-normal text-muted-foreground">Dimensiones</td>
                    <td className="py-3 font-light">
                      {dimensions.length} x {dimensions.width} x {dimensions.height} cm
                    </td>
                  </tr>
                )}
                {attributes.map((attr) => (
                  <tr key={attr.id} className="border-b border-border">
                    <td className="py-3 font-normal text-muted-foreground">{attr.name}</td>
                    <td className="py-3 font-light">
                      {attr.terms?.map(term => term.name).join(", ") || ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted-foreground font-light">No hay información adicional disponible.</p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}
