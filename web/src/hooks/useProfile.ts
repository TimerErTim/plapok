import { tables } from "@/spacetimedb_bindings";
import { Profile } from "@/spacetimedb_bindings/types";
import { table } from "spacetimedb";
import { useReducer, useTable } from "spacetimedb/react";

export default function useProfile({
    onUpdate
}: {
    onUpdate?: (profile: Profile) => void
} = {}) {
    const [profileRows, isReady] = useTable(tables.my_profile, {
        onUpdate: (oldProfile, newProfile) => {
            onUpdate?.(newProfile)
        }
    });
    const profile = profileRows[0] ?? null;

    return { profile, isReady }
}