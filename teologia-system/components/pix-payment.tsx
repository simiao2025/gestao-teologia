'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { generatePixPayload, generatePixQRCode } from '@/lib/pix-utils'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { QrCode, Copy, CheckCircle } from 'lucide-react'

interface PixPaymentProps {
  pedidoId: string
  valor: number
  onPaymentConfirmed?: () => void
}

export default function PixPayment({ pedidoId, valor, onPaymentConfirmed }: PixPaymentProps) {
  const [pixData, setPixData] = useState<any>(null)
  const [qrCode, setQrCode] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    generatePix()
  }, [pedidoId, valor])

  const generatePix = async () => {
    setLoading(true)
    try {
      const pixPayload = generatePixPayload({
        pixKey: process.env.NEXT_PUBLIC_PIX_KEY || '00000000000',
        pixType: 'CPF',
        merchantName: process.env.NEXT_PUBLIC_PIX_BENEFICIARIO || 'Curso de Teologia',
        merchantCity: process.env.NEXT_PUBLIC_PIX_CIDADE || 'Sao Paulo',
        bankName: process.env.NEXT_PUBLIC_PIX_BANCO || 'Banco do Brasil',
        txid: pedidoId,
        amount: valor
      })

      setPixData(pixPayload)
      
      // Gerar QR Code
      const qrCodeUrl = await generatePixQRCode(pixPayload.qrCode)
      setQrCode(qrCodeUrl)
      
    } catch (error) {
      console.error('Erro ao gerar Pix:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (pixData?.copiaCola) {
      try {
        await navigator.clipboard.writeText(pixData.copiaCola)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error('Erro ao copiar:', error)
      }
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Gerando PIX...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!pixData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Erro ao gerar PIX. Tente novamente.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <QrCode className="h-5 w-5 mr-2" />
          Pagamento via PIX
        </CardTitle>
        <CardDescription>
          Escaneie o QR Code ou copie o código para pagar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Valor */}
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(valor)}
          </div>
          <div className="text-sm text-gray-500">
            Valor a ser pago
          </div>
        </div>

        {/* QR Code */}
        <div className="flex justify-center">
          {qrCode ? (
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
              <img src={qrCode} alt="QR Code PIX" className="w-48 h-48" />
            </div>
          ) : (
            <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">QR Code não disponível</span>
            </div>
          )}
        </div>

        {/* Código copia e cola */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Código PIX (Copia e Cola)
          </label>
          <div className="flex">
            <textarea
              value={pixData.copiaCola}
              readOnly
              className="flex-1 p-3 border border-gray-300 rounded-l-md text-xs font-mono bg-gray-50 resize-none"
              rows={3}
            />
            <Button
              onClick={copyToClipboard}
              variant="outline"
              className="rounded-l-none"
            >
              {copied ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          {copied && (
            <p className="text-sm text-green-600">Código copiado!</p>
          )}
        </div>

        {/* Instruções */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="font-medium text-blue-900 mb-2">Como pagar:</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Abra o app do seu banco</li>
            <li>Vá em "PIX" ou "Pagar"</li>
            <li>Escaneie o QR Code ou cole o código</li>
            <li>Confirme o pagamento</li>
            <li>O status será atualizado automaticamente</li>
          </ol>
        </div>

        {/* Informações do recebedor */}
        <div className="bg-gray-50 rounded-md p-3">
          <h4 className="font-medium text-gray-900 mb-2">Dados do recebedor:</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div><strong>Nome:</strong> {process.env.NEXT_PUBLIC_PIX_BENEFICIARIO || 'Curso de Teologia'}</div>
            <div><strong>Banco:</strong> {process.env.NEXT_PUBLIC_PIX_BANCO || 'Banco do Brasil'}</div>
            <div><strong>Cidade:</strong> {process.env.NEXT_PUBLIC_PIX_CIDADE || 'Sao Paulo'}</div>
            <div><strong>TXID:</strong> {pedidoId}</div>
          </div>
        </div>

        {/* Avisos */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            O pagamento será identificado automaticamente pelo TXID.
            <br />
            Tempo limite: 30 minutos
          </p>
        </div>

        <div className="text-center">
          <Button variant="outline" onClick={generatePix}>
            Gerar novo PIX
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}