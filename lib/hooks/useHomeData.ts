import { useHomeDataContext } from '@/lib/contexts/HomeDataContext'

// Re-export types if needed by other components, or let them import from context
// For now, mirroring the return type structure so existing components don't break
export function useHomeData() {
  return useHomeDataContext()
}
