'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { Lock, Save, Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function StudentSettingsPage() {
    const [saving, setSaving] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    })
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleSavePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess(false)

        if (formData.password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.')
            return
        }

        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem.')
            return
        }

        setSaving(true)

        try {
            const { error } = await supabase.auth.updateUser({
                password: formData.password
            })

            if (error) throw error

            setSuccess(true)
            setFormData({ password: '', confirmPassword: '' })
        } catch (error: any) {
            console.error('Error updating password:', error)
            setError(error.message || 'Erro ao atualizar senha.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
                <p className="text-gray-600">Gerencie sua segurança e preferências</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Lock className="h-5 w-5 mr-2" />
                        Segurança da Conta
                    </CardTitle>
                    <CardDescription>
                        Defina uma senha para acessar o sistema sem precisar de link mágico.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSavePassword} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm flex items-center">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Senha definida com sucesso! Você já pode usá-la em seu próximo login.
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Nova Senha</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-gray-400" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-gray-400" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                                <Input
                                    id="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    placeholder="Repita a senha"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={saving}>
                                <Save className="h-4 w-4 mr-2" />
                                {saving ? 'Salvando...' : 'Salvar Senha'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <Lock className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">Por que criar uma senha?</h3>
                            <div className="mt-2 text-sm text-blue-700 space-y-2">
                                <p>
                                    Ao criar uma senha, você não precisará mais aguardar por e-mails de link mágico para entrar no sistema.
                                </p>
                                <p>
                                    Basta usar seu e-mail e a senha cadastrada na página de login padrão.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
