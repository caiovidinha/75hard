# Próximos Passos - Implementação da UI

## 🎯 Objetivo

A **infraestrutura completa** está pronta:
- ✅ Arquitetura offline-first
- ✅ Firebase configurado
- ✅ Security Rules restritivas
- ✅ IndexedDB + Sincronização
- ✅ Validações automáticas
- ✅ Services de negócio

Falta apenas criar a **interface de usuário** (UI).

## 📋 Checklist de Implementação

### 1. Instalar Dependências

```bash
npm install
```

Isso instalará todas as dependências do `package.json`.

### 2. Criar Componentes UI Base (Shadcn)

```bash
# Instalar CLI do Shadcn
npx shadcn-ui@latest init

# Adicionar componentes necessários
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add form
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add select
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add separator
```

### 3. Criar Context Providers

#### `src/lib/context/AuthContext.tsx`

```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthChange } from '@/lib/firebase/auth'
import type { User, AuthContextType } from '@/lib/types'
import { initDB } from '@/lib/indexeddb/db'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialize IndexedDB
    initDB()

    // Subscribe to auth changes
    const unsubscribe = onAuthChange((user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
```

#### `src/lib/context/SyncContext.tsx`

```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { syncManager } from '@/lib/sync/sync-manager'
import type { SyncContextType } from '@/lib/types'

const SyncContext = createContext<SyncContextType | undefined>(undefined)

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(syncManager.getIsOnline())
  const [isSyncing, setIsSyncing] = useState(syncManager.getIsSyncing())
  const [pendingItems, setPendingItems] = useState(0)

  useEffect(() => {
    const unsubscribe = syncManager.subscribe((online, syncing) => {
      setIsOnline(online)
      setIsSyncing(syncing)
    })

    return () => unsubscribe()
  }, [])

  const sync = async () => {
    await syncManager.forceSyncNow()
  }

  return (
    <SyncContext.Provider value={{ isOnline, isSyncing, pendingItems, sync }}>
      {children}
    </SyncContext.Provider>
  )
}

export function useSync() {
  const context = useContext(SyncContext)
  if (!context) throw new Error('useSync must be used within SyncProvider')
  return context
}
```

### 4. Criar Layout Principal

#### `src/app/layout.tsx`

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/context/AuthContext'
import { SyncProvider } from '@/lib/context/SyncContext'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '75 Hard Challenge',
  description: 'PWA para tracking rigoroso do desafio 75 Hard',
  manifest: '/manifest.json',
  themeColor: '#1a1a1a',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          <SyncProvider>
            {children}
            <Toaster />
          </SyncProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
```

### 5. Estrutura de Páginas Sugerida

```
src/app/
├── layout.tsx                 # Root layout
├── page.tsx                   # Home/Landing
├── (auth)/
│   ├── layout.tsx            # Auth layout (sem navegação)
│   ├── login/
│   │   └── page.tsx         # Login page
│   └── register/
│       └── page.tsx         # Register page
└── (app)/
    ├── layout.tsx            # App layout (com navegação)
    ├── dashboard/
    │   └── page.tsx         # Dashboard principal
    ├── challenge/
    │   ├── new/
    │   │   └── page.tsx     # Criar novo desafio
    │   └── [id]/
    │       └── page.tsx     # Detalhes do desafio
    ├── daily/
    │   └── page.tsx         # Registro diário (hub principal)
    ├── progress/
    │   └── page.tsx         # Gráficos e progresso
    └── settings/
        └── page.tsx         # Configurações
```

### 6. Exemplo de Página Daily (Principal)

#### `src/app/(app)/daily/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/context/AuthContext'
import { getTodayString } from '@/lib/utils/date'
import { getDayData } from '@/lib/indexeddb/operations'
import { Card } from '@/components/ui/card'
import { DietSection } from '@/components/daily/DietSection'
import { WorkoutsSection } from '@/components/daily/WorkoutsSection'
import { WaterSection } from '@/components/daily/WaterSection'
import { ReadingSection } from '@/components/daily/ReadingSection'
import { PhotoSection } from '@/components/daily/PhotoSection'
import { DiarySection } from '@/components/daily/DiarySection'
import { ComplianceCard } from '@/components/daily/ComplianceCard'

export default function DailyPage() {
  const { user } = useAuth()
  const [date] = useState(getTodayString())
  const [dayData, setDayData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function loadData() {
      const data = await getDayData(user!.id, date)
      setDayData(data)
      setLoading(false)
    }

    loadData()
  }, [user, date])

  if (loading) {
    return <div>Carregando...</div>
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Registro Diário</h1>
      
      {/* Compliance Card */}
      <ComplianceCard dayData={dayData} />

      {/* Diet */}
      <DietSection date={date} logs={dayData.nutritionLogs} />

      {/* Workouts */}
      <WorkoutsSection date={date} workouts={dayData.workouts} />

      {/* Water */}
      <WaterSection date={date} waterLogs={dayData.waterLogs} />

      {/* Reading */}
      <ReadingSection date={date} readingLogs={dayData.readingLogs} />

      {/* Photo */}
      <PhotoSection date={date} photo={dayData.photo} />

      {/* Diary */}
      <DiarySection date={date} entry={dayData.diaryEntry} />
    </div>
  )
}
```

### 7. Exemplo de Componente de Dieta

#### `src/components/daily/DietSection.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Plus } from 'lucide-react'
import type { NutritionLog } from '@/lib/types'
import { calculateDailyNutritionTotal, calculateNutritionCompliance } from '@/lib/utils/calculations'

