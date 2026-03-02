"use client";

import { useMemo } from "react";
import { DbConnection } from "@/module_bindings";
import { SpacetimeDBProvider } from "spacetimedb/react";
import { RitualView } from "@/components/RitualView";

function AppContent() {
  return (
    <main className="h-screen flex flex-col overflow-hidden">
      <RitualView />
    </main>
  );
}

export default function CatchAllPage() {
  const uri = process.env.NEXT_PUBLIC_SPACETIMEDB_URI ?? "http://localhost:3000";
  const dbName = process.env.NEXT_PUBLIC_SPACETIMEDB_MODULE ?? "hive-author-01";
  var localStorage = typeof window !== "undefined" && window.localStorage ? window.localStorage : null

  const connectionBuilder = useMemo(
    () =>
      DbConnection.builder()
        .withUri(uri)
        .withDatabaseName(dbName)
        .onConnectError((_ctx, err) => {
          console.error("SpacetimeDB connection error:", err);
        })
        .onConnect((conn) => {
          if (typeof conn.token === "string" && localStorage !== null) {
            window.localStorage.setItem("spacetime-token", conn.token);
          }
        })
        .withToken(localStorage !== null ? localStorage.getItem("spacetime-token") ?? undefined : undefined),
    [uri, dbName]
  );

  return (
    <SpacetimeDBProvider connectionBuilder={connectionBuilder}>
      <AppContent />
    </SpacetimeDBProvider>
  );
}
