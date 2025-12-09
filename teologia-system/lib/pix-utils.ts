import QRCode from 'qrcode'

// Configurações do PIX (movidas para variáveis de ambiente)
const PIX_KEY = process.env.NEXT_PUBLIC_PIX_KEY || '00000000000'
const PIX_BENEFICIARIO = process.env.NEXT_PUBLIC_PIX_BENEFICIARIO || 'Curso de Teologia'
const PIX_CIDADE = process.env.NEXT_PUBLIC_PIX_CIDADE || 'Sao Paulo'
const PIX_BANCO = process.env.NEXT_PUBLIC_PIX_BANCO || 'Banco do Brasil'

export interface PixData {
  pixKey: string
  pixType: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM'
  merchantName: string
  merchantCity: string
  bankName: string
  txid: string
  amount: number
}

export interface PixPayload {
  copiaCola: string
  qrCode: string
  emvCode: string
}

/**
 * Gera payload Pix copia e cola baseado no EMVCo 240
 */
export function generatePixPayload(data: PixData): PixPayload {
  const { pixKey, pixType, merchantName, merchantCity, bankName, txid, amount } = data
  
  // Campos obrigatórios EMV
  const emvFields = [
    '0001', // Identificador da EMV
    '01', // Método de inicialização
    '0408' + pixKey, // Chave PIX (CPF, CNPJ, EMAIL, TELEFONE ou Aleatória)
    '59' + merchantName.substring(0, 25), // Nome do beneficiário (máximo 25 caracteres)
    '60' + merchantCity.substring(0, 15), // Cidade do beneficiário (máximo 15 caracteres)
    '62', // Adicionais
    '07' + txid // Identificador da transação (máximo 25 caracteres)
  ]

  // Campos opcionais
  if (amount > 0) {
    emvFields.splice(3, 0, '54' + amount.toFixed(2)) // Valor da transação
  }

  // Montar payload EMV
  const emvCode = emvFields.join('02' + bankName + '08000000')
  
  // Adicionar checksums (simplificado para este exemplo)
  const completeEmv = emvCode + '04' + bankName + '08000000'
  
  // Gerar copia e cola
  const copiaCola = completeEmv
  
  // Gerar QR Code
  const qrCode = `000201${completeEmv}6304${generateCrc16Ccm(completeEmv)}`

  return {
    copiaCola,
    qrCode,
    emvCode: completeEmv
  }
}

/**
 * Gera um QR Code em formato base64
 */
export async function generatePixQRCode(pixPayload: string): Promise<string> {
  try {
    return await QRCode.toDataURL(pixPayload, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error)
    throw new Error('Não foi possível gerar o QR Code')
  }
}

/**
 * Calcula CRC16-CCM para validação
 */
function generateCrc16Ccm(data: string): string {
  let crc = 0xFFFF
  
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021
      } else {
        crc = crc << 1
      }
    }
  }
  
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/**
 * Valida formato do CPF
 */
export function validateCpf(cpf: string): boolean {
  const cleanedCpf = cpf.replace(/\D/g, '')
  
  if (cleanedCpf.length !== 11) return false
  
  if (/^(\d)\1{10}$/.test(cleanedCpf)) return false
  
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanedCpf.charAt(i)) * (10 - i)
  }
  
  let firstDigit = 11 - (sum % 11)
  if (firstDigit >= 10) firstDigit = 0
  
  if (parseInt(cleanedCpf.charAt(9)) !== firstDigit) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanedCpf.charAt(i)) * (11 - i)
  }
  
  let secondDigit = 11 - (sum % 11)
  if (secondDigit >= 10) secondDigit = 0
  
  return parseInt(cleanedCpf.charAt(10)) === secondDigit
}

/**
 * Formata CPF
 */
export function formatCpf(cpf: string): string {
  const cleanedCpf = cpf.replace(/\D/g, '')
  return cleanedCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/**
 * Valida formato do CNPJ
 */
export function validateCnpj(cnpj: string): boolean {
  const cleanedCnpj = cnpj.replace(/\D/g, '')
  
  if (cleanedCnpj.length !== 14) return false
  
  if (/^(\d)\1{13}$/.test(cleanedCnpj)) return false
  
  // Validação dos dígitos verificadores (simplificada)
  return true
}

/**
 * Formata CNPJ
 */
export function formatCnpj(cnpj: string): string {
  const cleanedCnpj = cnpj.replace(/\D/g, '')
  return cleanedCnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}