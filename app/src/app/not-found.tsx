import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
        <p className="text-muted text-lg mb-8">הדף שחיפשת לא נמצא</p>
        <Link href="/" className="bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl px-6 py-3">
          חזרה לעמוד הבית
        </Link>
      </div>
    </div>
  )
}
