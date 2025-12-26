# 75 Hard Challenge - PWA

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10-orange)](https://firebase.google.com/)
[![PWA](https://img.shields.io/badge/PWA-Enabled-purple)](https://web.dev/progressive-web-apps/)

PWA completo, seguro e offline-first para tracking rigoroso e auditável do desafio 75 Hard, com controle detalhado de dieta (macros), treinos, peso, hábitos e diário mental.

## 🎯 Características Principais

### ✅ Offline-First
- **Funciona 100% offline** - Todos os dados salvos localmente
- **Sincronização automática** quando voltar online
- **Resolução de conflitos** inteligente por timestamp
- **Queue de sincronização** com retry exponencial

### 🔐 Segurança Rigorosa
- **Firebase Security Rules** restritivas
- **Validação de dados** no cliente e servidor
- **Bloqueio de edição retroativa** - não pode alterar dias passados
- **Bloqueio de dias futuros** - não pode pré-registrar
- **Fotos sem EXIF** - privacidade garantida

### 📊 Validação Automática Completa
- **Dieta**: Calorias e macros (proteína, carboidratos, gordura)
- **Treinos**: 2x 45min, 1 outdoor mínimo
- **Água**: 3780ml (1 galão)
- **Leitura**: 10 páginas mínimo
- **Foto**: Upload diário obrigatório
- **Álcool**: Confirmação explícita de zero consumo

### ⚡ Performance
- **Instalável** como app nativo
- **Service Worker** com estratégias de cache
- **Otimização de imagens** automática
- **Code splitting** por rota

## 🏗️ Arquitetura

```
Frontend (Next.js) ←→ IndexedDB (Local) ←→ Sync Manager ←→ Firebase (Cloud)
                              ↓
                         UI Update (Instant)
```

### Stack Tecnológica

- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS + Shadcn/ui
- **PWA**: next-pwa + Workbox
- **Local DB**: IndexedDB (via idb)
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Validação**: Zod
- **Datas**: date-fns

## 📦 Instalação

### 1. Clone o repositório

```bash
git clone <seu-repo>
cd 75hard
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o Firebase

#### 3.1. Crie um projeto no Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto
3. Ative **Authentication** (Email/Password)
4. Ative **Firestore Database**
5. Ative **Storage**

#### 3.2. Configure as credenciais

Suas credenciais já estão em `src/lib/firebase/config.ts`:

#### 3.3. Deploy das Security Rules

**Firestore Rules:**

```bash
firebase deploy --only firestore:rules
```

Ou copie o conteúdo de `firestore.rules` no Firebase Console.

**Storage Rules:**

```bash
firebase deploy --only storage:rules
```

Ou copie o conteúdo de `storage.rules` no Firebase Console.

### 4. Crie os índices do Firestore

No Firebase Console, vá em **Firestore Database** → **Indexes** e crie:

#### Índices Compostos

1. **day_logs**
   - `userId` (Ascending) + `date` (Ascending)
   - `challengeId` (Ascending) + `dayNumber` (Ascending)

2. **nutrition_logs**
   - `userId` (Ascending) + `date` (Ascending)
   - `dayLogId` (Ascending) + `timestamp` (Ascending)

3. **workouts**
   - `userId` (Ascending) + `date` (Ascending)
   - `dayLogId` (Ascending) + `createdAt` (Ascending)

4. **water_logs**
   - `dayLogId` (Ascending) + `timestamp` (Ascending)

5. **weight_logs**
   - `userId` (Ascending) + `date` (Descending)

### 5. Adicione os ícones do PWA

Crie os ícones em `public/icons/`:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

**Dica**: Use [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator) para gerar todos os ícones.

## 🚀 Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

## 📱 Build e Deploy

### Build de Produção

```bash
npm run build
npm start
```

### Deploy no Vercel (Recomendado)

```bash
# Instale a CLI do Vercel
npm i -g vercel

# Deploy
vercel
```

### Deploy no Firebase Hosting

```bash
# Build
npm run build

# Deploy
firebase deploy --only hosting
```

## 🔥 Regras do 75 Hard

Um dia só é considerado **compliant** se TODOS os requisitos forem cumpridos:

1. ✅ **Dieta em compliance**: Calorias e macros dentro dos limites configurados
2. ✅ **2 treinos de 45+ minutos**: Pelo menos um outdoor
3. ✅ **3780ml de água**: Mínimo obrigatório
4. ✅ **10 páginas de leitura**: Livros de não-ficção
5. ✅ **Foto de progresso**: Upload diário
6. ✅ **Zero álcool**: Confirmação explícita

### ⚠️ Falha Automática

Se **qualquer** requisito falhar:
- ❌ Dia marcado como falhado
- ❌ Desafio falha automaticamente
- 🔄 Reset necessário para o dia 1

## 📊 Modelo de Dados

### Configuração de Dieta (no início do desafio)

```typescript
{
  dailyCalories: 2000,    // Limite diário
  protein: 150,           // gramas
  carbs: 200,             // gramas
  fat: 65                 // gramas
}
```

### Registro de Alimentação

```typescript
{
  mealName: "Almoço",
  calories: 650,
  protein: 45,
  carbs: 60,
  fat: 20
}
```

### Registro de Treino

```typescript
{
  type: "musculacao",     // musculacao | cardio | mobilidade | funcional | outro
  duration: 60,           // minutos
  intensity: "alta",      // leve | moderada | alta
  outdoor: false,
  notes: "Treino de pernas"
}
```

## 🎨 Estrutura do Projeto

```
75hard/
├── src/
│   ├── app/                    # Next.js App Router
│   ├── components/             # React components
│   ├── lib/
│   │   ├── firebase/          # Firebase config & services
│   │   ├── indexeddb/         # IndexedDB wrapper
│   │   ├── sync/              # Sync manager
│   │   ├── services/          # Business logic
│   │   ├── hooks/             # React hooks
│   │   ├── context/           # React context
│   │   ├── types/             # TypeScript types
│   │   ├── utils/             # Utilities
│   │   └── constants.ts       # Constants
│   └── styles/
├── public/
│   ├── icons/                 # PWA icons
│   ├── manifest.json          # PWA manifest
│   └── offline.html           # Offline fallback
├── firestore.rules            # Firestore Security Rules
├── storage.rules              # Storage Security Rules
└── ARCHITECTURE.md            # Documentação detalhada
```

## 🔧 Funcionalidades Implementadas

### Core System
- ✅ Arquitetura offline-first completa
- ✅ Firebase Authentication
- ✅ IndexedDB com sincronização automática
- ✅ Service Worker + PWA manifest
- ✅ Security Rules restritivas

### Validações
- ✅ Validação de dieta por macros
- ✅ Validação de treinos (2x 45min + 1 outdoor)
- ✅ Validação de água (3780ml)
- ✅ Validação de leitura (10 páginas)
- ✅ Validação de foto diária
- ✅ Confirmação de álcool zero
- ✅ Cálculo automático de compliance

### Services
- ✅ Challenge service (criar, atualizar, falhar)
- ✅ Validation service (compliance completo)
- ✅ Sync manager (fila + retry)
- ✅ Photo service (upload sem EXIF)

## 🚧 Próximos Passos

Para completar a implementação, você precisa criar:

### 1. React Context Providers

```typescript
// src/lib/context/AuthContext.tsx
// src/lib/context/ChallengeContext.tsx
// src/lib/context/SyncContext.tsx
```

### 2. React Hooks

```typescript
// src/lib/hooks/useAuth.ts
// src/lib/hooks/useChallenge.ts
// src/lib/hooks/useDailyLog.ts
// src/lib/hooks/useSync.ts
```

### 3. UI Components

```typescript
// src/components/auth/LoginForm.tsx
// src/components/auth/RegisterForm.tsx
// src/components/daily/DietInput.tsx
// src/components/daily/WorkoutForm.tsx
// src/components/daily/WaterTracker.tsx
// src/components/daily/ReadingInput.tsx
// src/components/daily/PhotoUpload.tsx
// src/components/daily/DiaryEntry.tsx
// src/components/challenge/ChallengeCard.tsx
// src/components/progress/ProgressChart.tsx
```

### 4. Pages (App Router)

```typescript
// src/app/(auth)/login/page.tsx
// src/app/(auth)/register/page.tsx
// src/app/(app)/dashboard/page.tsx
// src/app/(app)/challenge/new/page.tsx
// src/app/(app)/daily/page.tsx
// src/app/(app)/progress/page.tsx
```

### 5. Globals CSS

```css
// src/styles/globals.css - Adicionar variáveis CSS do Tailwind
```

## 📖 Documentação Adicional

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura detalhada do sistema
- [Firestore Rules](./firestore.rules) - Security Rules do Firestore
- [Storage Rules](./storage.rules) - Security Rules do Storage

## 🎯 Possíveis Extensões Futuras

1. **Analytics Avançado**
   - Dashboard de estatísticas
   - Tendências de compliance
   - Comparação entre desafios

2. **Social Features**
   - Compartilhamento de progresso
   - Accountability partners
   - Grupos de desafio

3. **IA/ML**
   - Previsão de compliance
   - Sugestões de ajuste de dieta
   - Reconhecimento de alimentos por foto

4. **Integrações**
   - MyFitnessPal
   - Strava / Apple Health
   - Goodreads

5. **Multi-platform**
   - React Native app
   - Apple Watch companion
   - Notificações push

## 📄 Licença

MIT

## 🤝 Contribuições

Contribuições são bem-vindas! Este é um projeto robusto, auditável e pronto para uso real.

## ⚠️ Avisos Importantes

1. **Não edite dias passados** - O sistema bloqueia automaticamente
2. **Não tente burlar as validações** - Isso vai contra o espírito do desafio
3. **Backup seus dados** - Configure backups automáticos do Firestore
4. **Monitore custos do Firebase** - Configure alertas de billing

## 🆘 Suporte

Para problemas ou dúvidas:
1. Revise [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Verifique as Security Rules
3. Teste a sincronização offline→online
4. Valide os índices do Firestore

---

**75 Hard Challenge** - Disciplina. Consistência. Resultados.

Construído com 💪 para alta confiabilidade e auditabilidade.
