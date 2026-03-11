import { Button, Modal, Spinner, Tooltip } from "@heroui/react";
import { useReducer } from "spacetimedb/react";
import { reducers } from "@/spacetimedb_bindings";
import { FaWrench } from "react-icons/fa";
import { RoomView } from "@/spacetimedb_bindings/types";
import { useState } from "react";
import { cx } from "tailwind-variants";

export default function RoomSettingsModal({ connectedRoom }: { connectedRoom: RoomView }) {
    const makeRoomPermanent = useReducer(reducers.makeRoomPermanent)
    const isRoomPermanent = connectedRoom.permanent
    const [isMakingRoomPermanent, setIsMakingRoomPermanent] = useState(false)


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


    return (
        <Modal>
            <Button variant="ghost" isIconOnly>
                <FaWrench />
            </Button>
            <Modal.Backdrop variant="transparent">
                <Modal.Container>
                    <Modal.Dialog>
                        <Modal.CloseTrigger /> {/* Optional: Close button */}
                        <Modal.Header>
                            <Modal.Heading>
                                Configure Room Settings
                            </Modal.Heading>
                        </Modal.Header>
                        <Modal.Body>

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

                            
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}