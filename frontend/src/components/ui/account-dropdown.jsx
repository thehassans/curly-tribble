import React from 'react'
import { CircleUserRound } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

function getInitials(name) {
  return String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export default function AccountDropdown({
  name,
  email,
  avatarSrc,
  fallbackLabel = 'User',
  triggerLabel = 'Open account menu',
  contentClassName,
  triggerClassName,
  children,
}) {
  const displayName = String(name || '').trim() || fallbackLabel
  const initials = getInitials(displayName) || fallbackLabel[0] || 'U'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          aria-label={triggerLabel}
          title={triggerLabel}
          className={cn(
            'h-11 w-11 rounded-2xl border-white/15 bg-white/10 text-[var(--fg)] shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-[20px] transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-400/50 hover:text-indigo-400 hover:shadow-[0_12px_40px_rgba(99,102,241,0.25),inset_0_1px_0_rgba(255,255,255,0.2)]',
            triggerClassName,
          )}
        >
          <CircleUserRound size={18} strokeWidth={2} aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={cn('w-80 rounded-3xl border-[color:var(--border)] bg-[color:var(--panel)] p-2 text-[color:var(--fg)] shadow-[0_20px_60px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-[20px]', contentClassName)}>
        <DropdownMenuLabel className="rounded-2xl bg-[linear-gradient(135deg,rgba(99,102,241,0.08),rgba(168,85,247,0.08))] p-0 text-inherit">
          <div className="flex items-center gap-4 p-5">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={displayName}
                width={52}
                height={52}
                className="h-13 w-13 shrink-0 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#6366f1_0%,#a855f7_100%)] text-lg font-semibold text-white shadow-[0_8px_20px_rgba(99,102,241,0.3)]">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-[color:var(--fg)]">{displayName}</div>
              {email ? <div className="truncate text-xs text-[color:var(--muted)] opacity-80">{email}</div> : null}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="mx-0 my-2 bg-[color:var(--border)]" />
        <div className="grid gap-1 p-1">{children}</div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
