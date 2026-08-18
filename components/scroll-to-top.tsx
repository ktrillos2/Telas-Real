"use client"

import { useEffect } from "react"

export function ScrollToTop() {
  useEffect(() => {
    if (typeof window !== "undefined" && !window.location.hash) {
      window.scrollTo(0, 0)
    }
  }, [])
  
  return null
}
