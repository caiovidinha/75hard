# 75 Hard - Referência Rápida para Desenvolvedores

## 🚀 Quick Start

```bash
# 1. Instalar dependências
npm install

# 2. Configurar Firebase (já está em config.ts)
# Suas credenciais já estão configuradas!

# 3. Rodar em desenvolvimento
npm run dev

# 4. Build para produção
npm run build
npm start
```

## 📁 Arquivos Principais

### Lógica de Negócio
- **Validação 75 Hard**: `src/lib/services/validation.service.ts`
- **Cálculos**: `src/lib/utils/calculations.ts`
- **Datas**: `src/lib/utils/date.ts`

### Firebase
- **Config**: `src/lib/firebase/config.ts`
- **Auth**: `src/lib/firebase/auth.ts`
- **Firestore**: `src/lib/firebase/firestore.ts`
- **Storage**: `src/lib/firebase/storage.ts`

### Offline-First
- **IndexedDB**: `src/lib/indexeddb/`
- **Sync Manager**: `src/lib/sync/sync-manager.ts`
- **Sync Queue**: `src/lib/sync/sync-queue.ts`

### Types e Constants
- **Types**: `src/lib/types/index.ts`
- **Constants**: `src/lib/constants.ts`

## 🔑 Conceitos Chave

### 1. Fluxo de Dados

```typescript
// SEMPRE salvar localmente primeiro
import { create } from '@/lib/indexeddb/operations'
import { addToSyncQueue } from '@/lib/sync/sync-queue'

async function salvarDados(dados) {
  // 1. Salva no IndexedDB (instantâneo)
  await create('storeName', dados)
  
  // 2. Adiciona à fila de sync
  await addToSyncQueue('create', 'collectionName', dados)
  
  // 3. UI atualiza imediatamente
  // 4. Sync acontece em background
}
```

### 2. Validação de Compliance

```typescript
import { validateDayCompliance } from '@/lib/services/validation.service'
import { calculateNutritionCompliance } from '@/lib/utils/calculations'

// Validar dia completo
const { compliant, validations, failedReasons } = validateDayCompliance(dailySummary)

// Validar apenas dieta
const compliance = calculateNutritionCompliance(total, dietConfig)
```

### 3. Queries

```typescript
import { getByIndex } from '@/lib/indexeddb/operations'
import { STORES } from '@/lib/constants'

// Buscar por índice
const logs = await getByIndex(
  STORES.NUTRITION_LOGS,
  'date',
  '2025-12-25'
)
```

## 📊 Modelo de Dados Resumido

### Challenge
```typescript
{
  userId: string
  startDate: Date
  status: 'active' | 'failed' | 'completed'
  currentDay: number (1-75)
  dietConfig: {
    dailyCalories: number
    protein: number  // g
    carbs: number    // g
    fat: number      // g
  }
}
```

### NutritionLog
```typescript
{
  dayLogId: string
  userId: string
  date: string (YYYY-MM-DD)
  calories: number
  protein: number  // g
  carbs: number    // g
  fat: number      // g
}
```

### Workout
```typescript
{
  dayLogId: string
  userId: string
  date: string
  type: 'musculacao' | 'cardio' | 'mobilidade' | 'funcional' | 'outro'
  duration: number  // minutos
  intensity: 'leve' | 'moderada' | 'alta'
  outdoor: boolean
}
```

## 🎯 Regras do 75 Hard

### Validações Obrigatórias
```typescript
const REQUIREMENTS = {
  diet: 'Dentro dos limites de calorias E todos os macros',
  workouts: '2 treinos ≥ 45min, 1 outdoor mínimo',
  water: '≥ 3780ml',
  reading: '≥ 10 páginas',
  photo: '1 foto enviada',
  alcohol: 'Zero (confirmação explícita)'
}
```

### Falha Automática
```typescript
// Se QUALQUER validação falhar:
dayLog.compliant = false
challenge.status = 'failed'
challenge.failedOnDay = currentDay
challenge.failedReason = 'descrição específica'
```

## 🛠️ Utils Mais Usados

### Datas
```typescript
import { getTodayString, formatDateForDisplay, canEditDate } from '@/lib/utils/date'

const today = getTodayString()  // '2025-12-25'
const formatted = formatDateForDisplay(today)  // '25/12/2025'
const canEdit = canEditDate(today)  // true apenas para hoje ou futuro
```

