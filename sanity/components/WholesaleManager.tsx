import React, { useState, useEffect } from 'react'
import { Card, Text, Flex, Button, Stack, Box, Inline, TextInput, ToastProvider, useToast } from '@sanity/ui'
import { useClient } from 'sanity'
import Papa from 'papaparse'

export function WholesaleManager() {
  const client = useClient({ apiVersion: '2023-05-03' })
  const toast = useToast()
  
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [currentMonthName, setCurrentMonthName] = useState('AGOSTO')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    const result = await client.fetch(`*[_type == "user" && role == "mayorista"]{
      _id,
      name,
      email,
      wholesaleData
    }`)
    setUsers(result)
    setLoading(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          await processCsvData(results.data)
          toast.push({ status: 'success', title: 'Datos actualizados correctamente' })
          fetchUsers()
        } catch (err: any) {
          toast.push({ status: 'error', title: 'Error al actualizar', description: err.message })
        } finally {
          setUploading(false)
        }
      }
    })
  }

  const parseNumber = (val: string) => {
    if (!val) return 0
    const parsed = parseFloat(val.toString().replace(/,/g, ''))
    return isNaN(parsed) ? 0 : parsed
  }

  const processCsvData = async (rows: any[]) => {
    const transaction = client.transaction()
    
    for (const row of rows) {
      const cedulaStr = row['CÉDULA']?.toString().trim()
      if (!cedulaStr) continue
      
      // Find the user with this Cedula
      const matchedUser = users.find(u => u.wholesaleData?.cedula?.toString().trim() === cedulaStr)
      
      if (matchedUser) {
        // Extract data based on standard columns from their Excel
        const kgCumplido = parseNumber(row['BRUSH KG JUN 2026'] || row['BRUSH KG CUMPLIDO'] || row['KG'])
        const mtCumplido = parseNumber(row['BRUSH MT CUMPLIDO JUN 2026'] || row['BRUSH MT CUMPLIDO'] || row['MT'])
        const faltoKg = parseNumber(row['CUANTO LE FALTO EN KG JUN 2026'] || row['CUANTO LE FALTO EN KG'] || row['FALTA KG'])
        const faltoMt = parseNumber(row['CUANTO LE FALTO EN MT JUN 2026'] || row['CUANTO LE FALTO EN MT'] || row['FALTA MT'])
        const faltoDinero = row['BRUSH CUANTO LE FALTO EN $ JUN 2026'] || row['FALTA $'] || ''
        
        // Setup new month record
        const newMonthRecord = {
          _key: Math.random().toString(36).substring(7),
          mes: currentMonthName,
          kg: kgCumplido,
          mt: mtCumplido,
          cuanto_va_dinero: '',
          falta_kg: faltoKg,
          falta_mt: faltoMt,
          falta_dinero: faltoDinero
        }
        
        const existingHistory = matchedUser.wholesaleData?.historial_meses || []
        // Optional: filter out if already exists for this month to avoid duplicates
        const filteredHistory = existingHistory.filter((h: any) => h.mes !== currentMonthName)
        
        transaction.patch(matchedUser._id, (p) => 
          p.set({
            'wholesaleData.brush_kg_cumplido': kgCumplido,
            'wholesaleData.brush_mt_cumplido': mtCumplido,
            'wholesaleData.cuanto_falto_kg': faltoKg,
            'wholesaleData.cuanto_falto_mt': faltoMt,
            'wholesaleData.cuanto_falto_dinero': faltoDinero,
            'wholesaleData.historial_meses': [...filteredHistory, newMonthRecord]
          })
        )
      }
    }
    
    await transaction.commit()
  }

  return (
    <Box padding={5}>
      <Card padding={4} radius={3} shadow={1} style={{ maxWidth: 800, margin: '0 auto' }}>
        <Stack space={4}>
          <Text size={4} weight="bold">Gestión de Clientes Mayoristas</Text>
          <Text size={2} muted>Sube un archivo CSV con las columnas de progreso para actualizar masivamente a todos tus clientes. El sistema los emparejará por el número de CÉDULA.</Text>
          
          <Box marginTop={3}>
            <Text weight="semibold" size={2} style={{ marginBottom: 8 }}>Mes a Registrar:</Text>
            <TextInput 
              value={currentMonthName} 
              onChange={(e: any) => setCurrentMonthName(e.target.value.toUpperCase())}
              placeholder="EJ: AGOSTO"
              style={{ maxWidth: 300, marginBottom: 16 }}
            />
            
            <Flex gap={3} align="center">
              <Button 
                as="label" 
                tone="primary" 
                disabled={uploading}
                text={uploading ? "Procesando..." : "Subir Archivo CSV (Excel)"}
              >
                <input 
                  type="file" 
                  accept=".csv" 
                  style={{ display: 'none' }} 
                  onChange={handleFileUpload} 
                  disabled={uploading}
                />
              </Button>
            </Flex>
          </Box>
          
          {loading ? (
             <Text marginTop={4}>Cargando usuarios...</Text>
          ) : (
            <Box marginTop={5}>
              <Text weight="semibold" size={3} style={{ marginBottom: 16 }}>
                Clientes Detectados ({users.length})
              </Text>
              
              <div style={{ maxHeight: 400, overflow: 'auto', border: '1px solid #eaeaea', borderRadius: 6 }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f9f9f9', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: 12, borderBottom: '1px solid #eaeaea' }}>Nombre</th>
                      <th style={{ padding: 12, borderBottom: '1px solid #eaeaea' }}>Cédula</th>
                      <th style={{ padding: 12, borderBottom: '1px solid #eaeaea' }}>KG Cumplido</th>
                      <th style={{ padding: 12, borderBottom: '1px solid #eaeaea' }}>Faltante KG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id} style={{ borderBottom: '1px solid #eaeaea' }}>
                        <td style={{ padding: 12 }}>{u.wholesaleData?.cliente || u.name}</td>
                        <td style={{ padding: 12 }}>{u.wholesaleData?.cedula || 'Sin Cédula'}</td>
                        <td style={{ padding: 12 }}>{u.wholesaleData?.brush_kg_cumplido || 0}</td>
                        <td style={{ padding: 12, color: 'red' }}>{u.wholesaleData?.cuanto_falto_kg || 0}</td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ padding: 12, textAlign: 'center', color: '#888' }}>
                          No se encontraron clientes con rol "mayorista".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Box>
          )}
        </Stack>
      </Card>
    </Box>
  )
}

export default function WholesaleManagerWrapper() {
  return (
    <ToastProvider>
      <WholesaleManager />
    </ToastProvider>
  )
}
