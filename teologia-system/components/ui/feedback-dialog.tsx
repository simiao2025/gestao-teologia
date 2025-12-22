'use client'

import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
    CheckCircle2,
    AlertCircle,
    Info,
    XCircle,
    Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type FeedbackType = 'success' | 'error' | 'info' | 'warning' | 'loading'

interface FeedbackDialogProps {
    isOpen: boolean
    onClose: () => void
    title: string
    message: string
    type?: FeedbackType
    buttonText?: string
}

export function FeedbackDialog({
    isOpen,
    onClose,
    title,
    message,
    type = 'info',
    buttonText = 'Entendido'
}: FeedbackDialogProps) {

    const icons = {
        success: <CheckCircle2 className="h-12 w-12 text-green-500" />,
        error: <XCircle className="h-12 w-12 text-red-500" />,
        warning: <AlertCircle className="h-12 w-12 text-amber-500" />,
        info: <Info className="h-12 w-12 text-blue-500" />,
        loading: <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
    }

    const colors = {
        success: "text-green-600",
        error: "text-red-600",
        warning: "text-amber-600",
        info: "text-blue-600",
        loading: "text-blue-600"
    }

    const bgColors = {
        success: "bg-green-50",
        error: "bg-red-50",
        warning: "bg-amber-50",
        info: "bg-blue-50",
        loading: "bg-blue-50"
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[400px] text-center p-8 overflow-hidden border-none shadow-2xl">
                {/* Background Decor */}
                <div className={cn("absolute top-0 left-0 w-full h-2",
                    type === 'success' ? "bg-green-500" :
                        type === 'error' ? "bg-red-500" :
                            type === 'warning' ? "bg-amber-500" : "bg-blue-500"
                )} />

                <div className="flex flex-col items-center justify-center space-y-6 py-4">
                    <div className={cn("p-4 rounded-full", bgColors[type])}>
                        {icons[type]}
                    </div>

                    <DialogHeader className="space-y-2">
                        <DialogTitle className={cn("text-2xl font-bold text-center", colors[type])}>
                            {title}
                        </DialogTitle>
                        <DialogDescription className="text-center text-gray-600 text-lg leading-relaxed">
                            {message}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <DialogFooter className="sm:justify-center mt-6">
                    {type !== 'loading' && (
                        <Button
                            onClick={onClose}
                            className={cn(
                                "min-w-[140px] h-11 text-base font-semibold transition-all hover:scale-105 active:scale-95",
                                type === 'success' ? "bg-green-600 hover:bg-green-700" :
                                    type === 'error' ? "bg-red-600 hover:bg-red-700" :
                                        type === 'warning' ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"
                            )}
                        >
                            {buttonText}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
