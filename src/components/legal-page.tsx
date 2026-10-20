/** Tipografia de texto longo para as páginas legais. */
export function LegalPage({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <article className="max-w-2xl space-y-6 text-[0.95rem] leading-relaxed [&_h2]:pt-4 [&_h2]:text-lg [&_h2]:font-medium [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-foreground/70">Atualizado em {updatedAt}.</p>
      </header>
      {children}
    </article>
  );
}
