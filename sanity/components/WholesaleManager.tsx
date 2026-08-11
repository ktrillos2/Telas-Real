import React, { useState, useEffect } from 'react'
import { Card, Text, Flex, Button, Stack, Box, TextInput, ToastProvider, useToast, Dialog, Grid } from '@sanity/ui'
import { useClient } from 'sanity'
import Papa from 'papaparse'

export function WholesaleManager() {
  const client = useClient({ apiVersion: '2023-05-03' })
  const toast = useToast()
  
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [currentMonthName, setCurrentMonthName] = useState('AGOSTO')
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form State
  const [formData, setFormData] = useState<any>({
    _id: '',
    name: '',
    email: '',
    password: '',
    wholesaleData: {
      cliente: '',
      encargado: '',
      cedula: '',
      direccion: '',
      telefono: '',
      facturacion: '',
      acuerdo_mt: '',
      acuerdo_kg: '',
      volumen_mes_kg: 0,
      volumen_mes_mt: 0,
      volumen_compra_kg: 0,
      acuerdo_kg_mes: '',
      tiempos: '',
      brush_kg_cumplido: 0,
      brush_mt_cumplido: 0,
      cuanto_falto_kg: 0,
      cuanto_falto_mt: 0,
      cuanto_falto_dinero: '',
      mensaje_personalizado: ''
    }
  })

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
          toast.push({ status: 'success', title: 'Datos actualizados masivamente correctamente' })
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
      
      const matchedUser = users.find(u => u.wholesaleData?.cedula?.toString().trim() === cedulaStr)
      
      if (matchedUser) {
        const kgCumplido = parseNumber(row['BRUSH KG JUN 2026'] || row['BRUSH KG CUMPLIDO'] || row['KG'])
        const mtCumplido = parseNumber(row['BRUSH MT CUMPLIDO JUN 2026'] || row['BRUSH MT CUMPLIDO'] || row['MT'])
        const faltoKg = parseNumber(row['CUANTO LE FALTO EN KG JUN 2026'] || row['CUANTO LE FALTO EN KG'] || row['FALTA KG'])
        const faltoMt = parseNumber(row['CUANTO LE FALTO EN MT JUN 2026'] || row['CUANTO LE FALTO EN MT'] || row['FALTA MT'])
        const faltoDinero = row['BRUSH CUANTO LE FALTO EN $ JUN 2026'] || row['FALTA $'] || ''
        
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

  const openCreateDialog = () => {
    setFormData({
      _id: '',
      name: '',
      email: '',
      password: '',
      wholesaleData: {
        cliente: '',
        encargado: '',
        cedula: '',
        direccion: '',
        telefono: '',
        facturacion: '',
        acuerdo_mt: '',
        acuerdo_kg: '',
        volumen_mes_kg: 0,
        volumen_mes_mt: 0,
        volumen_compra_kg: 0,
        acuerdo_kg_mes: '',
        tiempos: '',
        brush_kg_cumplido: 0,
        brush_mt_cumplido: 0,
        cuanto_falto_kg: 0,
        cuanto_falto_mt: 0,
        cuanto_falto_dinero: '',
        mensaje_personalizado: ''
      }
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (user: any) => {
    setFormData({
      _id: user._id,
      name: user.name || '',
      email: user.email || '',
      password: '', // Don't fetch password
      wholesaleData: {
        cliente: user.wholesaleData?.cliente || '',
        encargado: user.wholesaleData?.encargado || '',
        cedula: user.wholesaleData?.cedula || '',
        direccion: user.wholesaleData?.direccion || '',
        telefono: user.wholesaleData?.telefono || '',
        facturacion: user.wholesaleData?.facturacion || '',
        acuerdo_mt: user.wholesaleData?.acuerdo_mt || '',
        acuerdo_kg: user.wholesaleData?.acuerdo_kg || '',
        volumen_mes_kg: user.wholesaleData?.volumen_mes_kg || 0,
        volumen_mes_mt: user.wholesaleData?.volumen_mes_mt || 0,
        volumen_compra_kg: user.wholesaleData?.volumen_compra_kg || 0,
        acuerdo_kg_mes: user.wholesaleData?.acuerdo_kg_mes || '',
        tiempos: user.wholesaleData?.tiempos || '',
        brush_kg_cumplido: user.wholesaleData?.brush_kg_cumplido || 0,
        brush_mt_cumplido: user.wholesaleData?.brush_mt_cumplido || 0,
        cuanto_falto_kg: user.wholesaleData?.cuanto_falto_kg || 0,
        cuanto_falto_mt: user.wholesaleData?.cuanto_falto_mt || 0,
        cuanto_falto_dinero: user.wholesaleData?.cuanto_falto_dinero || '',
        mensaje_personalizado: user.wholesaleData?.mensaje_personalizado || ''
      }
    })
    setIsDialogOpen(true)
  }

  const handleSaveUser = async () => {
    if (!formData.name || !formData.email) {
      toast.push({ status: 'warning', title: 'Nombre y Email son requeridos' })
      return
    }

    setIsSaving(true)
    try {
      const isNew = !formData._id
      
      const payload: any = {
        _type: 'user',
        name: formData.name,
        email: formData.email,
        role: 'mayorista',
        wholesaleData: {
          ...formData.wholesaleData,
          volumen_mes_kg: Number(formData.wholesaleData.volumen_mes_kg),
          volumen_mes_mt: Number(formData.wholesaleData.volumen_mes_mt),
          volumen_compra_kg: Number(formData.wholesaleData.volumen_compra_kg),
          brush_kg_cumplido: Number(formData.wholesaleData.brush_kg_cumplido),
          brush_mt_cumplido: Number(formData.wholesaleData.brush_mt_cumplido),
          cuanto_falto_kg: Number(formData.wholesaleData.cuanto_falto_kg),
          cuanto_falto_mt: Number(formData.wholesaleData.cuanto_falto_mt)
        }
      }
      
      if (formData.password && formData.password.trim() !== '') {
        payload.password = formData.password
      }

      if (isNew) {
        await client.create(payload)
        toast.push({ status: 'success', title: 'Cliente Mayorista creado exitosamente' })
      } else {
        await client.patch(formData._id).set(payload).commit()
        toast.push({ status: 'success', title: 'Datos del cliente actualizados' })
      }
      
      setIsDialogOpen(false)
      fetchUsers()
    } catch (error: any) {
      toast.push({ status: 'error', title: 'Error al guardar', description: error.message })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (field: string, value: any, isWholesaleData = false) => {
    if (isWholesaleData) {
      setFormData((prev: any) => ({
        ...prev,
        wholesaleData: {
          ...prev.wholesaleData,
          [field]: value
        }
      }))
    } else {
      setFormData((prev: any) => ({
        ...prev,
        [field]: value
      }))
    }
  }

  return (
    <Box padding={5}>
      <Card padding={4} radius={3} shadow={1} style={{ maxWidth: 1000, margin: '0 auto' }}>
        <Stack space={5}>
          <Flex justify="space-between" align="center">
            <Box>
              <Text size={4} weight="bold">CRM de Clientes Mayoristas</Text>
              <Text size={2} muted marginTop={2}>Crea, edita o actualiza el progreso mensual de tus clientes corporativos.</Text>
            </Box>
            <Button 
              tone="primary" 
              text="Crear Nuevo Mayorista" 
              onClick={openCreateDialog} 
            />
          </Flex>
          
          <Card padding={4} radius={2} tone="transparent" border>
            <Text weight="semibold" size={2} style={{ marginBottom: 8 }}>Actualización Masiva de Mes (vía Excel CSV):</Text>
            <Flex gap={3} align="center">
              <TextInput 
                value={currentMonthName} 
                onChange={(e: any) => setCurrentMonthName(e.target.value.toUpperCase())}
                placeholder="EJ: AGOSTO"
                style={{ maxWidth: 200 }}
              />
              <Button 
                as="label" 
                tone="caution" 
                mode="ghost"
                disabled={uploading}
                text={uploading ? "Procesando..." : "Subir Archivo .CSV"}
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
          </Card>
          
          {loading ? (
             <Text marginTop={4}>Cargando usuarios...</Text>
          ) : (
            <Box>
              <Text weight="semibold" size={3} style={{ marginBottom: 16 }}>
                Directorio de Mayoristas ({users.length})
              </Text>
              
              <div style={{ maxHeight: 600, overflow: 'auto', border: '1px solid #eaeaea', borderRadius: 6 }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f9f9f9', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: 12, borderBottom: '1px solid #eaeaea' }}>Nombre del Negocio / Cliente</th>
                      <th style={{ padding: 12, borderBottom: '1px solid #eaeaea' }}>Cédula / NIT</th>
                      <th style={{ padding: 12, borderBottom: '1px solid #eaeaea' }}>Progreso KG</th>
                      <th style={{ padding: 12, borderBottom: '1px solid #eaeaea' }}>Faltante KG</th>
                      <th style={{ padding: 12, borderBottom: '1px solid #eaeaea' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr 
                        key={u._id} 
                        style={{ borderBottom: '1px solid #eaeaea', cursor: 'pointer', transition: 'background 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f4f5f7'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        onClick={() => openEditDialog(u)}
                      >
                        <td style={{ padding: 12 }}>
                          <Text weight="medium">{u.wholesaleData?.cliente || u.name}</Text>
                          <Text size={1} muted>{u.email}</Text>
                        </td>
                        <td style={{ padding: 12 }}><Text size={2}>{u.wholesaleData?.cedula || '-'}</Text></td>
                        <td style={{ padding: 12 }}>
                          <Text size={2} weight="bold" style={{ color: '#2563eb' }}>
                            {u.wholesaleData?.brush_kg_cumplido || 0} / {u.wholesaleData?.volumen_mes_kg || 0}
                          </Text>
                        </td>
                        <td style={{ padding: 12 }}>
                           <Text size={2} style={{ color: (u.wholesaleData?.cuanto_falto_kg || 0) > 0 ? '#dc2626' : '#16a34a', fontWeight: 'bold' }}>
                              {u.wholesaleData?.cuanto_falto_kg || 0}
                           </Text>
                        </td>
                        <td style={{ padding: 12 }}>
                          <Button mode="ghost" text="Editar Perfil" size={1} onClick={(e) => { e.stopPropagation(); openEditDialog(u) }} />
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#888' }}>
                          No hay clientes registrados como mayoristas.
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

      {/* CREATE / EDIT DIALOG */}
      {isDialogOpen && (
        <Dialog
          header={formData._id ? "Editar Cliente Mayorista" : "Nuevo Cliente Mayorista"}
          id="dialog-mayorista"
          width={2}
          onClose={() => setIsDialogOpen(false)}
          zOffset={1000}
        >
          <Box padding={4}>
            <Stack space={5}>
              <Box>
                <Text weight="bold" size={3} style={{ marginBottom: 16 }}>1. Datos de Acceso y Perfil</Text>
                <Grid columns={2} gap={4}>
                  <Stack space={2}>
                    <Text size={1} weight="medium">Nombre Completo *</Text>
                    <TextInput value={formData.name} onChange={(e: any) => handleChange('name', e.currentTarget.value)} />
                  </Stack>
                  <Stack space={2}>
                    <Text size={1} weight="medium">Correo Electrónico (Para Login) *</Text>
                    <TextInput value={formData.email} onChange={(e: any) => handleChange('email', e.currentTarget.value)} />
                  </Stack>
                  <Stack space={2}>
                    <Text size={1} weight="medium">Contraseña {formData._id && '(Dejar en blanco para no cambiar)'}</Text>
                    <TextInput type="password" value={formData.password} onChange={(e: any) => handleChange('password', e.currentTarget.value)} />
                  </Stack>
                </Grid>
              </Box>
              
              <Box>
                <Text weight="bold" size={3} style={{ marginBottom: 16 }}>2. Información Corporativa y Acuerdos</Text>
                <Grid columns={3} gap={4}>
                  <Stack space={2}>
                    <Text size={1} weight="medium">Razón Social / Cliente</Text>
                    <TextInput value={formData.wholesaleData.cliente} onChange={(e: any) => handleChange('cliente', e.currentTarget.value, true)} />
                  </Stack>
                  <Stack space={2}>
                    <Text size={1} weight="medium">Cédula / NIT</Text>
                    <TextInput value={formData.wholesaleData.cedula} onChange={(e: any) => handleChange('cedula', e.currentTarget.value, true)} />
                  </Stack>
                  <Stack space={2}>
                    <Text size={1} weight="medium">Encargado</Text>
                    <TextInput value={formData.wholesaleData.encargado} onChange={(e: any) => handleChange('encargado', e.currentTarget.value, true)} />
                  </Stack>
                  <Stack space={2}>
                    <Text size={1} weight="medium">Teléfono</Text>
                    <TextInput value={formData.wholesaleData.telefono} onChange={(e: any) => handleChange('telefono', e.currentTarget.value, true)} />
                  </Stack>
                  <Stack space={2}>
                    <Text size={1} weight="medium">Dirección</Text>
                    <TextInput value={formData.wholesaleData.direccion} onChange={(e: any) => handleChange('direccion', e.currentTarget.value, true)} />
                  </Stack>
                  <Stack space={2}>
                    <Text size={1} weight="medium">Condición de Facturación</Text>
                    <TextInput value={formData.wholesaleData.facturacion} onChange={(e: any) => handleChange('facturacion', e.currentTarget.value, true)} />
                  </Stack>
                  <Stack space={2}>
                    <Text size={1} weight="medium">Acuerdo $ MT</Text>
                    <TextInput value={formData.wholesaleData.acuerdo_mt} onChange={(e: any) => handleChange('acuerdo_mt', e.currentTarget.value, true)} placeholder="EJ: $12,000" />
                  </Stack>
                  <Stack space={2}>
                    <Text size={1} weight="medium">Acuerdo $ KG</Text>
                    <TextInput value={formData.wholesaleData.acuerdo_kg} onChange={(e: any) => handleChange('acuerdo_kg', e.currentTarget.value, true)} placeholder="EJ: $39,600" />
                  </Stack>
                  <Stack space={2}>
                    <Text size={1} weight="medium">Acuerdo KG Mensual ($)</Text>
                    <TextInput value={formData.wholesaleData.acuerdo_kg_mes} onChange={(e: any) => handleChange('acuerdo_kg_mes', e.currentTarget.value, true)} placeholder="Meta en Dinero" />
                  </Stack>
                </Grid>
              </Box>

              <Box>
                <Text weight="bold" size={3} style={{ marginBottom: 16 }}>3. Cuotas y Volúmenes (Metas)</Text>
                <Grid columns={3} gap={4}>
                  <Stack space={2}>
                    <Text size={1} weight="medium">Cuota Mínima Mensual (KG)</Text>
                    <TextInput type="number" value={formData.wholesaleData.volumen_mes_kg} onChange={(e: any) => handleChange('volumen_mes_kg', e.currentTarget.value, true)} />
                  </Stack>
                  <Stack space={2}>
                    <Text size={1} weight="medium">Cuota Mínima Mensual (MT)</Text>
                    <TextInput type="number" value={formData.wholesaleData.volumen_mes_mt} onChange={(e: any) => handleChange('volumen_mes_mt', e.currentTarget.value, true)} />
                  </Stack>
                  <Stack space={2}>
                    <Text size={1} weight="medium">Compra Mínima por Pedido (KG)</Text>
                    <TextInput type="number" value={formData.wholesaleData.volumen_compra_kg} onChange={(e: any) => handleChange('volumen_compra_kg', e.currentTarget.value, true)} />
                  </Stack>
                  <Stack space={2}>
                    <Text size={1} weight="medium">Tiempos / Condiciones</Text>
                    <TextInput value={formData.wholesaleData.tiempos} onChange={(e: any) => handleChange('tiempos', e.currentTarget.value, true)} />
                  </Stack>
                </Grid>
              </Box>
              
              <Box style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <Text weight="bold" size={3} style={{ marginBottom: 16 }}>4. Avance Manual del Mes Actual</Text>
                <Grid columns={3} gap={4}>
                  <Stack space={2}>
                    <Text size={1} weight="medium" style={{ color: '#2563eb' }}>KG Cumplido</Text>
                    <TextInput type="number" value={formData.wholesaleData.brush_kg_cumplido} onChange={(e: any) => handleChange('brush_kg_cumplido', e.currentTarget.value, true)} />
                  </Stack>
                  <Stack space={2}>
                    <Text size={1} weight="medium" style={{ color: '#dc2626' }}>KG Faltante</Text>
                    <TextInput type="number" value={formData.wholesaleData.cuanto_falto_kg} onChange={(e: any) => handleChange('cuanto_falto_kg', e.currentTarget.value, true)} />
                  </Stack>
                  <Stack space={2}>
                    <Text size={1} weight="medium" style={{ color: '#2563eb' }}>MT Cumplido</Text>
                    <TextInput type="number" value={formData.wholesaleData.brush_mt_cumplido} onChange={(e: any) => handleChange('brush_mt_cumplido', e.currentTarget.value, true)} />
                  </Stack>
                  <Stack space={2}>
                    <Text size={1} weight="medium" style={{ color: '#dc2626' }}>MT Faltante</Text>
                    <TextInput type="number" value={formData.wholesaleData.cuanto_falto_mt} onChange={(e: any) => handleChange('cuanto_falto_mt', e.currentTarget.value, true)} />
                  </Stack>
                  <Stack space={2}>
                    <Text size={1} weight="medium" style={{ color: '#dc2626' }}>Dinero Faltante ($)</Text>
                    <TextInput value={formData.wholesaleData.cuanto_falto_dinero} onChange={(e: any) => handleChange('cuanto_falto_dinero', e.currentTarget.value, true)} />
                  </Stack>
                  <Stack space={2}>
                    <Text size={1} weight="medium">Mensaje Destacado</Text>
                    <TextInput value={formData.wholesaleData.mensaje_personalizado} onChange={(e: any) => handleChange('mensaje_personalizado', e.currentTarget.value, true)} placeholder="Opcional. Se verá en su panel web" />
                  </Stack>
                </Grid>
              </Box>

              <Flex justify="flex-end" gap={3} marginTop={4}>
                <Button mode="ghost" text="Cancelar" onClick={() => setIsDialogOpen(false)} />
                <Button tone="primary" text={isSaving ? "Guardando..." : "Guardar Mayorista"} disabled={isSaving} onClick={handleSaveUser} />
              </Flex>
            </Stack>
          </Box>
        </Dialog>
      )}
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
