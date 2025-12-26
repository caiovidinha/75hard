# Guia de Deploy - 75 Hard PWA

Este guia detalha o processo completo de deploy para produção.

## 📋 Pré-requisitos

- [ ] Conta no Firebase
- [ ] Conta no Vercel (ou Firebase Hosting)
- [ ] Node.js 18+ instalado
- [ ] Git configurado

## 🔥 Configuração do Firebase

### 1. Criar Projeto

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar projeto
firebase init
```

Selecione:
- ✅ Firestore
- ✅ Storage
- ✅ Hosting (opcional)

### 2. Deploy das Security Rules

#### Firestore Rules

```bash
firebase deploy --only firestore:rules
```

Verifique no Console:
- Acesse Firestore → Rules
- Confirme que as regras foram aplicadas
- Teste com o simulador

#### Storage Rules

```bash
firebase deploy --only storage:rules
```

Verifique no Console:
- Acesse Storage → Rules
- Confirme que as regras foram aplicadas

### 3. Criar Índices do Firestore

**Opção 1: Via Console**

Acesse Firestore → Indexes → Add Index

**day_logs:**
```
- userId: Ascending
- date: Ascending
```

**nutrition_logs:**
```
- userId: Ascending
- date: Ascending
```

**workouts:**
```
- userId: Ascending  
- date: Ascending
```

**weight_logs:**
```
- userId: Ascending
- date: Descending
```

**Opção 2: Via arquivo (recomendado)**

Crie `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "day_logs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "day_logs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "challengeId", "order": "ASCENDING" },
        { "fieldPath": "dayNumber", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "nutrition_logs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "nutrition_logs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "dayLogId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "workouts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "weight_logs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Deploy:

```bash
firebase deploy --only firestore:indexes
```

### 4. Configurar Authentication

No Firebase Console:
1. Acesse Authentication → Sign-in method
2. Ative **Email/Password**
3. Configure domínios autorizados (adicione seu domínio de produção)

### 5. Configurar Storage

1. Acesse Storage no Firebase Console
2. Verifique se o bucket foi criado
3. Confirme que as rules foram aplicadas

### 6. Configurar Alertas de Billing

⚠️ **IMPORTANTE** para evitar surpresas

1. Firebase Console → Settings → Usage and billing
2. Configure alertas:
   - 50% do budget
   - 90% do budget
3. Defina limites de uso se necessário

## 🚀 Deploy no Vercel (Recomendado)

### 1. Preparar o Projeto

```bash
# Build local para testar
npm run build

# Testar produção localmente
npm start
```

### 2. Deploy

**Opção A: Via CLI**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy para produção
vercel --prod
```

**Opção B: Via GitHub**

1. Commit e push para GitHub:

```bash
git add .
git commit -m "Initial commit - 75 Hard PWA"
git push origin main
```

2. No Vercel Dashboard:
   - New Project
   - Import from GitHub
   - Selecione o repositório
   - Configure (geralmente auto-detecta Next.js)
   - Deploy

### 3. Configurar Variáveis de Ambiente (se necessário)

No Vercel Dashboard:
- Settings → Environment Variables

Adicione (se quiser externalizar):
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

### 4. Configurar Domínio Customizado

No Vercel Dashboard:
- Settings → Domains
- Add domain
- Siga instruções de DNS

### 5. Configurar Headers de Segurança

Crie `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    },
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
}
```

## 🔧 Deploy no Firebase Hosting (Alternativa)

### 1. Configurar

```bash
firebase init hosting
```

Respostas:
- Public directory: `out`
- Single-page app: Yes
- GitHub deployment: No (por enquanto)

### 2. Build para Static Export

Modifique `next.config.js`:

```javascript
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // Necessário para export estático
  },
  // ... resto da config
}
```

### 3. Build e Deploy

```bash
# Build
npm run build

