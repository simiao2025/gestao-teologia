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
                const response = await fetch('/api/pix/mp-criar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        pedidoId: pedido.id,
                        userEmail: user.email,
                        userName: user.user_metadata?.nome || user.email
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
                <DialogHeader>
                    <DialogTitle>
                        {paymentStatus === 'approved' ? 'Pagamento Confirmado!' : 'Pagamento via PIX'}
                    </DialogTitle>
                    <DialogDescription>
                        {paymentStatus === 'approved'
                            ? 'Obrigado! Seu pagamento foi processado com sucesso.'
                            : 'Escaneie o QR Code abaixo ou utilize o "Copia e Cola" para pagar.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center p-4">
                    {paymentStatus === 'approved' ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in zoom-in duration-300">
                            <CheckCircle2 className="h-20 w-20 text-green-500" />
                            <p className="text-xl font-bold text-gray-900 text-center">Tudo certo!</p>
                            <p className="text-sm text-gray-500 text-center">
                                Redirecionando você em instantes...
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-white p-4 rounded-lg shadow-sm border mb-4 relative min-h-[232px] min-w-[232px] flex items-center justify-center">
                                {loading ? (
                                    <div className="flex flex-col items-center space-y-2">
                                        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                                        <span className="text-xs text-gray-500">Gerando QR Code...</span>
                                    </div>
                                ) : qrCodeData ? (
                                    <img src={qrCodeData} alt="QR Code PIX Mercado Pago" className="w-[200px] h-[200px]" />
                                ) : (
                                    <div className="h-[200px] w-[200px] flex items-center justify-center bg-gray-100 rounded-md">
                                        <span className="text-gray-400 text-xs text-center px-4">
                                            Não foi possível gerar o QR Code. Tente novamente.
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="w-full space-y-2">
                                <p className="text-sm font-medium text-center text-gray-700">
                                    Valor: R$ {Number(pedido?.valor).toFixed(2).replace('.', ',')}
                                </p>
                                <div className="flex flex-col space-y-2">
                                    <Button
                                        variant="outline"
                                        className="w-full relative"
                                        onClick={handleCopy}
                                        disabled={!copiaCola}
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="h-4 w-4 mr-2 text-green-600" />
                                                Copiado!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-4 w-4 mr-2" />
                                                Copiar Código PIX
                                            </>
                                        )}
                                    </Button>

                                    <div className="flex items-center justify-center space-x-2 text-[10px] text-gray-400 pt-2 italic">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        <span>Aguardando confirmação do pagamento...</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Fechar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

