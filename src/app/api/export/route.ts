import { buildUserExport } from "@/features/privacy/export";
import { getCurrentUser } from "@/server/auth/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: { code: "UNAUTHENTICATED" } }, { status: 401 });
  }

  const { fileName, data } = await buildUserExport(user.id);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      // Dados pessoais: nunca guardar em cache de navegador ou proxy.
      "Cache-Control": "no-store",
    },
  });
}
