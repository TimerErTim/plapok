import { Avatar, Button, Card, CardHeader, CardTitle, Description, FieldError, Form, Input, Label, Spinner, TextField } from "@heroui/react";
import { FormEvent, useState } from "react";
import { FaCheck, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { formatAvatarTag, validateProfileName, getPreviousAvatarVariant, getNextAvatarVariant } from "@/common/profile";
import { reducers } from "@/spacetimedb_bindings";
import { useReducer, useSpacetimeDB } from "spacetimedb/react";
import { Avatar as AvatarType } from "@/spacetimedb_bindings/types";
import useAvatar from "@/hooks/useAvatar";

export default function ProfileCreation() {
    const { isActive, identity } = useSpacetimeDB()

    const createProfile = useReducer(reducers.createProfile)

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [name, setName] = useState("")
    const [avatar, setAvatar] = useState<AvatarType>(AvatarType.FromIdentity)
    const [error, setError] = useState<string | null>(null)
    const avatarResult = identity ? useAvatar({ name, avatar, identity }) : null

    function onSubmit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        setIsSubmitting(true)
        setError(null)
        createProfile({ name, avatar })
            .then(() => {
                // NoOp
            }).catch((error) => {
                setError(String(error.message))
                console.error(error)
            }).finally(() => {
                setIsSubmitting(false)
            })
    }

    function handleAvatarSetPrevious() {
        setAvatar(getPreviousAvatarVariant(avatar))
    }

    function handleAvatarSetNext() {
        setAvatar(getNextAvatarVariant(avatar))
    }

    function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
        setName(e.target.value)
        setError(validateProfileName(e.target.value))
    }

    return (
        <Card className="w-full max-w-96">
            <CardHeader>
                <CardTitle>Profile Creation</CardTitle>
                <Card.Description>
                    Create a profile to get started.
                </Card.Description>
            </CardHeader>
            <Card.Content>
                <Form className="flex flex-col gap-4" onSubmit={onSubmit}>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="avatar">Avatar</Label>
                        <div className="flex flex-row items-center justify-center">
                            <Avatar className="size-24 rounded-lg shadow-lg" id="avatar">
                                <Avatar.Image src={avatarResult?.toDataUri()} />
                                <Avatar.Fallback>?</Avatar.Fallback>
                            </Avatar>
                        </div>
                        <div className="flex flex-row items-center gap-2 mx-8">
                            <Button variant="ghost" isIconOnly size="sm" onPress={handleAvatarSetPrevious}><FaChevronLeft /></Button>
                            <div className="flex flex-row items-center grow justify-center">
                                {formatAvatarTag(avatar.tag)}
                            </div>
                            <Button variant="ghost" isIconOnly size="sm" onPress={handleAvatarSetNext}><FaChevronRight /></Button>
                        </div>
                    </div>

                    <TextField
                        validationBehavior="aria"
                        isInvalid={error != null}
                        type="text"
                    >
                        <Label>Name</Label>
                        <Input placeholder="Enter your display name" variant="secondary" value={name} onChange={handleNameChange}/>
                        <Description>Must be between 2 and 20 characters</Description>
                        <FieldError>{error}</FieldError>
                    </TextField>

                    <div className="flex gap-2">
                        <Button type="submit" fullWidth isPending={isSubmitting} isDisabled={isSubmitting || error != null}>
                            {({ isPending }) => (
                                <>
                                    {isPending ? <Spinner color="current" size="sm" /> : <FaCheck />}
                                    Create
                                </>
                            )}
                        </Button>
                    </div>
                </Form>
            </Card.Content>
        </Card>
    )
}