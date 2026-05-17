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
  top:    'top-full left-1/2 -translate-x-1/2 -translate-y-px border-x-transparent border-b-transparent border-t-gray-800',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 translate-y-px border-x-transparent border-t-transparent border-b-gray-800',
  left:   'left-full top-1/2 -translate-y-1/2 -translate-x-px border-y-transparent border-r-transparent border-l-gray-800',
  right:  'right-full top-1/2 -translate-y-1/2 translate-x-px border-y-transparent border-l-transparent border-r-gray-800',
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
        <div className="bg-gray-800 text-white text-xs rounded-lg px-2.5 py-1.5 max-w-[190px] text-center leading-snug shadow-xl whitespace-normal">
          {text}
        </div>
        <div className={`absolute w-0 h-0 border-4 ${arrow[position]}`} />
      </div>
    </div>
  )
}
