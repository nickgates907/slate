import { ReactNode } from 'react'
import { useTooltips } from '../contexts/TooltipContext'

type Position = 'top' | 'bottom' | 'left' | 'right'

interface TooltipProps {
  text: string
  children: ReactNode
  position?: Position
  className?: string
}

const bubble: Record<Position, string> = {
  top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left:   'right-full top-1/2 -translate-y-1/2 mr-2',
  right:  'left-full top-1/2 -translate-y-1/2 ml-2',
}

const arrow: Record<Position, string> = {
  top:    'top-full left-1/2 -translate-x-1/2 -translate-y-px border-x-transparent border-b-transparent border-t-gray-900',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 translate-y-px border-x-transparent border-t-transparent border-b-gray-900',
  left:   'left-full top-1/2 -translate-y-1/2 -translate-x-px border-y-transparent border-r-transparent border-l-gray-900',
  right:  'right-full top-1/2 -translate-y-1/2 translate-x-px border-y-transparent border-l-transparent border-r-gray-900',
}

export default function Tooltip({ text, children, position = 'top', className = '' }: TooltipProps) {
  const show = useTooltips()
  if (!show) return <>{children}</>

  return (
    <div className={`relative group/tip inline-flex ${className}`}>
      {children}
      <div
        role="tooltip"
        className={`absolute ${bubble[position]} z-[200] pointer-events-none opacity-0 group-hover/tip:opacity-100 transition-opacity duration-100 group-hover/tip:delay-500`}
      >
        <div className="bg-gray-900 border border-white/10 text-white text-xs font-medium rounded-md px-2 py-1 w-max max-w-[220px] text-left leading-snug shadow-lg whitespace-normal">
          {text}
        </div>
        <div className={`absolute w-0 h-0 border-4 ${arrow[position]}`} />
      </div>
    </div>
  )
}
