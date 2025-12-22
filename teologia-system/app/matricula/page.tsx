import MatriculaForm from '@/components/matricula-form'

export default function MatriculaPage() {
  return (
    <main className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 bg-gray-100/80 backdrop-blur-sm z-0" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900/10 to-transparent z-0" />

      {/* Centered Form */}
      <div className="relative z-10 w-full max-w-2xl">
        <MatriculaForm />
      </div>
    </main>
  )
}