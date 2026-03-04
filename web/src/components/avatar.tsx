import { createAvatar } from '@dicebear/core';
import { thumbs } from '@dicebear/collection';
import { Profile } from '@/spacetimedb_bindings/types';

export function AvatarIcon({ profile, className }: { profile: Profile, className?: string }) {
    let seed: string;
    switch (profile.avatar.tag) {
        case 'FromName':
            seed = profile.name;
            break;
        case 'FromIdentity':
            seed = profile.identity.toString();
            break;
        default:
            seed = profile.avatar.tag;
    }
    
    const avatarResult = createAvatar(thumbs, {
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

    return <img className={className} src={avatarResult.toDataUri()} />;
}