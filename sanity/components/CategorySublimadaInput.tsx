import React, { useEffect, useState, useCallback } from 'react'
import { StringInputProps, set, unset, useClient } from 'sanity'
import { Select, Stack, TextInput, Flex, Button, Card, Text } from '@sanity/ui'
import { Plus, Check, RefreshCw, X } from 'lucide-react'

const DEFAULT_CATEGORIES = [
  'BRUSH SUBLIMADO',
  'PIEL DE CONEJO SUBLIMADO',
  'SATIN SUBLIMADO',
  'SUAVETINA SUBLIMADA',
  'SCUBA SUBLIMADA',
  'CHIFON SUBLIMADO',
  'ANTIFLUIDO SUBLIMADO',
  'SEDA SUBLIMADA',
  'TERCIOPELO SUBLIMADO',
  'LAFAYETTE SUBLIMADO',
  'LINO SUBLIMADO',
  'CREPE SUBLIMADO',
  'DAKOTA SUBLIMADA',
  'MICROFIBRA SUBLIMADA',
]

export function CategorySublimadaInput(props: StringInputProps) {
  const { value, onChange, schemaType } = props
  const client = useClient({ apiVersion: '2024-01-01' })
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Fetch from categoriaSublimada schema
      const registeredDocs = await client.fetch<Array<{ name: string }>>(
        `*[_type == "categoriaSublimada" && defined(name)].name`
      )
      
      // 2. Fetch distinct categories from existing imagenSublimada
      const usedCategories = await client.fetch<Array<string>>(
        `array::unique(*[_type == "imagenSublimada" && defined(category)].category)`
      )

      // Combine defaults + registered + used
      const allUnique = Array.from(
        new Set([
          ...DEFAULT_CATEGORIES,
          ...(registeredDocs || []),
          ...(usedCategories || []),
        ])
      )
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b))

      setCategories(allUnique)
    } catch (error) {
      console.error('Error fetching categories for input:', error)
      setCategories(DEFAULT_CATEGORIES)
    } finally {
      setLoading(false)
    }
  }, [client])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value
    if (selected === '__NEW__') {
      setIsCreatingNew(true)
    } else if (selected === '') {
      onChange(unset())
    } else {
      onChange(set(selected))
    }
  }

  const handleCreateCategory = async () => {
    const trimmed = newCatName.trim().toUpperCase()
    if (!trimmed) return

    setIsSaving(true)
    try {
      // Check if already registered
      const existing = await client.fetch(
        `count(*[_type == "categoriaSublimada" && upper(name) == $name])`,
        { name: trimmed }
      )

      if (existing === 0) {
        const slugStr = trimmed
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')

        await client.create({
          _type: 'categoriaSublimada',
          name: trimmed,
          slug: { _type: 'slug', current: slugStr },
          isActive: true,
        })
      }

      // Add to local state & select it
      setCategories((prev) => Array.from(new Set([...prev, trimmed])).sort())
      onChange(set(trimmed))
      setNewCatName('')
      setIsCreatingNew(false)
    } catch (error) {
      console.error('Error creating categoriaSublimada:', error)
      alert('Error al crear la categoría: ' + String(error))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Stack space={3}>
      <Flex gap={2} align="center">
        <div style={{ flex: 1 }}>
          <Select
            value={value || ''}
            onChange={handleSelectChange}
            disabled={loading}
          >
            <option value="">-- Seleccionar Categoría de Sublimación --</option>
            <option value="TODOS">TODOS LOS DISEÑOS (Sin filtro)</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            <option value="__NEW__">➕ Crear Nueva Categoría...</option>
          </Select>
        </div>
        <Button
          mode="ghost"
          icon={RefreshCw}
          title="Recargar categorías"
          onClick={fetchCategories}
          disabled={loading}
        />
      </Flex>

      {isCreatingNew && (
        <Card padding={3} radius={2} tone="primary" border>
          <Stack space={3}>
            <Text size={1} weight="semibold">
              Crear y registrar nueva categoría:
            </Text>
            <Flex gap={2} align="center">
              <TextInput
                value={newCatName}
                placeholder="Ej: FRANELA SUBLIMADA"
                onChange={(e) => setNewCatName(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCreateCategory()
                  }
                }}
              />
              <Button
                tone="positive"
                text={isSaving ? 'Guardando...' : 'Guardar'}
                onClick={handleCreateCategory}
                disabled={isSaving || !newCatName.trim()}
              />
              <Button
                mode="ghost"
                text="Cancelar"
                onClick={() => {
                  setIsCreatingNew(false)
                  setNewCatName('')
                }}
              />
            </Flex>
          </Stack>
        </Card>
      )}

      {value && !categories.includes(value.toUpperCase()) && (
        <Text size={1} muted>
          Valor actual: <strong>{value}</strong> (Categoría personalizada)
        </Text>
      )}
    </Stack>
  )
}
