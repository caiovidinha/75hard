'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useChallenge } from '@/lib/hooks/useChallenge'
import { LoadingOverlay } from '@/components/LoadingSpinner'
import type { DietConfig } from '@/lib/types'

export default function NewChallengePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { createChallenge } = useChallenge()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Diet config state
  const [dietConfig, setDietConfig] = useState<DietConfig>({
    dailyCalories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65,
    tolerance: 10,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('Você precisa estar logado para iniciar um desafio')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const newChallenge = await createChallenge({
        dietConfig,
        startDate: new Date(),
        status: 'active',
        currentDay: 1,
      })

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Error creating challenge:', err)
      setError(err.message || 'Erro ao criar desafio. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof DietConfig, value: string) => {
    const numValue = parseInt(value) || 0
    setDietConfig(prev => {
      const updated = { ...prev, [field]: numValue }
      
      // Recalcular calorias baseado nos macros (Proteína: 4kcal/g, Carbs: 4kcal/g, Gordura: 9kcal/g)
      if (field !== 'dailyCalories') {
        updated.dailyCalories = (updated.protein * 4) + (updated.carbs * 4) + (updated.fat * 9)
      }
      
      return updated
    })
  }

  // Calcular calorias dos macros atuais
  const calculatedCalories = (dietConfig.protein * 4) + (dietConfig.carbs * 4) + (dietConfig.fat * 9)

  return (
    <>
      {loading && <LoadingOverlay text="Criando seu desafio..." />}
      
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-2"
          >
            ← Voltar
          </button>
          <h1 className="text-4xl font-bold mb-2">Iniciar 75 Hard Challenge</h1>
          <p className="text-muted-foreground">
            Configure sua dieta e comece sua jornada de transformação
          </p>
        </div>

        {/* Form */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Diet Config Section */}
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold mb-4">Configuração da Dieta</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure seus macros. As calorias serão calculadas automaticamente (Proteína: 4kcal/g, Carbs: 4kcal/g, Gordura: 9kcal/g)
                </p>
                
                {/* Protein */}
                <div>
                  <label htmlFor="protein" className="block text-sm font-medium mb-2">
                    Proteína (g)
                  </label>
                  <input
                    id="protein"
                    type="number"
                    value={dietConfig.protein}
                    onChange={(e) => handleInputChange('protein', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                    min="50"
                    max="500"
                    step="5"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Meta diária de proteína em gramas
                  </p>
                </div>

                {/* Carbs */}
                <div>
                  <label htmlFor="carbs" className="block text-sm font-medium mb-2">
                    Carboidratos (g)
                  </label>
                  <input
                    id="carbs"
                    type="number"
                    value={dietConfig.carbs}
                    onChange={(e) => handleInputChange('carbs', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                    min="50"
                    max="500"
                    step="5"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Meta diária de carboidratos em gramas
                  </p>
                </div>

                {/* Fat */}
                <div>
                  <label htmlFor="fat" className="block text-sm font-medium mb-2">
                    Gordura (g)
                  </label>
                  <input
                    id="fat"
                    type="number"
                    value={dietConfig.fat}
                    onChange={(e) => handleInputChange('fat', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                    min="20"
                    max="200"
                    step="5"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Meta diária de gordura em gramas
                  </p>
                </div>

                {/* Tolerance */}
                <div>
                  <label htmlFor="tolerance" className="block text-sm font-medium mb-2">
                    Tolerância da Dieta (%)
                  </label>
                  <input
                    id="tolerance"
                    type="number"
                    value={dietConfig.tolerance}
                    onChange={(e) => handleInputChange('tolerance', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                    min="0"
                    max="20"
                    step="1"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Margem de tolerância para calorias (ex: 10% = {Math.round(calculatedCalories * 0.1)} kcal de margem)
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    ⚠️ Calorias permitidas: {Math.round(calculatedCalories * (1 - dietConfig.tolerance/100))} - {Math.round(calculatedCalories * (1 + dietConfig.tolerance/100))} kcal
                  </p>
                </div>
              </div>

              {/* Rules Reminder */}
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <h3 className="font-semibold mb-2">📋 Regras do 75 Hard</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>✓ Seguir uma dieta (sem álcool, sem cheat meals)</li>
                  <li>✓ Dois treinos de 45 minutos (um ao ar livre)</li>
                  <li>✓ Beber 3,78L de água por dia</li>
                  <li>✓ Ler 10 páginas de um livro de desenvolvimento</li>
                  <li>✓ Tirar uma foto de progresso diariamente</li>
                </ul>
              </div>

              {/* Summary */}
              <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                <h3 className="font-semibold mb-2">📊 Resumo da Dieta</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Calorias Totais</p>
                    <p className="font-semibold">{calculatedCalories} kcal</p>
                    <p className="text-xs text-muted-foreground">Calculado automaticamente</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Proteína</p>
                    <p className="font-semibold">{dietConfig.protein}g ({Math.round((dietConfig.protein * 4 / calculatedCalories) * 100)}%)</p>
                    <p className="text-xs text-muted-foreground">{dietConfig.protein * 4} kcal</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Carboidratos</p>
                    <p className="font-semibold">{dietConfig.carbs}g ({Math.round((dietConfig.carbs * 4 / calculatedCalories) * 100)}%)</p>
                    <p className="text-xs text-muted-foreground">{dietConfig.carbs * 4} kcal</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gordura</p>
                    <p className="font-semibold">{dietConfig.fat}g ({Math.round((dietConfig.fat * 9 / calculatedCalories) * 100)}%)</p>
                    <p className="text-xs text-muted-foreground">{dietConfig.fat * 9} kcal</p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Iniciando Desafio...' : '🚀 Iniciar 75 Hard Challenge'}
              </button>
            </form>
          </div>

          {/* Warning */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>⚠️ Ao iniciar, você se compromete a seguir todas as regras por 75 dias consecutivos.</p>
            <p>Qualquer falha reinicia o contador do zero!</p>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
