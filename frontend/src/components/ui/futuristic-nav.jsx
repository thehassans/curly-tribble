import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function LumaBar({ items = [], active = 0, onSelect, className }) {
  if (!Array.isArray(items) || !items.length) return null

  return (
    <div className={cn('fixed bottom-6 left-1/2 z-50 -translate-x-1/2', className)}>
      <div className="relative flex items-center justify-center gap-3 overflow-hidden rounded-full border border-gray-200/50 bg-white/20 px-4 py-2 shadow-xl backdrop-blur-2xl dark:border-gray-700/50 dark:bg-black/20 sm:gap-4 sm:px-6 sm:py-3">
        <motion.div
          className="absolute top-1/2 h-14 w-14 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 blur-2xl"
          animate={{
            left: `calc(${((active || 0) + 0.5) * (100 / items.length)}%)`,
            x: '-50%',
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />

        {items.map((item, index) => {
          const isActive = index === active
          return (
            <motion.div key={item.id ?? item.label ?? index} className="group relative flex flex-col items-center">
              <motion.button
                type="button"
                onClick={() => onSelect && onSelect(item, index)}
                whileHover={{ scale: 1.14 }}
                animate={{ scale: isActive ? 1.18 : 1 }}
                className={cn(
                  'relative z-10 flex h-12 w-12 items-center justify-center rounded-full text-gray-600 transition-colors dark:text-gray-300',
                  isActive ? 'text-blue-500 dark:text-blue-400' : 'hover:text-blue-500 dark:hover:text-blue-400',
                )}
                aria-label={item.label}
                title={item.label}
              >
                {item.icon}
              </motion.button>

              <span className="pointer-events-none absolute bottom-full mb-2 whitespace-nowrap rounded-md bg-gray-500 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-gray-200 dark:text-black">
                {item.label}
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
