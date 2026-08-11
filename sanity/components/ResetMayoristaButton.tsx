import React, { useState } from 'react'
import { Button, Stack, Text, Card, Flex } from '@sanity/ui'
import { useFormValue, useClient } from 'sanity'

export function ResetMayoristaButton(props: any) {
  const client = useClient({ apiVersion: '2023-05-03' })
  const documentId = useFormValue(['_id']) as string | undefined
  const wholesaleData = useFormValue(['wholesaleData']) as any
  const [isResetting, setIsResetting] = useState(false)

  if (!documentId) return null

  const handleReset = async () => {
    if (!window.confirm("¿Estás seguro de que deseas reiniciar los contadores a 0? (Esto no borra el historial mensual que hayas guardado, solo reinicia los valores actuales de avance)")) {
      return
    }

    setIsResetting(true)
    try {
      const realId = documentId.replace('drafts.', '')
      
      const targetKg = wholesaleData?.volumen_mes_kg || 0
      const targetMt = wholesaleData?.volumen_mes_mt || 0
      const targetMoney = wholesaleData?.acuerdo_kg_mes || "0"

      await client
        .patch(realId)
        .set({
          'wholesaleData.brush_kg_cumplido': 0,
          'wholesaleData.brush_mt_cumplido': 0,
          'wholesaleData.cuanto_falto_kg': targetKg,
          'wholesaleData.cuanto_falto_mt': targetMt,
          'wholesaleData.cuanto_falto_dinero': targetMoney,
        })
        .commit()
      
      alert("¡Contadores reiniciados con éxito! Los cambios se reflejarán en unos segundos.")
    } catch (error) {
      console.error(error)
      alert("Hubo un error al reiniciar.")
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <Card padding={4} radius={2} shadow={1} tone="caution">
      <Flex direction="column" gap={3}>
        <Text size={2} weight="semibold">Reiniciar Avance del Mes Actual</Text>
        <Text size={1} muted>
          Al hacer clic en este botón, los valores de "Cumplido" volverán a 0 y los de "Faltante" se ajustarán automáticamente a la meta mensual definida.
        </Text>
        <Button 
          tone="critical" 
          mode="ghost"
          text={isResetting ? "Reiniciando..." : "Reiniciar Conteo a Cero"} 
          onClick={handleReset} 
          disabled={isResetting}
          style={{ width: 'fit-content', marginTop: '8px' }}
        />
      </Flex>
    </Card>
  )
}
