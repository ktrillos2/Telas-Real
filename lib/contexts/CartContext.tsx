"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import * as fpixel from '@/lib/fpixel'

interface CartItem {
  id: number
  uniqueId: string // Unique identifier for the cart item (id + design)
  name: string
  price: number
  quantity: number
  image: string
  slug: string
  designName?: string
  designUrl?: string
  isCustom?: boolean
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity' | 'uniqueId'>, quantity?: number) => void
  removeItem: (uniqueId: string) => void
  updateQuantity: (uniqueId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Cargar carrito desde localStorage al iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem('telasreal_cart')
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        // Migration: Add uniqueId if missing
        const migratedCart = parsedCart.map((item: any) => ({
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
    fpixel.event('AddToCart', {
      value: item.price * quantity,
      currency: 'COP',
      content_ids: [item.id],
      content_name: item.name,
      content_type: 'product',
    })

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

  const clearCart = React.useCallback(() => {
    setItems([])
  }, [])

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const value = React.useMemo(() => ({
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  }), [items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice])

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
