"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface LoadingContextValue {
  isDataLoaded: boolean
  isImagesLoaded: boolean
  isFullyLoaded: boolean
  setDataLoaded: (loaded: boolean) => void
  setImagesLoaded: (loaded: boolean) => void
}

const LoadingContext = createContext<LoadingContextValue | undefined>(undefined)

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [isImagesLoaded, setIsImagesLoaded] = useState(false)

  const setDataLoaded = useCallback((loaded: boolean) => {
    setIsDataLoaded(loaded)
  }, [])

  const setImagesLoaded = useCallback((loaded: boolean) => {
    setIsImagesLoaded(loaded)
  }, [])

  const isFullyLoaded = isDataLoaded && isImagesLoaded

  return (
    <LoadingContext.Provider
      value={{
        isDataLoaded,
        isImagesLoaded,
        isFullyLoaded,
        setDataLoaded,
        setImagesLoaded,
      }}
    >
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoadingContext() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error('useLoadingContext must be used within a LoadingProvider')
  }
  return context
}
