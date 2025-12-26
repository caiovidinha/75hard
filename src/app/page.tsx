import Link from 'next/link'
import { ArrowRight, CheckCircle2, Shield, Wifi, Database } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-6">
            75 Hard Challenge
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            PWA completo, seguro e offline-first para tracking rigoroso e auditável 
            do desafio 75 Hard com controle detalhado de dieta, treinos e hábitos.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-4 bg-white text-purple-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
            >
              Começar Agora
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/register"
              className="px-8 py-4 bg-purple-700 text-white rounded-lg font-semibold hover:bg-purple-600 transition-colors"
            >
              Criar Conta
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <FeatureCard
            icon={<Wifi className="w-8 h-8" />}
            title="Offline-First"
            description="Funciona 100% offline com sincronização automática"
          />
          <FeatureCard
            icon={<Shield className="w-8 h-8" />}
            title="Seguro"
            description="Security Rules restritivas e dados criptografados"
          />
          <FeatureCard
            icon={<Database className="w-8 h-8" />}
            title="Auditável"
            description="Histórico completo preservado e imutável"
          />
          <FeatureCard
            icon={<CheckCircle2 className="w-8 h-8" />}
            title="Validação Automática"
            description="Compliance calculado automaticamente"
          />
        </div>

        {/* Rules Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            Regras do 75 Hard
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <RuleCard
              number="1"
              title="Dieta"
              description="Seguir dieta escolhida sem cheat meals"
            />
            <RuleCard
              number="2"
              title="Treinos"
              description="2 treinos de 45 minutos (1 outdoor)"
            />
            <RuleCard
              number="3"
              title="Água"
              description="3780ml (1 galão) por dia"
            />
            <RuleCard
              number="4"
              title="Leitura"
              description="10 páginas de livros educacionais"
            />
            <RuleCard
              number="5"
              title="Foto"
              description="Foto de progresso diária"
            />
            <RuleCard
              number="6"
              title="Álcool"
              description="Zero álcool durante 75 dias"
            />
          </div>
          <div className="mt-8 text-center">
            <p className="text-yellow-300 font-semibold text-lg">
              ⚠️ Falhar em qualquer item = Reset para o dia 1
            </p>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Tecnologias
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            <TechBadge>Next.js 14</TechBadge>
            <TechBadge>TypeScript</TechBadge>
            <TechBadge>Firebase</TechBadge>
            <TechBadge>IndexedDB</TechBadge>
            <TechBadge>PWA</TechBadge>
            <TechBadge>Tailwind CSS</TechBadge>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>75 Hard Challenge - Construindo disciplina através da tecnologia</p>
          <p className="text-sm mt-2">Desenvolvido com 💪 para alta confiabilidade</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 hover:bg-white/15 transition-colors">
      <div className="text-purple-300 mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-300 text-sm">{description}</p>
    </div>
  )
}

function RuleCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
          {number}
        </div>
        <h4 className="text-white font-semibold">{title}</h4>
      </div>
      <p className="text-gray-300 text-sm">{description}</p>
    </div>
  )
}

function TechBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-4 py-2 bg-white/10 rounded-full text-white text-sm font-medium">
      {children}
    </span>
  )
}
