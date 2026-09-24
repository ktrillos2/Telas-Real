/**
 * Utility functions for managing search history in localStorage
 * and providing intelligent fabric autocomplete suggestions.
 */

const SEARCH_HISTORY_KEY = "telas_real_search_history"
const MAX_HISTORY_ITEMS = 8

export const POPULAR_FABRIC_TERMS: string[] = [
  "Tela Satín",
  "Tela Brush",
  "Piel de Durazno",
  "Tela Wafer",
  "Seda de Mango",
  "Rib Pitillo",
  "Tela Rib",
  "Tela Crepe",
  "Licra Deportiva",
  "Telas Deportivas",
  "Tela Uvita",
  "Poly Licra",
  "Tela Cartago",
  "Tela Acetato",
  "Hilos 40/02",
  "Telas Sublimadas",
  "Telas Unicolor",
  "Telas Elegantes",
  "Lino",
  "Chifón Crepe",
  "Antifluido",
  "Scuba Crepe",
  "Suavetina",
  "Piel de Conejo",
  "Algodón",
  "Dry-Fit",
]

/**
 * Retrieves search history from localStorage.
 */
export function getSearchHistory(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : []
  } catch (e) {
    console.error("Error reading search history from localStorage:", e)
    return []
  }
}

/**
 * Saves a new search term to localStorage history.
 * Deduplicates case-insensitively and puts the latest term first.
 */
export function saveSearchHistory(query: string): string[] {
  if (typeof window === "undefined") return []
  const trimmed = query.trim()
  if (!trimmed || trimmed.length < 2) return getSearchHistory()

  try {
    const current = getSearchHistory()
    const filtered = current.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())
    const updated = [trimmed, ...filtered].slice(0, MAX_HISTORY_ITEMS)
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated))
    return updated
  } catch (e) {
    console.error("Error saving search history to localStorage:", e)
    return []
  }
}

/**
 * Removes a specific search term from localStorage history.
 */
export function removeSearchHistoryItem(query: string): string[] {
  if (typeof window === "undefined") return []
  try {
    const current = getSearchHistory()
    const updated = current.filter((item) => item.toLowerCase() !== query.trim().toLowerCase())
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated))
    return updated
  } catch (e) {
    console.error("Error removing search history item:", e)
    return []
  }
}

/**
 * Clears the entire search history from localStorage.
 */
export function clearSearchHistory(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY)
  } catch (e) {
    console.error("Error clearing search history:", e)
  }
}

/**
 * Returns autocomplete suggestions based on the user's input.
 */
export function getAutocompleteSuggestions(query: string, maxResults = 6): string[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const history = getSearchHistory()
  const historyMatches = history.filter(
    (h) => h.toLowerCase().includes(q) && h.toLowerCase() !== q
  )

  const termMatches = POPULAR_FABRIC_TERMS.filter(
    (term) =>
      term.toLowerCase().includes(q) &&
      term.toLowerCase() !== q &&
      !historyMatches.some((h) => h.toLowerCase() === term.toLowerCase())
  )

  return [...historyMatches, ...termMatches].slice(0, maxResults)
}
