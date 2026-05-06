import { Bell } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function NotificationButton({ count = 0, className, ...props }) {
  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        'relative h-11 w-11 rounded-2xl border-white/15 bg-white/10 text-[var(--fg)] shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-[20px] transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-400/50 hover:text-indigo-400 hover:shadow-[0_12px_40px_rgba(99,102,241,0.25),inset_0_1px_0_rgba(255,255,255,0.2)]',
        className,
      )}
      aria-label="Notifications"
      {...props}
    >
      <Bell size={18} strokeWidth={2} aria-hidden="true" />
      {count > 0 && (
        <Badge className="absolute -top-2 left-full min-w-5 -translate-x-1/2 border-[color:var(--sidebar-bg,#111827)] bg-red-500 px-1 text-[10px] font-bold leading-4 text-white shadow-sm">
          {count > 99 ? '99+' : count}
        </Badge>
      )}
    </Button>
  )
}
