"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadCareer } from "@/lib/career";

export default function RootPage() {
  const router = useRouter();
  useEffect(() => { try { router.replace(loadCareer() ? "/game" : "/setup"); } catch { router.replace("/game"); } }, [router]);
  return <main className="loading-screen">Preparing the 2027 paddock…</main>;
}
