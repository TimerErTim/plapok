import { tables } from "@/spacetimedb_bindings";
import { table } from "spacetimedb";
import { useReducer, useTable } from "spacetimedb/react";

export default function useProfile() {
    const [profileRows] = useTable(tables.my_profile);
    const profile = profileRows[0] ?? null;

    return profile
}