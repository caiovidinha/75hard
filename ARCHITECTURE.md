# 75 Hard Challenge - Arquitetura do Sistema

## Visão Geral

PWA offline-first para tracking rigoroso e auditável do desafio 75 Hard, com controle detalhado de dieta (macros), treinos, peso, hábitos e diário mental.

## Stack Tecnológica

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript
- **UI**: Tailwind CSS + Shadcn/ui
- **Estado**: React Context + hooks customizados
- **PWA**: next-pwa + Workbox
- **Persistência Local**: IndexedDB (via idb)
- **Validação**: Zod
- **Data**: date-fns

### Backend
- **Autenticação**: Firebase Authentication
- **Database**: Firestore
- **Storage**: Firebase Storage
- **Hosting**: Vercel (ou Firebase Hosting)

## Arquitetura Offline-First

### Fluxo de Dados

```
User Input → IndexedDB (local) → Background Sync → Firestore
                ↓
            UI Update (instant)
```

### Estratégias de Sincronização

1. **Write-Through**: Dados salvos localmente primeiro, depois sincronizados
2. **Conflict Resolution**: Timestamp mais recente vence
3. **Queue de Sincronização**: Operações pendentes processadas em ordem
4. **Retry Logic**: Exponential backoff para falhas de rede

### Camadas da Aplicação

```
┌─────────────────────────────────────┐
│         UI Components               │
├─────────────────────────────────────┤
│      React Context (State)          │
├─────────────────────────────────────┤
│    Services Layer (Business Logic)  │
├─────────────────────────────────────┤
│  Sync Manager (Offline Handling)    │
├─────────────────────────────────────┤
│     IndexedDB        │   Firestore  │
│     (Local)          │   (Cloud)    │
└─────────────────────────────────────┘
```

## Modelo de Dados

### Firestore Collections

