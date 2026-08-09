export default function QuoteNotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-5">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Quote link not found</h1>
        <p className="text-slate-600 mt-2 text-sm">
          This share link may be invalid or the quote is no longer available.
        </p>
      </div>
    </main>
  );
}
