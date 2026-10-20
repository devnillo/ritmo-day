import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { getCurrentUser } from "@/server/auth/session";

export async function SidebarUser() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{user.name}</p>
        <p className="truncate text-xs text-foreground/70">{user.email}</p>
      </div>
      <SignOutButton />
    </div>
  );
}
