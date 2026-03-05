import { config } from "@/config";
import { DbConnection } from "@/spacetimedb_bindings";
import { useMemo } from "react";
import { SpacetimeDBProvider } from "spacetimedb/react";

export default function DbProvider({ children }: { children: React.ReactNode }) {
    const storage = typeof window !== "undefined" && window.localStorage ? window.localStorage : null;

    const connectionBuilder = useMemo(
        () =>
          DbConnection.builder()
            .withUri(config.spacetimeDbUri)
            .withDatabaseName(config.spacetimeDbModule)
            .onConnectError((_ctx, err) => {
              console.error("Cannot connect to SpacetimeDB:", err);
            })
            .onConnect((conn) => {
              console.log("Connected to SpacetimeDB");
              if (typeof conn.token === "string" && storage !== null) {
                storage.setItem("spacetime-token", conn.token);
              }
            })
            .onDisconnect(() => {
              console.warn("Disconnected from SpacetimeDB");
            })
            .withToken(
              storage !== null ? storage.getItem("spacetime-token") ?? undefined : undefined
            ),
        []
      );

  return (
    <SpacetimeDBProvider connectionBuilder={connectionBuilder}>
      {children}
    </SpacetimeDBProvider>
  );
}