#### users/{userId}
```typescript
{
  email: string
  displayName: string
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### challenges/{challengeId}
```typescript
{
  userId: string
  startDate: timestamp
  endDate?: timestamp
  status: 'active' | 'failed' | 'completed'
  currentDay: number (1-75)
  failedOnDay?: number
  failedReason?: string
  dietConfig: {
    dailyCalories: number
    protein: number  // gramas
    carbs: number    // gramas
    fat: number      // gramas
  }
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### day_logs/{dayLogId}
```typescript
{
  challengeId: string
  userId: string
  date: string (YYYY-MM-DD)
  dayNumber: number (1-75)
  completed: boolean
  compliant: boolean
  failedReason?: string
  validations: {
    diet: boolean
    workouts: boolean
    water: boolean
    reading: boolean
    photo: boolean
    noAlcohol: boolean
  }
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### nutrition_logs/{nutritionId}
```typescript
{
  dayLogId: string
  userId: string
  date: string
  mealName?: string
  calories: number
  protein: number
  carbs: number
  fat: number
  timestamp: timestamp
  createdAt: timestamp
}
```

#### workouts/{workoutId}
```typescript
{
  dayLogId: string
  userId: string
  date: string
  type: 'musculacao' | 'cardio' | 'mobilidade' | 'funcional' | 'outro'
  customType?: string
  duration: number  // minutos
  intensity: 'leve' | 'moderada' | 'alta'
  outdoor: boolean
  notes?: string
  startTime?: timestamp
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### weight_logs/{weightId}
```typescript
{
  userId: string
  challengeId?: string
  date: string
  weight: number  // kg
  createdAt: timestamp
}
```

#### reading_logs/{readingId}
```typescript
{
  dayLogId: string
  userId: string
  date: string
  bookTitle: string
  pages: number
  totalPages?: number
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### water_logs/{waterId}
```typescript
{
  dayLogId: string
  userId: string
  date: string
  amount: number  // ml
  timestamp: timestamp
  createdAt: timestamp
}
```

#### diary_entries/{entryId}
```typescript
{
  dayLogId: string
  userId: string
  date: string
  text: string
  mood?: 'great' | 'good' | 'neutral' | 'bad' | 'terrible'
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### progress_photos/{photoId}
```typescript
{
  dayLogId: string
  userId: string
  date: string
  storagePath: string
  thumbnailPath?: string
  url: string
  createdAt: timestamp
}
```

### IndexedDB Schema

Stores locais que espelham as collections do Firestore:

- `challenges`
- `dayLogs`
- `nutritionLogs`
- `workouts`
- `weightLogs`
- `readingLogs`
- `waterLogs`
- `diaryEntries`
- `progressPhotos`
- `syncQueue` (operações pendentes)

## Regras de Validação

### Compliance Diário

Um dia é **compliant** apenas se:

1. ✅ **Dieta**: Total de calorias ≤ limite E todos os macros ≤ limites
2. ✅ **Treinos**: ≥ 2 treinos, cada um ≥ 45min, ≥ 1 outdoor
3. ✅ **Água**: ≥ 3780 ml
4. ✅ **Leitura**: ≥ 10 páginas
5. ✅ **Foto**: 1 foto enviada
6. ✅ **Álcool**: Confirmação de zero consumo

### Validação de Dieta (Detalhada)

```typescript
const dailyNutritionTotal = {
  calories: sum(nutrition_logs.calories),
  protein: sum(nutrition_logs.protein),
  carbs: sum(nutrition_logs.carbs),
  fat: sum(nutrition_logs.fat)
}

const isDietCompliant = 
  dailyNutritionTotal.calories <= challenge.dietConfig.dailyCalories &&
  dailyNutritionTotal.protein <= challenge.dietConfig.protein &&
  dailyNutritionTotal.carbs <= challenge.dietConfig.carbs &&
  dailyNutritionTotal.fat <= challenge.dietConfig.fat
```

### Validação de Treinos

```typescript
const workoutsForDay = workouts.filter(w => w.date === currentDate)
const outdoorWorkouts = workoutsForDay.filter(w => w.outdoor)
const validWorkouts = workoutsForDay.filter(w => w.duration >= 45)

const isWorkoutsCompliant = 
  validWorkouts.length >= 2 &&
  outdoorWorkouts.length >= 1
```

### Falha Automática

Se **qualquer** validação falhar:
- `dayLog.compliant = false`
- `challenge.status = 'failed'`
- `challenge.failedOnDay = currentDay`
- `challenge.failedReason = 'descrição específica'`

## Segurança

### Firebase Security Rules (Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isToday(dateString) {
      return dateString == request.time.toMillis().toString();
    }
    
    function isTodayOrFuture(dateString) {
      let requestDate = timestamp.date(dateString);
      let today = request.time.date();
      return requestDate >= today;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated() && isOwner(userId);
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && isOwner(userId);
    }
    
    // Challenges collection
    match /challenges/{challengeId} {
      allow read: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
      allow update: if isAuthenticated() && isOwner(resource.data.userId);
    }
    
    // Day logs - NO retroactive editing
    match /day_logs/{dayLogId} {
      allow read: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() 
        && isOwner(request.resource.data.userId)
        && isTodayOrFuture(request.resource.data.date);
      allow update: if isAuthenticated() 
        && isOwner(resource.data.userId)
        && isTodayOrFuture(resource.data.date);
    }
    
    // Nutrition logs
    match /nutrition_logs/{nutritionId} {
      allow read: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
      allow update: if isAuthenticated() && isOwner(resource.data.userId);
      allow delete: if isAuthenticated() && isOwner(resource.data.userId);
    }
    
    // Workouts
    match /workouts/{workoutId} {
      allow read: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
      allow update: if isAuthenticated() && isOwner(resource.data.userId);
      allow delete: if isAuthenticated() && isOwner(resource.data.userId);
    }
    
    // Weight logs
    match /weight_logs/{weightId} {
      allow read: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
      allow update: if isAuthenticated() && isOwner(resource.data.userId);
    }
    
    // Reading logs
    match /reading_logs/{readingId} {
      allow read: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
      allow update: if isAuthenticated() && isOwner(resource.data.userId);
    }
    
    // Water logs
    match /water_logs/{waterId} {
      allow read: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
      allow update: if isAuthenticated() && isOwner(resource.data.userId);
    }
    
    // Diary entries
    match /diary_entries/{entryId} {
      allow read: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
      allow update: if isAuthenticated() && isOwner(resource.data.userId);
    }
    
    // Progress photos
    match /progress_photos/{photoId} {
      allow read: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
    }
  }
}
```

### Firebase Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/progress_photos/{photoId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null 
        && request.auth.uid == userId
        && request.resource.size < 5 * 1024 * 1024  // 5MB max
        && request.resource.contentType.matches('image/.*');
    }
  }
}
```

## Fluxo de Sincronização

### 1. Write Local First

