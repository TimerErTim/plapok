import { useMemo, useState } from 'react';
import { createAvatar } from '@dicebear/core';
import { thumbs } from '@dicebear/collection';
import useProfile from '@/hooks/useProfile';
import { Avatar, Button, Input, Label, Popover, Skeleton } from '@heroui/react';
import { useReducer, useSpacetimeDB } from 'spacetimedb/react';
import { reducers } from '@/spacetimedb_bindings';
import useAvatar from '@/hooks/useAvatar';
import { cx } from 'tailwind-variants';

export default function ProfileIcon({ className }: { className?: string }) {
  const profile = useProfile()
  const { isActive } = useSpacetimeDB()
  const setProfileName = useReducer(reducers.profileSetName)
  const setProfileAvatar = useReducer(reducers.profileSetAvatar)


  const [editedName, setEditedName] = useState(profile?.name ?? "")
  const [editedAvatar, setEditedAvatar] = useState(profile?.avatar ?? null)
  
  function resetEdited() {
    setEditedName(profile?.name ?? "")
    setEditedAvatar(profile?.avatar ?? null)
  }

  const avatar = useAvatar(profile)
  const avatarToShow = useMemo(() => {
    return <Avatar className={className}>
      {profile && avatar && <Avatar.Image
        alt={profile.name}
        src={avatar.toDataUri()}
      />}
      <Avatar.Fallback>?</Avatar.Fallback>
    </Avatar>
  }, [profile, avatar]);

  return <Popover>
    <Popover.Trigger className={cx(!profile && "invisible")}>{avatarToShow}</Popover.Trigger>
    <Popover.Content>
    <Popover.Arrow />
      <Popover.Dialog>
        <Popover.Heading>Profile</Popover.Heading>
        <div className="flex flex-col gap-4">
          <Input value={editedName} onChange={(e) => setEditedName(e.target.value)}className="h-6 border-2 border-accent" />
        <Button variant="tertiary" fullWidth size="sm">Save</Button>
        </div>
      </Popover.Dialog>
    </Popover.Content>
  </Popover>;
}