import { reducers } from "@/spacetimedb_bindings";
import { ParticipantRole, ParticipantView, RoomView, VoteStateView } from "@/spacetimedb_bindings/types";
import { Button, cn, Spinner } from "@heroui/react";
import { useState } from "react";
import { useReducer } from "spacetimedb/react";
import { GiCardPick } from "react-icons/gi";
import { GiCardExchange } from "react-icons/gi";

export default function RevealCardsSection({connectedRoom, myParticipant}: {connectedRoom: RoomView, myParticipant: ParticipantView}) {
    const revealRoom = useReducer(reducers.revealRoom)
    const unrevealRoom = useReducer(reducers.unrevealRoom)

    const [isSubmitting, setIsSubmitting] = useState(false)
    
    const isModerator = myParticipant.role.tag === ParticipantRole.Moderator.tag
    const allVotablePlayers = connectedRoom.participants.filter(participant => participant.role.tag != ParticipantRole.Spectator.tag)
    const allPlayersVoted = allVotablePlayers.every(participant => participant.voteState.tag === VoteStateView.Voted.tag || participant.voteState.tag === "Revealed")

    const showRevealButton = isModerator && allPlayersVoted && !connectedRoom.revealed
    const showUnrevealButton = isModerator && connectedRoom.revealed

function handleRevealCards() {
    setIsSubmitting(true)
    revealRoom()
    .catch((error) => {
        console.error(error)
    })
    .finally(() => {
        setIsSubmitting(false)
    })
}

function handleUnrevealCards() {
    setIsSubmitting(true)
    unrevealRoom()
    .catch((error) => {
        console.error(error)
    })
    .finally(() => {
        setIsSubmitting(false)
    })
}

    return !showUnrevealButton ? <Button className={cn(!showRevealButton && "invisible")} onPress={handleRevealCards} isPending={isSubmitting}>
        {({isPending}) => <>
            {isPending ? <Spinner color="current" size="sm" /> : <GiCardPick />}
            Reveal Cards
        </>}
    </Button> : <Button onPress={handleUnrevealCards} isPending={isSubmitting}>
        {({isPending}) => <>
            {isPending ? <Spinner color="current" size="sm" /> : <GiCardExchange />}
            Next Round
        </>}
    </Button>
}