```typescript
async function saveData(data) {
  // 1. Salva localmente (rápido)
  await indexedDB.save(data)
  
  // 2. Atualiza UI
  updateUI(data)
  
  // 3. Adiciona à fila de sincronização
  await syncQueue.add({
    operation: 'create',
    collection: 'workouts',
    data: data,
    timestamp: Date.now()
  })
  
  // 4. Tenta sincronizar
  if (navigator.onLine) {
    await syncManager.sync()
  }
}
```

### 2. Background Sync

```typescript
// Service Worker
self.addEventListener('sync', (event) => {
  if (event.tag === '75hard-sync') {
    event.waitUntil(processSyncQueue())
  }
})
```

### 3. Conflict Resolution

```typescript
async function resolveConflict(local, remote) {
  // Timestamp mais recente vence
  if (local.updatedAt > remote.updatedAt) {
    await firestore.update(local)
    return local
  } else {
    await indexedDB.update(remote)
    return remote
  }
}
```

## Estrutura de Pastas

```
75hard/
├── public/
│   ├── icons/                    # PWA icons
│   ├── manifest.json
│   └── offline.html
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (app)/
│   │   │   ├── dashboard/
│   │   │   ├── challenge/
│   │   │   │   ├── new/
│   │   │   │   └── [id]/
│   │   │   ├── daily/
│   │   │   │   ├── diet/
│   │   │   │   ├── workouts/
│   │   │   │   ├── water/
│   │   │   │   ├── reading/
│   │   │   │   ├── photo/
│   │   │   │   └── diary/
│   │   │   ├── progress/
│   │   │   └── settings/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                   # Shadcn components
│   │   ├── auth/
│   │   ├── challenge/
│   │   ├── daily/
│   │   ├── progress/
│   │   └── shared/
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── config.ts
│   │   │   ├── auth.ts
│   │   │   ├── firestore.ts
│   │   │   └── storage.ts
│   │   ├── indexeddb/
│   │   │   ├── db.ts
│   │   │   ├── stores.ts
│   │   │   └── operations.ts
│   │   ├── sync/
│   │   │   ├── sync-manager.ts
│   │   │   ├── sync-queue.ts
│   │   │   └── conflict-resolver.ts
│   │   ├── services/
│   │   │   ├── challenge.service.ts
│   │   │   ├── diet.service.ts
│   │   │   ├── workout.service.ts
│   │   │   ├── validation.service.ts
│   │   │   └── photo.service.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useChallenge.ts
│   │   │   ├── useDailyLog.ts
│   │   │   ├── useOfflineStatus.ts
│   │   │   └── useSync.ts
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   ├── ChallengeContext.tsx
│   │   │   └── SyncContext.tsx
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── date.ts
│   │   │   ├── validation.ts
│   │   │   └── calculations.ts
│   │   └── constants.ts
│   └── styles/
│       └── globals.css
├── .env.local
├── .env.example
├── .gitignore
├── firestore.rules
├── storage.rules
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

## Possíveis Extensões Futuras

1. **Analytics Avançado**
   - Dashboard de estatísticas
   - Tendências de compliance
   - Comparação entre desafios

2. **Social Features**
   - Compartilhamento de progresso
   - Accountability partners
   - Grupos de desafio

3. **Gamificação Sutil**
   - Badges de conquistas
   - Streaks de dias consecutivos
   - Milestones visuais

4. **IA/ML**
   - Previsão de compliance
   - Sugestões de ajuste de dieta
   - Reconhecimento de alimentos por foto

5. **Integrações**
   - MyFitnessPal (importar refeições)
   - Strava/Apple Health (importar treinos)
   - Goodreads (tracking de leitura)

6. **Multi-platform**
   - App nativo (React Native)
   - Apple Watch companion
   - Notificações push

## Performance

### Métricas Alvo
- **FCP** (First Contentful Paint): < 1.5s
- **LCP** (Largest Contentful Paint): < 2.5s
- **TTI** (Time to Interactive): < 3.5s
- **CLS** (Cumulative Layout Shift): < 0.1

### Otimizações
- Code splitting por rota
- Lazy loading de componentes
- Image optimization (Next.js)
- Service Worker caching
- IndexedDB indexação adequada

## Testes

### Unitários
- Validações de compliance
- Cálculos de macros
- Lógica de sincronização

### Integração
- Fluxos completos de dia
- Sincronização offline→online
- Resolução de conflitos

### E2E
- Jornada completa de 75 dias
- Falha e reset
- Múltiplos dispositivos
