import { invoke } from "@/common";
import { Profile } from "@/spacetimedb_bindings/types";
import { avataaarsNeutral, thumbs } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { useMemo } from "react";

type ProfileProps = Pick<Profile, "avatar" | "name" | "identity">

export default function useAvatar(profile: ProfileProps | null) {
    const seed = invoke(() => {
        if (!profile) {
            return null
        }

        switch (profile.avatar.tag) {
            case "FromName":
                return profile.name
            case "FromIdentity":
                return profile.identity.toString()
            default:
                return profile.avatar.tag
        }
    })

    const avatar = useMemo(() => {
        if (!seed) {
            return null
        }

        return createAvatar(avataaarsNeutral, {
            "backgroundColor": [
                "ae5d29",
                "f8d25c",
                "fd9841",
                "b6e3f4",
                "c0aede",
                "ffdfbf",
                "614335",
                "0a835b",
            ],
            scale: 80,
            "seed": seed
        });
    }, [seed]);

    return avatar
}