'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Theme = 'light' | 'dark'

interface ThemeContextType {
    theme: Theme
    setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('light')

    useEffect(() => {
        // 1. Carregar tema inicial do banco de dados
        const loadTheme = async () => {
            try {
                const { data, error } = await supabase
                    .from('config_sistema')
                    .select('tema')
                    .limit(1)
                    .maybeSingle()

                if (data?.tema) {
                    applyTheme(data.tema as Theme)
                }
            } catch (err) {
                console.error('Erro ao carregar tema:', err)
            }
        }

        loadTheme()

        // 2. Escutar mudanças em tempo real na tabela de configurações
        const channel = supabase
            .channel('theme_changes')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'config_sistema' },
                (payload) => {
                    if (payload.new && payload.new.tema) {
                        applyTheme(payload.new.tema as Theme)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const applyTheme = (newTheme: Theme) => {
        setThemeState(newTheme)
        const root = window.document.documentElement
        root.classList.remove('light', 'dark')
        root.classList.add(newTheme)
    }

    const setTheme = (newTheme: Theme) => {
        applyTheme(newTheme)
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeContext)
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}
