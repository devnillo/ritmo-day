/** Versão em tabela de um gráfico, para leitores de tela e para quem prefere números. */
export function DataTable({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: [string, string];
  rows: [string, string][];
}) {
  return (
    <details className="mt-2 text-sm">
      <summary className="cursor-pointer text-foreground/70">Ver em tabela</summary>
      <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border">
        <table className="w-full text-left">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 bg-muted">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">
                {columns[0]}
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                {columns[1]}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map(([label, value]) => (
              <tr key={label}>
                <td className="px-3 py-1.5">{label}</td>
                <td className="px-3 py-1.5">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
