import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
    title: string
    description?: string
    icon?: LucideIcon
    backHref?: string
    backLabel?: string
    actions?: React.ReactNode
    className?: string
}

export function PageHeader({
    title,
    description,
    icon: Icon,
    backHref = '/dashboard',
    backLabel = 'Voltar',
    actions,
    className
}: PageHeaderProps) {
    return (
        <div className={cn('flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6', className)}>
            <div className="flex items-center gap-4">
                {backHref && (
                    <Button variant="outline" size="sm" asChild className="rounded-full flex items-center gap-1">
                        <Link href={backHref}>
                            <ChevronLeft className="h-4 w-4" /> {backLabel}
                        </Link>
                    </Button>
                )}
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                        {Icon && <Icon className="h-7 w-7 text-blue-600" />}
                        {title}
                    </h1>
                    {description && (
                        <p className="text-gray-600 mt-1">{description}</p>
                    )}
                </div>
            </div>
            {actions && (
                <div className="flex gap-2">
                    {actions}
                </div>
            )}
        </div>
    )
}
