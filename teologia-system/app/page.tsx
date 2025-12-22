import Link from 'next/link'
import PublicLayout from '@/components/public-layout'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Users, Award, ShieldCheck, GraduationCap, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function HomePage() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Escola de Educação Teológica das Assembleias de Deus
            </h1>
            <p className="text-xl md:text-2xl mb-12 text-blue-100 max-w-4xl mx-auto">
              Formando líderes com excelência pentecostal. Um programa de formação contínua, do Básico ao Avançado, fundamentado na Palavra de Deus.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                href="/matricula"
                className={cn(buttonVariants({ size: 'lg' }), "w-full sm:w-auto text-lg px-8 py-6 bg-yellow-500 hover:bg-yellow-600 text-blue-900 font-bold")}
              >
                QUERO ME MATRICULAR
              </Link>
            </div>


          </div>
        </div>
      </section>

      {/* Institutional / Features */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Por que escolher a EETAD?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Desde 1979 promovendo o ensino bíblico para o aperfeiçoamento de obreiros e leigos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-6 border-t-4 border-t-yellow-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <Flame className="h-12 w-12 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">Identidade Pentecostal</h3>
                <p className="text-gray-600">
                  Teologia séria com ênfase na ação do Espírito Santo e compromisso com a inerrância bíblica.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 border-t-4 border-t-blue-600 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <ShieldCheck className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">Reconhecida</h3>
                <p className="text-gray-600">
                  Instituição respeitada e reconhecida pela CGADB e CONAMAD.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 border-t-4 border-t-green-600 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <Award className="h-12 w-12 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">Certificação</h3>
                <p className="text-gray-600">
                  Certificados emitidos a cada ciclo concluído, validando seu progresso ministerial.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Cursos / Ciclos */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Programa de Formação em Teologia
            </h2>
            <p className="text-xl text-gray-600">
              Um currículo unificado e progressivo dividido em 3 ciclos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 1º Ciclo */}
            <Card className="overflow-hidden flex flex-col h-full hover:border-blue-500 transition-colors">
              <div className="bg-blue-600 text-white p-6">
                <span className="text-blue-200 font-bold text-sm tracking-widest">1º CICLO</span>
                <h3 className="text-2xl font-bold mt-1">Nível Básico</h3>
                <p className="text-blue-100 mt-2">Fundamentação Factual</p>
              </div>
              <CardContent className="p-6 flex-1 flex flex-col">
                <p className="text-gray-600 mb-6">
                  Focado no conhecimento bíblico fundamental e fatos históricos essenciais para a fé cristã.
                </p>
                <div className="mt-auto">
                  <strong className="block text-gray-900 mb-2">Disciplinas incluem:</strong>
                  <ul className="space-y-2 text-sm text-gray-600 mb-6">
                    <li>• Bibliologia</li>
                    <li>• Teologia Bíblica</li>
                    <li>• Os Evangelhos</li>
                    <li>• Pentateuco</li>
                  </ul>
                  <div className="text-sm font-semibold text-blue-600 bg-blue-50 p-3 rounded text-center">
                    Duração média: 12 meses
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2º Ciclo */}
            <Card className="overflow-hidden flex flex-col h-full hover:border-yellow-500 transition-colors">
              <div className="bg-blue-800 text-white p-6">
                <span className="text-blue-200 font-bold text-sm tracking-widest">2º CICLO</span>
                <h3 className="text-2xl font-bold mt-1">Nível Médio</h3>
                <p className="text-blue-100 mt-2">Aprofundamento Analítico</p>
              </div>
              <CardContent className="p-6 flex-1 flex flex-col">
                <p className="text-gray-600 mb-6">
                  Ênfase em matérias analíticas e doutrinárias, aprofundando a compreensão teológica sistemática.
                </p>
                <div className="mt-auto">
                  <strong className="block text-gray-900 mb-2">Disciplinas incluem:</strong>
                  <ul className="space-y-2 text-sm text-gray-600 mb-6">
                    <li>• Teologia Sistemática</li>
                    <li>• Hermenêutica</li>
                    <li>• História da Igreja</li>
                    <li>• Profetas Maiores e Menores</li>
                  </ul>
                  <div className="text-sm font-semibold text-blue-800 bg-blue-50 p-3 rounded text-center">
                    + 12 meses de estudo
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3º Ciclo */}
            <Card className="overflow-hidden flex flex-col h-full hover:border-green-500 transition-colors">
              <div className="bg-blue-900 text-white p-6">
                <span className="text-blue-200 font-bold text-sm tracking-widest">3º CICLO</span>
                <h3 className="text-2xl font-bold mt-1">Nível Avançado</h3>
                <p className="text-blue-100 mt-2">Formação Instrumental</p>
              </div>
              <CardContent className="p-6 flex-1 flex flex-col">
                <p className="text-gray-600 mb-6">
                  Abordagem crítica e instrumental, preparando o aluno com ferramentas para o ministério prático e liderança.
                </p>
                <div className="mt-auto">
                  <strong className="block text-gray-900 mb-2">Disciplinas incluem:</strong>
                  <ul className="space-y-2 text-sm text-gray-600 mb-6">
                    <li>• Exegese Bíblica</li>
                    <li>• Teologia Pastoral</li>
                    <li>• Missiologia</li>
                    <li>• Homilética</li>
                  </ul>
                  <div className="text-sm font-semibold text-blue-900 bg-blue-50 p-3 rounded text-center">
                    Certificação Final
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section with EETAD context */}
      <section className="py-16 bg-blue-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-yellow-500 mb-2">40+</div>
              <div className="text-blue-100">Anos de História</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-yellow-500 mb-2">100k+</div>
              <div className="text-blue-100">Alunos Formados</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-yellow-500 mb-2">BR</div>
              <div className="text-blue-100">Abrangência Nacional</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-yellow-500 mb-2">3</div>
              <div className="text-blue-100">Ciclos de Formação</div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}