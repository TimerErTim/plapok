import { Button, Card, ScrollShadow, Surface } from "@heroui/react"

import { reducers } from "@/spacetimedb_bindings"
import { useReducer } from "spacetimedb/react"
import { DeckCard, ParticipantView, RoomView } from "@/spacetimedb_bindings/types"
import { cn, cx } from "tailwind-variants"
import { useState } from "react"

export default function CardSelection({ connectedRoom, myParticipant }: { connectedRoom: RoomView, myParticipant: ParticipantView }) {
    const cancelMyVote = useReducer(reducers.cancelMyVote)
    const voteForCard = useReducer(reducers.voteForCard)

    const [localSelectedCard, setLocalSelectedCard] = useState<DeckCard | null | undefined>(undefined)

    function isCardSelected(card: DeckCard) {
        if (localSelectedCard === null) {
            return false
        }
        return localSelectedCard?.id === card.id || myParticipant.voteState.tag === "Revealed" && myParticipant.voteState.value.id === card.id
    }

    function handleCardClick(card: DeckCard) {
        const cardSelected = isCardSelected(card)
        if (cardSelected) {
            setLocalSelectedCard(null)
            cancelMyVote()
            .catch((error) => {
                console.error(error)
            })
            .finally(() => {
                setLocalSelectedCard(undefined)
            })
        } else {
            setLocalSelectedCard(card)
            function setVoteCard() {
                voteForCard({cardId: card.id})
                .catch((error) => {
                    console.error(error)
                })
                .finally(() => {
                    setLocalSelectedCard(undefined)
                })
            }
            if (myParticipant.voteState.tag !== "NotVoted") {
                cancelMyVote()
                .then(setVoteCard)
                .catch((error) => {
                    console.error(error)
                })
            } else {
                setVoteCard()
            }
        }
    }
                                                      
    return <Surface className="w-full">
        <ScrollShadow hideScrollBar orientation="horizontal" className="min-w-0 mx-auto overflow-y-visible flex flex-row justify-center-safe items-center gap-2 pb-2 pt-4 px-8 -mt-2 overflow-x-auto">

            {connectedRoom.currentDeck.map((card, index) => {
                const total = connectedRoom.currentDeck.length
                const center = (total - 1) / 2
                const maxRotation = 40 // degrees, you can adjust for desired "spread"
                const rotation = (index - center) * (total === 1 ? 0 : (maxRotation / center))
                const isSelected = isCardSelected(card)
                return <Button key={card.id} className={
                    cn("z-999 hover:-translate-y-3 transition-all min-w-12 h-16 hover:border-accent hover:border-1 overflow-hidden relative",
                        isSelected && "-translate-y-2",
                    )
                } variant="tertiary" onPress={() => handleCardClick(card)}>
                    <div className={cx("absolute flex items-center justify-center inset-0", isSelected && "bg-accent-soft")} inert>
                        <span>{card.symbol}</span>
                    </div>
                </Button>
            })}
        </ScrollShadow>
    </Surface>
}