import { Button, Description, FieldError, Input, InputGroup, Label, ListBox, Modal, Spinner, TextField, Tooltip } from "@heroui/react";
import { useReducer } from "spacetimedb/react";
import { reducers } from "@/spacetimedb_bindings";
import { FaArrowLeft, FaCheck, FaWrench } from "react-icons/fa";
import { TbCards, TbPlayCardStar } from "react-icons/tb";
import { DeckCard, RoomView } from "@/spacetimedb_bindings/types";
import { useState } from "react";
import { cx } from "tailwind-variants";

export default function RoomSettingsModal({ connectedRoom }: { connectedRoom: RoomView }) {
    const makeRoomPermanent = useReducer(reducers.makeRoomPermanent)
    const setRoomDeck = useReducer(reducers.setRoomDeck)
    const isRoomPermanent = connectedRoom.permanent

    const [newLocalDeck, setNewLocalDeck] = useState<string | null>(null)

    const [isMakingRoomPermanent, setIsMakingRoomPermanent] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [savingError, setSavingError] = useState<string | null>(null)

    const renderedDeck = newLocalDeck ?? connectedRoom.currentDeck.map((card) => card.symbol).join(", ")


    function handleMakeRoomPermanent() {
        setIsMakingRoomPermanent(true)
        makeRoomPermanent()
            .catch((error) => {
                console.error(error)
            })
            .finally(() => {
                setIsMakingRoomPermanent(false)
            })
    }

    function evalDeckValidity(): string | Array<DeckCard> {
        const newDeck = newLocalDeck ? newLocalDeck.split(",").map(symbol => symbol.trim()).filter(symbol => symbol.length > 0).map((symbol) => {
            // Find id of existing current deck if possible
            const existingCard = connectedRoom.currentDeck.find((card) => card.symbol === symbol)
            if (existingCard) {
                return { id: existingCard.id, symbol: symbol }
            }

            // If not, create a new random one
            const id = Math.floor(Math.random() * 1000000)
            return { id: BigInt(id), symbol: symbol }
        }) : []

        if (newDeck.length === 0) {
            return "Empty deck changes detected"
        }

        return newDeck
    }

    function handleSave({ successCallback }: { successCallback?: () => void }) {
        const newDeck = evalDeckValidity()
        if (typeof newDeck === "string") {
            setSavingError(newDeck)
            return
        }


        setIsSaving(true)
        setRoomDeck({ newDeck: newDeck })
            .catch((error) => {
                setSavingError(String(error.message))
                console.error(error)
            })
            .then(() => {
                successCallback?.()
                setNewLocalDeck(null)
            })
            .finally(() => {
                setIsSaving(false)
            })
    }

    function handleDeckChange(e: React.ChangeEvent<HTMLInputElement>) {
        setNewLocalDeck(e.target.value)
        setSavingError(null)
    }

    return (
        <Modal>
            <Button variant="ghost" isIconOnly>
                <FaWrench />
            </Button>
            <Modal.Backdrop variant="transparent">
                <Modal.Container>
                    <Modal.Dialog>
                        {({ close }) => <>
                            <Modal.CloseTrigger /> {/* Optional: Close button */}
                            <Modal.Header>
                                <Modal.Heading>
                                    Configure Room Settings
                                </Modal.Heading>
                            </Modal.Header>
                            <Modal.Body>
                                <TextField isInvalid={savingError != null} type="text" validationBehavior="aria" variant="secondary" className={"w-full p-1"}>
                                    <Label>Card Deck</Label>
                                    <InputGroup >
                                        <InputGroup.Prefix><TbCards /></InputGroup.Prefix>
                                        <InputGroup.Input value={renderedDeck} onChange={handleDeckChange} placeholder="Enter your deck..." />
                                    </InputGroup>
                                    <FieldError>{savingError}</FieldError>
                                </TextField>
                            </Modal.Body>
                            <Modal.Footer className="flex flex-row justify-between">
                                {!isRoomPermanent ? <Tooltip>
                                    <Tooltip.Trigger>
                                        <Button variant="secondary" onPress={handleMakeRoomPermanent} isPending={isMakingRoomPermanent}>
                                            {({ isPending }) => (
                                                <>
                                                    {isPending && <Spinner color="current" size="sm" />}
                                                    Make Permanent
                                                </>
                                            )}
                                        </Button>
                                    </Tooltip.Trigger>
                                    <Tooltip.Content showArrow placement="bottom" offset={10} className="w-max">
                                        <Tooltip.Arrow />
                                        <p>Retains the room even for prolonged</p>
                                        <p>times after all participants leave.</p>
                                    </Tooltip.Content>
                                </Tooltip> : <span className="text-success">Permanent Room</span>}
                                <Button onPress={() => handleSave({ successCallback: close })} isPending={isSaving} isDisabled={typeof evalDeckValidity() === "string"}>
                                    {({ isPending }) => (
                                        <>
                                            {isPending ? <Spinner color="current" size="sm" /> : <FaCheck />}
                                            Save
                                        </>
                                    )}
                                </Button>
                            </Modal.Footer>
                        </>}
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}