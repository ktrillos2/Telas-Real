import React, { useCallback } from 'react'
import { Flex, TextInput, Box, Button } from '@sanity/ui'
import { set, unset, type StringInputProps } from 'sanity'

/** Paleta rápida con los colores de la marca */
const PRESETS = ['#ffffff', '#111827', '#5B9BAF', '#E8F4F8', '#E53935', '#F57C00', '#FDD835', '#43A047', '#1E88E5', '#8E24AA', '#FF2BD6', '#00F5FF', '#39FF14']

/**
 * Campo de color: selector nativo + código hex + paleta rápida. Guarda un string "#rrggbb"
 * (vacío = usar el color por defecto de la web).
 */
export function ColorStringInput(props: StringInputProps) {
  const { value = '', onChange, elementProps } = props
  const update = useCallback(
    (v: string) => onChange(v ? set(v) : unset()),
    [onChange]
  )
  const safe = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#ffffff'
  return (
    <Flex direction="column" gap={2}>
      <Flex gap={2} align="center">
        <input
          type="color"
          value={safe}
          onChange={(e) => update(e.target.value)}
          style={{ width: 42, height: 34, border: 'none', padding: 0, background: 'none', cursor: 'pointer' }}
          aria-label="Elegir color"
        />
        <Box flex={1}>
          <TextInput
            {...elementProps}
            value={value}
            placeholder="Vacío = color por defecto (ej. #5B9BAF)"
            onChange={(e) => update(e.currentTarget.value.trim())}
          />
        </Box>
        {value ? <Button mode="ghost" text="Quitar" onClick={() => update('')} /> : null}
      </Flex>
      <Flex gap={1} wrap="wrap">
        {PRESETS.map((c) => (
          <button
            key={c}
            type="button"
            title={c}
            onClick={() => update(c)}
            style={{ width: 22, height: 22, borderRadius: 6, border: value === c ? '2px solid #111' : '1px solid #ccc', background: c, cursor: 'pointer' }}
          />
        ))}
      </Flex>
    </Flex>
  )
}
