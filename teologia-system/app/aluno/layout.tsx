'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import StudentLayout from '@/components/student-layout'

export default function AlunoRootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const checkUser = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()

                if (!session) {
                    router.push('/login?type=aluno')
                    return
                }

                // Fetch user details to confirm role
                // Primeiro por ID
                let { data: usuario, error: userError } = await supabase
                    .from('usuarios')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle()

                // Fallback por email
                if (!usuario && !userError) {
                    console.log('Aluno root layout: user not found by ID, trying by email:', session.user.email)
                    const { data: byEmail } = await supabase
                        .from('usuarios')
                        .select('*')
                        .eq('email', session.user.email)
                        .maybeSingle()
                    usuario = byEmail
                }

                if (!usuario) {
                    console.error('Error fetching user or not found:', userError)
                    router.push('/login?type=aluno')
                    return
                }

                if (usuario.tipo !== 'aluno') {
                    // Redirect if not an student (or handle accordingly)
                    // For now, strict redirect
                    router.push('/login?type=aluno')
                    return
                }

                setUser(usuario)
            } catch (error) {
                console.error('Auth check error:', error)
                router.push('/login?type=aluno')
            } finally {
                setLoading(false)
            }
        }

        checkUser()
    }, [router])

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut()
            router.push('/login?type=aluno')
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <StudentLayout user={user} onLogout={handleLogout}>
            {children}
        </StudentLayout>
    )
}
