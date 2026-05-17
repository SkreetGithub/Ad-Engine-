"use client"

import { AddyProvider } from "@/components/providers/addy-provider"

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <AddyProvider>{children}</AddyProvider>
}