interface DietSectionProps {
  date: string
  logs: NutritionLog[]
}

export function DietSection({ date, logs }: DietSectionProps) {
  const [showForm, setShowForm] = useState(false)

  // Buscar config da dieta do challenge atual
  const dietConfig = { dailyCalories: 2000, protein: 150, carbs: 200, fat: 65 }
  
  const total = calculateDailyNutritionTotal(logs)
  const compliance = calculateNutritionCompliance(total, dietConfig)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Dieta</span>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Calorias */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Calorias</span>
            <span className={compliance.calories.exceeded ? 'text-destructive' : ''}>
              {compliance.calories.consumed} / {compliance.calories.limit}
            </span>
          </div>
          <Progress value={compliance.calories.percentage} />
        </div>

        {/* Proteína */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Proteína</span>
            <span className={compliance.protein.exceeded ? 'text-destructive' : ''}>
              {compliance.protein.consumed}g / {compliance.protein.limit}g
            </span>
          </div>
          <Progress value={compliance.protein.percentage} />
        </div>

        {/* Carboidratos */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Carboidratos</span>
            <span className={compliance.carbs.exceeded ? 'text-destructive' : ''}>
              {compliance.carbs.consumed}g / {compliance.carbs.limit}g
            </span>
          </div>
          <Progress value={compliance.carbs.percentage} />
        </div>

        {/* Gordura */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Gordura</span>
            <span className={compliance.fat.exceeded ? 'text-destructive' : ''}>
              {compliance.fat.consumed}g / {compliance.fat.limit}g
            </span>
          </div>
          <Progress value={compliance.fat.percentage} />
        </div>

        {/* Lista de refeições */}
        <div className="mt-4 space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="text-sm border-l-2 pl-3 py-1">
              <div className="font-medium">{log.mealName || 'Refeição'}</div>
              <div className="text-muted-foreground">
                {log.calories} cal • {log.protein}g P • {log.carbs}g C • {log.fat}g G
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

## 🎨 Dicas de Implementação

### 1. Use os Services Criados

Todos os services estão prontos em `src/lib/services/`:
- `validation.service.ts` - Validações completas
- Você pode criar mais: `challenge.service.ts`, `diet.service.ts`, etc.

### 2. Use os Utils

Utilitários prontos em `src/lib/utils/`:
- `calculations.ts` - Cálculos de compliance
- `date.ts` - Manipulação de datas

### 3. Trabalhe Offline-First

Sempre salve no IndexedDB primeiro:

```typescript
import { create } from '@/lib/indexeddb/operations'
import { addToSyncQueue } from '@/lib/sync/sync-queue'

async function saveMeal(mealData) {
  // 1. Salva localmente
  await create(STORES.NUTRITION_LOGS, mealData)
  
  // 2. Adiciona à fila de sync
  await addToSyncQueue('create', COLLECTIONS.NUTRITION_LOGS, mealData)
  
  // 3. UI já atualiza instantaneamente
  // A sincronização acontece em background
}
```

### 4. Mostre Status de Sync

```typescript
import { useSync } from '@/lib/context/SyncContext'

export function SyncIndicator() {
  const { isOnline, isSyncing } = useSync()

  return (
    <div className="fixed bottom-4 right-4">
      {!isOnline && (
        <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg">
          📡 Offline
        </div>
      )}
      {isSyncing && (
        <div className="bg-blue-500 text-white px-4 py-2 rounded-lg">
          ⏳ Sincronizando...
        </div>
      )}
    </div>
  )
}
```

## 🔗 Recursos Úteis

- [Next.js Docs](https://nextjs.org/docs)
- [Shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Firebase Web SDK](https://firebase.google.com/docs/web/setup)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)

## 🚀 Ordem Sugerida de Implementação

1. ✅ Auth pages (login, register) - **Mais fácil**
2. ✅ Dashboard simples - **Mostra desafio ativo**
3. ✅ Criar novo desafio - **Com formulário de dieta**
4. ✅ Página daily (registro diário) - **Core do app**
5. ✅ Componentes de cada seção - **Diet, Workouts, etc**
6. ✅ Página de progresso - **Gráficos e histórico**
7. ✅ Validação de compliance - **Usar services prontos**
8. ✅ Feedback visual - **Toasts, alerts**
9. ✅ Refinamentos UX - **Loading states, empty states**
10. ✅ Testes - **Fluxo completo end-to-end**

## 💡 Exemplo de Hook Customizado

```typescript
// src/lib/hooks/useDailyData.ts
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/context/AuthContext'
import { getDayData } from '@/lib/indexeddb/operations'
import type { DailySummary } from '@/lib/types'

export function useDailyData(date: string) {
  const { user } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function load() {
      const dayData = await getDayData(user!.id, date)
      setData(dayData)
      setLoading(false)
    }

    load()
  }, [user, date])

  const refresh = async () => {
    if (!user) return
    const dayData = await getDayData(user.id, date)
    setData(dayData)
  }

  return { data, loading, refresh }
}
```

## ✨ Conclusão

Você tem uma **base sólida** e **produção-ready**:
- Toda lógica de negócio implementada
- Sistema offline-first robusto
- Validações automáticas
- Security rules restritivas
- Sincronização inteligente

Agora é só criar a UI conectando aos services prontos!

**Boa sorte com o projeto! 💪**
