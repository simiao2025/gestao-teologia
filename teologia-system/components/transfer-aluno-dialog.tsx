'use client'

import React, { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'

interface Subnucleo {
    id: string
    nome: string
}

interface TransferAlunoDialogProps {
    isOpen: boolean
    onClose: () => void
    alunoId: string
    alunoNome: string
    currentSubnucleoId: string
    onSuccess: () => void
}

export function TransferAlunoDialog({
    isOpen,
    onClose,
    alunoId,
    alunoNome,
    currentSubnucleoId,
    onSuccess
}: TransferAlunoDialogProps) {
    const [subnucleos, setSubnucleos] = useState<Subnucleo[]>([])
    const [selectedSubnucleo, setSelectedSubnucleo] = useState(currentSubnucleoId)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (isOpen) {
            loadSubnucleos()
            setSelectedSubnucleo(currentSubnucleoId)
            setError('')
        }
    }, [isOpen, currentSubnucleoId])

    const loadSubnucleos = async () => {
        const { data } = await supabase
            .from('subnucleos')
            .select('id, nome')
            .order('nome')

        if (data) setSubnucleos(data)
    }

    const handleTransfer = async () => {
        if (!selectedSubnucleo) return
        if (selectedSubnucleo === currentSubnucleoId) {
            onClose()
            return
        }

        try {
            setLoading(true)
            const { error } = await supabase
                .from('alunos')
                .update({ subnucleo_id: selectedSubnucleo })
                .eq('id', alunoId)

            if (error) throw error

            onSuccess()
            onClose()
        } catch (err: any) {
            setError('Erro ao transferir: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Transferir Aluno</DialogTitle>
                    <DialogDescription>
                        Mover <strong>{alunoNome}</strong> para outro subnúcleo.
                        <br />
                        <span className="text-yellow-600 text-xs">
                            Nota: O histórico de disciplinas cursadas no subnúcleo anterior será preservado.
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Novo Subnúcleo</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedSubnucleo}
                            onChange={(e) => setSelectedSubnucleo(e.target.value)}
                            disabled={loading}
                        >
                            <option value="">Selecione...</option>
                            {subnucleos.map((sub) => (
                                <option key={sub.id} value={sub.id}>
                                    {sub.nome}
                                </option>
                            ))}
                        </select>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm bg-red-50 p-2 rounded">
                            {error}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleTransfer} disabled={loading || !selectedSubnucleo || selectedSubnucleo === currentSubnucleoId}>
                        {loading ? 'Transferindo...' : 'Confirmar Transferência'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
