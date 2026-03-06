import DbProvider from "./spacetimedb";

export function GlobalProviders({ children }: { children: React.ReactNode }) {
  return (
    <DbProvider>
      {children}
    </DbProvider>
  );
}

export function RoomProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}