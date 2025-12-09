'use client'

import React, { useState, useEffect } from 'react'
import Layout from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { formatDate, maskCpf, maskPhone, formatCurrency } from '@/lib/utils'
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Users,
  Filter
} from 'lucide-react'

interface AlunoWithDetails {
  id: string
  nome: string
  email: string
  telefone: string
  cpf: string
  data_nascimento: string
  endereco: string
  status: 'ativo' | 'trancado' | 'concluído'
  subnucleo_id: string
  subnucleo_nome?: string
  criado_em: string
}

export default function AlunosPage() {
  const [alunos, setAlunos] = useState<AlunoWithDetails[]>([])
  const [subnucleos, setSubnucleos] = useState<any[]>([])
  const [filteredAlunos, setFilteredAlunos] = useState<AlunoWithDetails[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [subnucleoFilter, setSubnucleoFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAlunos()
    loadSubnucleos()
  }, [])

  useEffect(() => {
    filterAlunos()
  }, [alunos, searchTerm, statusFilter, subnucleoFilter])

  const loadAlunos = async () => {
    try {
      const { data, error } = await supabase
        .from('alunos')
        .select(`
          *,
          usuarios (
            nome,
            email,
            telefone
          ),
          subnucleos (
            nome
          )
        `)
        .order('criado_em', { ascending: false })

      if (error) {
        console.error('Erro ao carregar alunos:', error)
        return
      }

      const alunosFormatados = data?.map(aluno => ({
        id: aluno.id,
        nome: aluno.usuarios?.nome || '',
        email: aluno.usuarios?.email || '',
        telefone: aluno.usuarios?.telefone || '',
        cpf: aluno.cpf,
        data_nascimento: aluno.data_nascimento,
        endereco: aluno.endereco,
        status: aluno.status,
        subnucleo_id: aluno.subnucleo_id,
        subnucleo_nome: aluno.subnucleos?.nome,
        criado_em: aluno.criado_em
      })) || []

      setAlunos(alunosFormatados)
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSubnucleos = async () => {
    try {
      const { data } = await supabase
        .from('subnucleos')
        .select('*')
        .order('nome')

      setSubnucleos(data || [])
    } catch (error) {
      console.error('Erro ao carregar subnúcleos:', error)
    }
  }

  const filterAlunos = () => {
    let filtered = alunos

    if (searchTerm) {
      filtered = filtered.filter(aluno =>
        aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aluno.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aluno.cpf.includes(searchTerm)
      )
    }

    if (statusFilter) {
      filtered = filtered.filter(aluno => aluno.status === statusFilter)
    }

    if (subnucleoFilter) {
      filtered = filtered.filter(aluno => aluno.subnucleo_id === subnucleoFilter)
    }

    setFilteredAlunos(filtered)
  }

  const deleteAluno = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este aluno?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('alunos')
        .delete()
        .eq('id', id)

      if (error) {
        alert('Erro ao excluir aluno: ' + error.message)
        return
      }

      setAlunos(alunos.filter(a => a.id !== id))
      alert('Aluno excluído com sucesso!')
    } catch (error) {
      alert('Erro interno do servidor')
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Carregando alunos...</span>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gerenciar Alunos</h1>
            <p className="text-gray-600">Visualize e gerencie os alunos do curso</p>
          </div>
          <Button asChild>
            <a href="/dashboard/alunos/novo">
              <Plus className="h-4 w-4 mr-2" />
              Novo Aluno
            </a>
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Alunos</p>
                  <p className="text-2xl font-bold">{alunos.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">A</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ativos</p>
                  <p className="text-2xl font-bold">
                    {alunos.filter(a => a.status === 'ativo').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-bold">T</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Trancados</p>
                  <p className="text-2xl font-bold">
                    {alunos.filter(a => a.status === 'trancado').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">C</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Concluídos</p>
                  <p className="text-2xl font-bold">
                    {alunos.filter(a => a.status === 'concluído').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Nome, email ou CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Todos os status</option>
                  <option value="ativo">Ativo</option>
                  <option value="trancado">Trancado</option>
                  <option value="concluído">Concluído</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Subnúcleo</label>
                <select
                  value={subnucleoFilter}
                  onChange={(e) => setSubnucleoFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Todos os subnúcleos</option>
                  {subnucleos.map((subnucleo) => (
                    <option key={subnucleo.id} value={subnucleo.id}>
                      {subnucleo.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alunos List */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Alunos ({filteredAlunos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAlunos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Aluno</th>
                      <th className="text-left p-3">Contato</th>
                      <th className="text-left p-3">Subnúcleo</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Data Matrícula</th>
                      <th className="text-left p-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlunos.map((aluno) => (
                      <tr key={aluno.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{aluno.nome}</p>
                            <p className="text-sm text-gray-500">{maskCpf(aluno.cpf)}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="text-sm">{aluno.email}</p>
                            <p className="text-sm text-gray-500">{maskPhone(aluno.telefone)}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-sm">{aluno.subnucleo_nome || 'Não informado'}</span>
                        </td>
                        <td className="p-3">
                          <StatusBadge status={aluno.status} />
                        </td>
                        <td className="p-3">
                          <span className="text-sm">{formatDate(aluno.criado_em)}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => deleteAluno(aluno.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum aluno encontrado</p>
                {alunos.length === 0 && (
                  <p className="text-sm text-gray-400 mt-2">
                    Comece cadastrando o primeiro aluno
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}