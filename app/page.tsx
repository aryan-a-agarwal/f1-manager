"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadCareer } from "@/lib/career";

export default function RootPage() {
  const router = useRouter();
  useEffect(() => router.replace(loadCareer() ? "/game" : "/setup"), [router]);
  return <main className="loading-screen">Preparing the 2027 paddock…</main>;
}
