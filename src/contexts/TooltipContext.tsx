import { createContext, useContext } from 'react'

export const TooltipContext = createContext(true)

export function useTooltips() {
  return useContext(TooltipContext)
}
