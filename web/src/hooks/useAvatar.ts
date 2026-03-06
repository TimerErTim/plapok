import { invoke } from "@/common";
import { Profile } from "@/spacetimedb_bindings/types";
import { thumbs } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { useMemo } from "react";

export default function useAvatar(profile: Profile | null) {
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
    
        return createAvatar(thumbs, {
            "flip": true,
            "rotate": 10,
            "backgroundColor": [
                "0a5b83",
                "69d2e7",
                "f1f4dc",
                "f88c49",
                "ffd5dc",
                "ffdfbf",
                "d1d4f9",
                "c0aede",
                "b6e3f4"
            ],
            "backgroundType": [
                "gradientLinear"
            ],
            "seed": seed
        });
      }, [seed]);

    return avatar
}