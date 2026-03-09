import { Avatar } from "@/spacetimedb_bindings/types"

export const avatarTags = Object.keys(Avatar.variants).filter(
    variant => variant !== Avatar.FromName.tag
  ) as (keyof typeof Avatar.variants)[]
  
export function formatAvatarTag(tag: Avatar["tag"]): string {
    switch (tag) {
      case Avatar.FromIdentity.tag:
        return "You 💖"
      default:
        return tag
    }
  }

export function getNextAvatarVariant(avatar: Avatar): Avatar {
    const currentIndex = avatarTags.indexOf(avatar.tag)
    const nextIndex = (currentIndex + 1) % avatarTags.length
    return { tag: avatarTags[nextIndex] as Avatar["tag"] }
}

export function getPreviousAvatarVariant(avatar: Avatar): Avatar {
    const currentIndex = avatarTags.indexOf(avatar.tag)
    const previousIndex = (currentIndex - 1 + avatarTags.length) % avatarTags.length
    return { tag: avatarTags[previousIndex] as Avatar["tag"] }
}

export function validateProfileName(name: string): string | null {
    const trimmedName = name.trim()
    if (trimmedName.length < 2) {
        return "Must be at least 2 characters long"
    }
    if (trimmedName.length > 20) {
        return "Must be less than 20 characters long"
    }
    return null
}
