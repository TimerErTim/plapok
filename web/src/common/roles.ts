import { Avatar, ParticipantRole } from "@/spacetimedb_bindings/types"

export const roleTags = Object.keys(ParticipantRole.variants) as (keyof typeof ParticipantRole.variants)[]

export function formatRoleTag(tag: ParticipantRole["tag"]): string {
    switch (tag) {
        case ParticipantRole.Moderator.tag:
            return "Moderator"
        case ParticipantRole.Player.tag:
            return "Player"
        case ParticipantRole.Spectator.tag:
            return "Spectator"
    }
}