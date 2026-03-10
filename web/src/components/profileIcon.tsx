import { useMemo, useState } from 'react';
import { createAvatar } from '@dicebear/core';
import { thumbs } from '@dicebear/collection';
import useProfile from '@/hooks/useProfile';
import { Avatar, Button, FieldError, Input, Label, Popover, Spinner, TextField } from '@heroui/react';
import { useReducer, useSpacetimeDB } from 'spacetimedb/react';
import { reducers } from '@/spacetimedb_bindings';
import useAvatar from '@/hooks/useAvatar';
import { Avatar as AvatarType } from '@/spacetimedb_bindings/types';
import { cx } from 'tailwind-variants';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { formatAvatarTag, getNextAvatarVariant, getPreviousAvatarVariant, validateProfileName } from '@/common/profile';



export default function ProfileIcon({ className }: { className?: string }) {
  const { profile } = useProfile()
  const setProfileNameAvatar = useReducer(reducers.profileSetNameAvatar)

  const [isDirtyState, setIsDirtyState] = useState(true)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [isProfileChangeSubmitting, setIsProfileChangeSubmitting] = useState(false)
  const [nameValidationError, setNameValidationError] = useState<string | null>(null)
  const [editedName, setEditedName] = useState("")
  const [editedAvatar, setEditedAvatar] = useState<AvatarType>(AvatarType.FromIdentity)
  const editedAvatarResult = useAvatar((profile) ? {
    avatar: editedAvatar,
    name: editedName,
    identity: profile.identity,
  } : null)

  function handlePopoverOpenChange(open: boolean) {
    setPopoverOpen(open)
    if (open && isDirtyState) {
      synchronizeFieldsFromDb()
    }
  }

  function handleProfileChangeSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsProfileChangeSubmitting(true)
    setProfileNameAvatar({
      name: editedName,
      avatar: editedAvatar,
    }).then(() => {
      setIsDirtyState(true)
      setPopoverOpen(false)
    }).catch((error) => {
      setNameValidationError(String(error.message))
      console.error(error)
    }).finally(() => {
      setIsProfileChangeSubmitting(false)
    })
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEditedName(e.target.value)
    setNameValidationError(validateProfileName(e.target.value))
  }

  function handleAvatarSetNext() {
    setEditedAvatar(getNextAvatarVariant(editedAvatar))
  }

  function handleAvatarSetPrevious() {
    setEditedAvatar(getPreviousAvatarVariant(editedAvatar))
  }

  function synchronizeFieldsFromDb() {
    setIsDirtyState(false)
    setEditedName(profile?.name ?? "")
    setEditedAvatar(profile?.avatar ?? AvatarType.FromIdentity)
  }

  const avatar = useAvatar(profile)

  return <Popover isOpen={popoverOpen} onOpenChange={handlePopoverOpenChange}>
    <Popover.Trigger className={cx("flex flex-row items-center gap-2", !profile && "invisible")} tabIndex={0}>
      <span className="text-sm font-medium max-w-20 truncate">{profile?.name}</span>
      <Avatar className={className}>
        {profile && avatar && <Avatar.Image
          alt={profile.name}
          src={avatar.toDataUri()}
        />}
        <Avatar.Fallback>?</Avatar.Fallback>
      </Avatar>
    </Popover.Trigger>
    <Popover.Content>
      <Popover.Arrow />
      <Popover.Dialog className="flex flex-col gap-2">
        <Popover.Heading>Profile</Popover.Heading>
        <div className="flex flex-row gap-2">
        <Avatar className="rounded-lg size-16 shadow-lg">
            {editedAvatarResult && <Avatar.Image src={editedAvatarResult.toDataUri()} />}
          </Avatar>
          <div className="flex flex-row gap-2 grow items-center justify-between">
            <Button variant='ghost' isIconOnly size='sm' onPress={handleAvatarSetPrevious}><FaChevronLeft/></Button>
            <div className="flex flex-row items-center grow justify-center">
              {formatAvatarTag(editedAvatar.tag)}
            </div>
            <Button variant='ghost' isIconOnly size='sm' onPress={handleAvatarSetNext}><FaChevronRight/></Button>
          </div>
        </div>
        <form className="flex flex-col gap-2" onSubmit={handleProfileChangeSubmit}>
        <TextField className="w-64" isInvalid={nameValidationError != null}>
      <Input id="username" value={editedName} onChange={handleNameChange} className="h-8" variant='secondary' />
      {nameValidationError && <FieldError>{nameValidationError}</FieldError>}
    </TextField>
          
          <Button variant="tertiary" fullWidth size="sm" className="h-8" isPending={isProfileChangeSubmitting} type="submit">
            {({ isPending }) => (
              <>
                {isPending && <Spinner color="current" size="sm" />}
                Save
              </>
            )}
          </Button>
        </form>
      </Popover.Dialog>
    </Popover.Content>
  </Popover>;
}