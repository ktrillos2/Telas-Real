"use client"

import type { CouponPaymentMethods } from '@/lib/coupon-rules'
import React, { createContext, useContext, useState, useEffect } from 'react'
import * as fpixel from '@/lib/fpixel'
import * as gtag from '@/lib/gtag'

interface CartItem {
  id: number | string
  uniqueId: string // Unique identifier for the cart item (id + design)
  name: string
  price: number
  quantity: number
  image: string
  slug: string
  designName?: string
  designUrl?: string
  isCustom?: boolean
  hasPromo?: boolean
  regularPrice?: number
  categorySlugs?: string[]
}

export interface AppliedCoupon {
  code: string
  title: string
  percent: number
  /** Descuento calculado por el servidor para los ítems actuales del carrito */
  discount: number
  /** uniqueId de los ítems a los que aplica */
  eligibleItems: string[]
  /** Formas de pago permitidas: el checkout solo descuenta si coincide con la elegida */
  paymentMethods?: CouponPaymentMethods
  /** Mínimo de metros de tela que aplican (0 = sin mínimo) */
  minMeters?: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity' | 'uniqueId'>, quantity?: number) => void
  removeItem: (uniqueId: string) => void
  updateQuantity: (uniqueId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
  isCartOpen: boolean
  setIsCartOpen: (open: boolean) => void
  openCart: () => void
  closeCart: () => void
  /** Cupón aplicado (null si no hay). Si deja de aplicar, se conserva el código con descuento 0 y couponError explica por qué. */
  coupon: AppliedCoupon | null
  couponDiscount: number
  couponError: string
  isCouponLoading: boolean
  applyCoupon: (code: string) => Promise<{ ok: boolean; error?: string }>
  removeCoupon: () => void
}

const COUPON_STORAGE_KEY = 'telasreal_coupon'

// Cupón tal como lo guarda el carrito a partir de la respuesta del servidor
function toAppliedCoupon(result: any): AppliedCoupon {
  return {
    code: result.code,
    title: result.title,
    percent: result.percent,
    discount: result.discount,
    eligibleItems: result.eligibleItems || [],
    paymentMethods: result.paymentMethods || 'all',
    minMeters: result.minMeters || 0,
  }
}

// Motivos por los que el cupón se conserva con descuento 0: el cliente puede corregirlo en el carrito
const RECOVERABLE_COUPON_REASONS = ['NO_ELIGIBLE_ITEMS', 'MIN_METERS']

async function requestCouponValidation(code: string, items: CartItem[]) {
  const res = await fetch('/api/coupons/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      // name y categorySlugs: para no contar hilos y tijeras en el mínimo de metros
      items: items.map((i) => ({ uniqueId: i.uniqueId, id: i.id, slug: i.slug, name: i.name, categorySlugs: i.categorySlugs, price: i.price, quantity: i.quantity })),
    }),
  })
  return res.json()
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  const openCart = React.useCallback(() => setIsCartOpen(true), [])
  const closeCart = React.useCallback(() => setIsCartOpen(false), [])

  // Cargar carrito desde localStorage al iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem('telasreal_cart')
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        // Migration: Add uniqueId if missing & filter out demo items
        const migratedCart = parsedCart
          .filter((item: any) => item.id !== 'satin-colores-prueba' && item.slug !== 'satin-colores-prueba' && !/demo/i.test(item.name || ''))
          .map((item: any) => ({
            ...item,
            uniqueId: item.uniqueId || `${item.id}-${Date.now()}-${Math.random()}`
          }))
        setItems(migratedCart)
      } catch (error) {
        console.error('Error loading cart:', error)
      }
    }
  }, [])

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('telasreal_cart', JSON.stringify(items))
  }, [items])

  const addItem = React.useCallback((item: Omit<CartItem, 'quantity' | 'uniqueId'>, quantity: number = 1) => {
    if (item.id === 'satin-colores-prueba' || item.slug === 'satin-colores-prueba' || /demo/i.test(item.name || '')) {
      return
    }

    fpixel.event('AddToCart', {
      value: item.price * quantity,
      currency: 'COP',
      content_ids: [item.id],
      content_name: item.name,
      content_type: 'product',
    })

    gtag.event('add_to_cart', {
      currency: 'COP',
      value: item.price * quantity,
      items: [{
        item_id: item.id.toString(),
        item_name: item.name,
        currency: 'COP',
        price: item.price,
        quantity: quantity
      }]
    })

    // Track internally for Sanity Dashboard metrics
    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_to_cart' })
    }).catch(console.error);

    setItems((prevItems) => {
      // Check if item exists with same ID AND same Design
      const existingItem = prevItems.find((i) =>
        i.id === item.id &&
        i.designUrl === item.designUrl &&
        i.isCustom === item.isCustom
      )

      if (existingItem) {
        // Si el producto ya existe (mismo diseño), actualizar cantidad
        return prevItems.map((i) =>
          i.uniqueId === existingItem.uniqueId
            ? { ...i, quantity: i.quantity + quantity }
            : i
        )
      } else {
        // Si es nuevo (o diferente diseño), agregarlo con nuevo uniqueId
        const newItem = {
          ...item,
          quantity,
          uniqueId: `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }
        return [...prevItems, newItem]
      }
    })
  }, [])

  const removeItem = React.useCallback((uniqueId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.uniqueId !== uniqueId))
  }, [])

  const updateQuantity = React.useCallback((uniqueId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(uniqueId)
      return
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.uniqueId === uniqueId ? { ...item, quantity } : item
      )
    )
  }, [removeItem])

  // --- Cupón de descuento -----------------------------------------------------
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null)
  const [couponCode, setCouponCode] = useState<string | null>(null)
  const [couponError, setCouponError] = useState('')
  const [isCouponLoading, setIsCouponLoading] = useState(false)

  // Recuperar el código guardado (se revalida contra el carrito actual)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(COUPON_STORAGE_KEY)
      if (saved) setCouponCode(saved)
    } catch {}
  }, [])

  const applyCoupon = React.useCallback(async (rawCode: string) => {
    const code = rawCode.trim().toUpperCase()
    if (!code) return { ok: false, error: 'Escribe un código de cupón.' }
    setIsCouponLoading(true)
    try {
      const result = await requestCouponValidation(code, items)
      if (!result?.ok && RECOVERABLE_COUPON_REASONS.includes(result?.reason)) {
        // Válido pero aún no cumple (ej. faltan metros): se guarda y el descuento aparece al cumplir
        setCouponCode(result.code)
        setCoupon({ code: result.code, title: result.code, percent: 0, discount: 0, eligibleItems: [] })
        setCouponError(result.error)
        try { localStorage.setItem(COUPON_STORAGE_KEY, result.code) } catch {}
        return { ok: true }
      }
      if (!result?.ok) {
        return { ok: false, error: result?.error || 'El cupón no es válido.' }
      }
      setCouponCode(result.code)
      setCoupon(toAppliedCoupon(result))
      setCouponError('')
      try { localStorage.setItem(COUPON_STORAGE_KEY, result.code) } catch {}
      return { ok: true }
    } catch {
      return { ok: false, error: 'No se pudo validar el cupón. Intenta de nuevo.' }
    } finally {
      setIsCouponLoading(false)
    }
  }, [items])

  const removeCoupon = React.useCallback(() => {
    setCouponCode(null)
    setCoupon(null)
    setCouponError('')
    try { localStorage.removeItem(COUPON_STORAGE_KEY) } catch {}
  }, [])

  // Recalcular el descuento cuando cambia el carrito (agregar, quitar o cambiar cantidades)
  useEffect(() => {
    if (!couponCode) return
    if (items.length === 0) {
      setCoupon((prev) => (prev ? { ...prev, discount: 0, eligibleItems: [] } : prev))
      return
    }
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const result = await requestCouponValidation(couponCode, items)
        if (cancelled) return
        if (result?.ok) {
          setCoupon(toAppliedCoupon(result))
          setCouponError('')
        } else if (RECOVERABLE_COUPON_REASONS.includes(result?.reason)) {
          // Se conserva el código: si el cliente agrega un producto que aplica, el descuento vuelve
          setCoupon((prev) => ({ ...prev, code: couponCode, title: prev?.title || couponCode, percent: prev?.percent || 0, discount: 0, eligibleItems: [] }))
          setCouponError(result.error)
        } else if (result && result.ok === false && result.reason) {
          // Inexistente, inactivo, vencido o aún no vigente: se retira
          setCoupon(null)
          setCouponCode(null)
          setCouponError(result.error)
          try { localStorage.removeItem(COUPON_STORAGE_KEY) } catch {}
        }
      } catch {
        // Error de red: se mantiene el último cálculo
      }
    }, 350)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [couponCode, items])

  const clearCart = React.useCallback(() => {
    setItems([])
    removeCoupon()
  }, [removeCoupon])

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const couponDiscount = coupon ? Math.min(coupon.discount, totalPrice) : 0

  const value = React.useMemo(() => ({
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    isCartOpen,
    setIsCartOpen,
    openCart,
    closeCart,
    coupon,
    couponDiscount,
    couponError,
    isCouponLoading,
    applyCoupon,
    removeCoupon,
  }), [items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, isCartOpen, openCart, closeCart, coupon, couponDiscount, couponError, isCouponLoading, applyCoupon, removeCoupon])

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
