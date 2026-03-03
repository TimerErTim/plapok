import { createAvatar } from '@dicebear/core';
import { thumbs } from '@dicebear/collection';

function AvatarIcon({ profile, className }: { avatar: Profile, className: string }) {
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
        "seed": avatar
    });

    return <img className={className} src={avatarResult.toDataUri()} />;
}