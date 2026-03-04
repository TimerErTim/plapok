import { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import { thumbs } from '@dicebear/collection';

export default function Avatar({ seed, className }: { seed: string, className?: string }) {
  const avatar = useMemo(() => {
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

  return <img src={avatar.toDataUri()} alt="Avatar" className={className} />;
}