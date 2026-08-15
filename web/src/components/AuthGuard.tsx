"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import type { Role } from "@/lib/types";

export function AuthGuard({ children, role }: { children: ReactNode; role?: Role }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const roleMismatch = !!user && !!role && user.role !== role;

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (roleMismatch) router.replace("/dashboard");
  }, [loading, user, roleMismatch, router]);

  if (loading || !user || roleMismatch) return null;

  return <>{children}</>;
}
