export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Mermer Teklif Sistemi
        </h1>
        <p className="text-center text-muted-foreground">
          Teklif almak için <a href="/teklif" className="text-primary hover:underline">/teklif</a> sayfasını ziyaret edin.
        </p>
      </div>
    </main>
  );
}
