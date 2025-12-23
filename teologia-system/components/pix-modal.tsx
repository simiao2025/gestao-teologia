import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Copy, Check, Loader2, CheckCircle2 } from 'lucide-react'

interface PixModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    pedido: any
    user: any
    onPaymentSuccess?: () => void
}

export function PixModal({ open, onOpenChange, pedido, user, onPaymentSuccess }: PixModalProps) {
    const [qrCodeData, setQrCodeData] = useState<string | null>(null)
    const [copiaCola, setCopiaCola] = useState<string>('')
    const [copied, setCopied] = useState(false)
    const [loading, setLoading] = useState(false)
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'approved'>('pending')

    // 1. Gerar Pix no Mercado Pago
    useEffect(() => {
        const generateMPPix = async () => {
            if (!open || !pedido || !user) return

            setLoading(true)
            setPaymentStatus('pending')
            try {
                // Obter Device ID para segurança/fraude (Aumenta o score de integração)
                let deviceId = ''
                if (typeof window !== 'undefined' && (window as any).MercadoPago) {
                    try {
                        const mp = new (window as any).MercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY)
                        // V2 usa getDeviceId() em vez de getFingerprint()
                        if (typeof mp.getDeviceId === 'function') {
                            deviceId = mp.getDeviceId()
                        }
                    } catch (e) {
                        console.error('Erro ao obter deviceId:', e)
                    }
                }

                const response = await fetch('/api/pix/mp-criar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        pedidoId: pedido.id,
                        userEmail: user.email,
                        userName: user.user_metadata?.nome || user.email,
                        deviceId: deviceId
                    })
                })

                if (!response.ok) throw new Error('Falha ao gerar PIX')

                const data = await response.json()
                setQrCodeData(`data:image/png;base64,${data.qrCodeBase64}`)
                setCopiaCola(data.qrCode)
            } catch (error) {
                console.error('Error generating MP PIX:', error)
            } finally {
                setLoading(false)
            }
        }

        generateMPPix()
    }, [open, pedido, user])

    // 2. Polling para checar status do pagamento
    useEffect(() => {
        let interval: NodeJS.Timeout

        if (open && pedido && paymentStatus === 'pending') {
            interval = setInterval(async () => {
                const { data, error } = await supabase
                    .from('pedidos')
                    .select('status')
                    .eq('id', pedido.id)
                    .single()

                if (error) {
                    console.error('Erro polling:', error)
                } else {
                    console.log('Polling Status do pedido', pedido.id, ':', data?.status)
                }

                if (data?.status === 'pago') {
                    setPaymentStatus('approved')
                    clearInterval(interval)
                    setTimeout(() => {
                        onPaymentSuccess?.()
                        onOpenChange(false)
                    }, 3000)
                }
            }, 5000) // Checar a cada 5 segundos
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [open, pedido, paymentStatus, onPaymentSuccess, onOpenChange])

    const handleCopy = () => {
        navigator.clipboard.writeText(copiaCola)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="flex flex-col items-center justify-center text-center space-y-1">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                        <img src="/icons/pix.png" alt="Logo PIX" className="h-6 w-auto" />
                        <DialogTitle className="text-xl font-bold text-gray-900 leading-none">
                            {paymentStatus === 'approved' ? 'Pagamento Confirmado!' : 'Pagamento via PIX'}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-sm text-gray-500 max-w-[280px]">
                        {paymentStatus === 'approved'
                            ? 'Obrigado! Seu pagamento foi processado com sucesso.'
                            : 'Escaneie o QR Code abaixo ou utilize o "Copia e Cola" para pagar.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center p-0 mt-4">
                    {paymentStatus === 'approved' ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in zoom-in duration-300">
                            <div className="h-24 w-24 rounded-full bg-green-50 flex items-center justify-center">
                                <CheckCircle2 className="h-16 w-16 text-green-500" />
                            </div>
                            <div className="space-y-1 text-center">
                                <p className="text-xl font-bold text-gray-900">Pagamento Aprovado!</p>
                                <p className="text-sm text-gray-500">
                                    Seu acesso será liberado em instantes...
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200"></div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 relative min-h-[248px] min-w-[248px] flex items-center justify-center overflow-hidden">
                                    {loading ? (
                                        <div className="flex flex-col items-center space-y-3">
                                            <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                                            <span className="text-xs font-medium text-gray-400">Gerando QR Code único...</span>
                                        </div>
                                    ) : qrCodeData ? (
                                        <div className="relative animate-in fade-in zoom-in duration-500">
                                            <img src={qrCodeData} alt="QR Code PIX Mercado Pago" className="w-[200px] h-[200px]" />
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-lg">
                                                <img src="/icons/pix.png" alt="Pix small" className="h-6 w-6 opacity-30" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-[200px] w-[200px] flex items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                            <span className="text-gray-400 text-xs text-center px-6 leading-relaxed">
                                                Não foi possível gerar o código. <br /> Por favor, feche e tente novamente.
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="w-full space-y-4 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                                <div className="flex flex-col items-center space-y-1">
                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Valor do Investimento</span>
                                    <p className="text-2xl font-black text-gray-900 tracking-tight">
                                        R$ {Number(pedido?.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>

                                <div className="flex flex-col space-y-2">
                                    <Button
                                        variant="default"
                                        className={`w-full h-11 transition-all duration-300 ${copied ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-900 hover:bg-black'} text-white font-semibold rounded-xl`}
                                        onClick={handleCopy}
                                        disabled={!copiaCola}
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="h-4 w-4 mr-2" />
                                                Código Copiado!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-4 w-4 mr-2" />
                                                Copiar Código PIX
                                            </>
                                        )}
                                    </Button>

                                    <div className="flex items-center justify-center space-x-2 text-[10px] text-gray-400 pt-1">
                                        <div className="flex space-x-1">
                                            <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                                            <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse delay-75"></div>
                                            <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse delay-150"></div>
                                        </div>
                                        <span className="font-medium">Validando pagamento automaticamente...</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter className="mt-4 sm:justify-center border-t pt-4">
                    <Button
                        variant="ghost"
                        className="text-gray-400 hover:text-gray-600 font-medium text-xs uppercase tracking-widest"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancelar Operação
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

