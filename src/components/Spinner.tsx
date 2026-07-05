export default function Spinner() {
  return (
    <div role="status" aria-label="Loading" className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
    </div>
  )
}