### Cálculos
```typescript
import {
  calculateDailyNutritionTotal,
  calculateNutritionCompliance,
  calculateWorkoutCompliance
} from '@/lib/utils/calculations'

const total = calculateDailyNutritionTotal(nutritionLogs)
const compliance = calculateNutritionCompliance(total, dietConfig)
const workoutCompliance = calculateWorkoutCompliance(workouts)
```

## 🔐 Security Rules Essenciais

### Firestore
```javascript
// Usuário só acessa seus dados
allow read: if isAuthenticated() && isOwner(resource.data.userId)

// Não pode editar dias passados
allow update: if canEditDate(resource.data.date)

// Não pode criar dias futuros
allow create: if isTodayOrFuture(request.resource.data.date)
```

### Storage
```javascript
// Upload privado por usuário
match /users/{userId}/progress_photos/{photoId} {
  allow read, write: if request.auth.uid == userId
    && request.resource.size < 5 * 1024 * 1024  // 5MB
}
```

## 📱 PWA

### Manifest
- Localização: `public/manifest.json`
- Icons necessários: 72, 96, 128, 144, 152, 192, 384, 512px
- Use: https://www.pwabuilder.com/imageGenerator

### Service Worker
- Auto-configurado pelo `next-pwa`
- Cache strategies em `next.config.js`
- Background sync registrado em `sync-manager.ts`

## 🐛 Debug

### Ver dados locais
```typescript
// Console do navegador
async function debugDB() {
  const db = await import('@/lib/indexeddb/db').then(m => m.getDB())
  const challenges = await db.getAll('challenges')
  console.log(challenges)
}
debugDB()
```

### Ver fila de sync
```typescript
import { getAllQueueItems } from '@/lib/sync/sync-queue'

const queue = await getAllQueueItems()
console.log('Pending sync:', queue)
```

### Forçar sincronização
```typescript
import { syncManager } from '@/lib/sync/sync-manager'

await syncManager.forceSyncNow()
```

## 📚 Documentação Completa

- **Setup geral**: `README.md`
- **Arquitetura**: `ARCHITECTURE.md`
- **Deploy**: `DEPLOY.md`
- **Próximos passos**: `NEXT_STEPS.md`
- **Estrutura**: `PROJECT_STRUCTURE.md`
- **Sumário**: `SUMMARY.md`

## 🎨 Componentes Shadcn Necessários

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add form
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add select
npx shadcn-ui@latest add checkbox
```

## 🔥 Firebase Deploy

```bash
# Deploy Security Rules
firebase deploy --only firestore:rules
firebase deploy --only storage:rules

# Deploy Indexes
firebase deploy --only firestore:indexes

# Deploy Hosting (opcional)
firebase deploy --only hosting
```

## 💡 Dicas

### 1. Sempre trabalhe offline-first
```typescript
// ❌ ERRADO - direto no Firebase
await createDocument('collection', id, data)

// ✅ CERTO - local primeiro, sync depois
await create('storeName', data)
await addToSyncQueue('create', 'collection', data)
```

### 2. Use os services de validação
```typescript
// ✅ Services já calculam tudo
import { validateDayCompliance } from '@/lib/services/validation.service'

// Não reimplemente lógica de compliance
```

### 3. Respeite as regras de data
```typescript
// ✅ Sempre validar se pode editar
import { canEditDate } from '@/lib/utils/date'

if (!canEditDate(date)) {
  throw new Error('Não pode editar dias passados')
}
```

### 4. Sincronize em background
```typescript
// ✅ Deixe o sync manager trabalhar
// Não chame Firebase diretamente na UI
// O sync manager lida com retry, erros, offline, etc.
```

## 🆘 Troubleshooting

### "Cannot find module 'firebase/...'"
```bash
npm install
```

### Service Worker não funciona
- Deve estar em produção (`npm run build`)
- Deve estar em HTTPS (localhost funciona)

### IndexedDB não inicializa
```typescript
// Chame no root do app
import { initDB } from '@/lib/indexeddb/db'
await initDB()
```

### Dados não sincronizam
```typescript
// Verifique se está online
import { syncManager } from '@/lib/sync/sync-manager'
console.log('Online?', syncManager.getIsOnline())

// Force sync manual
await syncManager.forceSyncNow()
```

## 🎯 Checklist Antes de Implementar UI

- [ ] `npm install` executado
- [ ] Firebase configurado (já está!)
- [ ] Shadcn components instalados
- [ ] Context providers criados
- [ ] Hooks customizados criados
- [ ] Layout base criado

---

**Pronto para começar! Boa sorte! 💪**