# Deploy
firebase deploy --only hosting
```

## ✅ Checklist de Produção

### Antes do Deploy

- [ ] Testar build local (`npm run build && npm start`)
- [ ] Validar todas as Security Rules
- [ ] Confirmar índices do Firestore criados
- [ ] Testar fluxo completo offline→online
- [ ] Verificar validações funcionando
- [ ] Testar upload de fotos
- [ ] Validar cálculos de macros
- [ ] Testar falha de dia
- [ ] Adicionar ícones PWA
- [ ] Testar instalação do PWA

### Após o Deploy

- [ ] Testar autenticação
- [ ] Criar usuário de teste
- [ ] Criar desafio de teste
- [ ] Registrar dia completo
- [ ] Testar sincronização offline
- [ ] Validar compliance
- [ ] Testar em dispositivos móveis
- [ ] Verificar instalação PWA
- [ ] Monitorar logs do Firebase
- [ ] Configurar alertas de erro

## 📊 Monitoramento

### Firebase Console

1. **Authentication**
   - Monitorar novos usuários
   - Verificar tentativas de login

2. **Firestore**
   - Monitorar leituras/escritas
   - Verificar custos
   - Analisar queries lentas

3. **Storage**
   - Monitorar uploads
   - Verificar tamanho total
   - Analisar custos

4. **Performance**
   - Tempo de resposta
   - Erros de rede
   - Taxa de sucesso

### Vercel Analytics

1. Core Web Vitals
   - FCP (First Contentful Paint)
   - LCP (Largest Contentful Paint)
   - CLS (Cumulative Layout Shift)
   - FID (First Input Delay)

2. Tráfego
   - Pageviews
   - Unique visitors
   - Geolocalização

## 🔒 Segurança em Produção

### 1. Validar Domínios Autorizados

Firebase Console → Authentication → Settings:
- Adicione apenas domínios confiáveis

### 2. Rate Limiting

Configure no Firebase Console ou use Cloud Functions para limitar:
- Tentativas de login
- Uploads de fotos
- Criação de registros

### 3. Backup Automático

Configure exports automáticos do Firestore:
```bash
gcloud firestore export gs://[BUCKET_NAME]
```

Ou use o Firestore scheduled exports no Console.

### 4. Logs e Alertas

Configure Google Cloud Logging para:
- Erros de autenticação
- Violações de Security Rules
- Picos de uso anormal

## 💰 Otimização de Custos

### Firestore

- Use queries eficientes com índices
- Evite leituras desnecessárias
- Use cache quando possível
- Limite resultados com `.limit()`

### Storage

- Comprima imagens antes do upload (já implementado)
- Use lifecycle policies para arquivos antigos
- Monitore tamanho total

### Vercel/Hosting

- Configure cache adequadamente
- Use CDN para assets estáticos
- Otimize bundle size

## 🚨 Troubleshooting

### Erro: "Missing or insufficient permissions"

- Verifique Security Rules
- Confirme que usuário está autenticado
- Valide índices do Firestore

### PWA não instala

- Verifique manifest.json
- Confirme HTTPS ativo
- Valide Service Worker registrado
- Teste com Lighthouse

### Sincronização não funciona offline

- Verifique IndexedDB inicializado
- Confirme Service Worker ativo
- Valide network listeners

### Upload de foto falha

- Verifique Storage Rules
- Confirme tamanho < 5MB
- Valide tipo de arquivo

## 📱 Teste em Dispositivos

### iOS

1. Safari → Compartilhar → Adicionar à Tela Inicial
2. Testar funcionalidade offline
3. Validar notificações (se implementadas)

### Android

1. Chrome → Menu → Instalar app
2. Testar funcionalidade offline
3. Validar notificações (se implementadas)

## ✨ Melhorias Pós-Deploy

1. **Analytics**
   - Google Analytics
   - Mixpanel
   - Amplitude

2. **Error Tracking**
   - Sentry
   - Rollbar
   - LogRocket

3. **Performance**
   - New Relic
   - Datadog
   - Firebase Performance

4. **A/B Testing**
   - Google Optimize
   - Firebase Remote Config

---

**Pronto!** Seu PWA 75 Hard está no ar! 🚀

Para suporte: revise ARCHITECTURE.md e README.md
