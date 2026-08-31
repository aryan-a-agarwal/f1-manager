"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();
  useEffect(() => router.replace(window.localStorage.getItem("f1-manager-team") ? "/game" : "/setup"), [router]);
  return <main className="loading-screen">Preparing the 2027 paddock…</main>;
}
