import { tables } from "@/spacetimedb_bindings";
import { useMemo } from "react";
import { useSpacetimeDB, useTable } from "spacetimedb/react";

export default function useConnectionRoom() {
    const { connectionId } = useSpacetimeDB()
    const [rooms, roomReady] = useTable(tables.my_participating_rooms)
    const connectedRoom = useMemo(() => {
        if (!connectionId) return null
        return rooms.find(room => room.myConnections.some(conn =>  connectionId.equals(conn)))
    }, [rooms, connectionId, roomReady])

    return { connectedRoom, roomReady: roomReady || !!connectedRoom }
}