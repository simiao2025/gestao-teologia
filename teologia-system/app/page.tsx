import Link from 'next/link'
import PublicLayout from '@/components/public-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Users, Award, Heart } from 'lucide-react'

export default function HomePage() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Curso de Teologia
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Formando líderes cristãos com excelência acadêmica e espiritual
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary">
                <Link href="/matricula">Faça sua matrícula</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/sobre">Saiba mais</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Por que estudar conosco?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Oferecemos uma formação completa e biblicamente fundamentada para servir a Deus e a comunidade
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <BookOpen className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Ensino de Qualidade</h3>
                <p className="text-gray-600">
                  Metodologia moderna com base bíblica sólida e professores experientes
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <Users className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Comunidade Ativa</h3>
                <p className="text-gray-600">
                  Rede de alunos e monitores em todo o país para crescimento conjunto
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <Award className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Formação Completa</h3>
                <p className="text-gray-600">
                  Preparação integral para o ministério com certificação reconhecida
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Disciplinas Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Níveis de Formação
            </h2>
            <p className="text-xl text-gray-600">
              Currículo progressivo para todos os níveis de conhecimento
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Básico */}
            <Card className="overflow-hidden">
              <div className="bg-green-600 text-white p-4">
                <h3 className="text-xl font-bold">Nível Básico</h3>
                <p className="text-green-100">Para iniciantes</p>
              </div>
              <CardContent className="p-6">
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Fundamentos da Fé</li>
                  <li>• História da Igreja</li>
                  <li>• Introdução à Teologia</li>
                  <li>• Hermenêutica Básica</li>
                </ul>
              </CardContent>
            </Card>

            {/* Médio */}
            <Card className="overflow-hidden">
              <div className="bg-yellow-600 text-white p-4">
                <h3 className="text-xl font-bold">Nível Médio</h3>
                <p className="text-yellow-100">Formação intermediária</p>
              </div>
              <CardContent className="p-6">
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Teologia Sistemática</li>
                  <li>• Exegese Bíblica</li>
                  <li>• História do Cristianismo</li>
                  <li>• Prática Pastoral</li>
                </ul>
              </CardContent>
            </Card>

            {/* Avançado */}
            <Card className="overflow-hidden">
              <div className="bg-red-600 text-white p-4">
                <h3 className="text-xl font-bold">Nível Avançado</h3>
                <p className="text-red-100">Formação especializada</p>
              </div>
              <CardContent className="p-6">
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Teologia Avançada</li>
                  <li>• Liderança Eclesiástica</li>
                  <li>• Missiologia</li>
                  <li>• Teologia Prática</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button asChild size="lg">
              <Link href="/disciplinas">Ver todas as disciplinas</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <Heart className="h-16 w-16 text-blue-200" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para começar sua jornada?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Junte-se a milhares de alunos que já estão sendo formados para servir
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link href="/matricula">Matricular-se agora</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/contato">Falar conosco</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600">Alunos Formados</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">50+</div>
              <div className="text-gray-600">Disciplinas</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">20+</div>
              <div className="text-gray-600">Subnúcleos</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">10+</div>
              <div className="text-gray-600">Anos de Experiência</div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}