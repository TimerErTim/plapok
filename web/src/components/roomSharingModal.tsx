import { Button, Description, InputGroup, Label, labelVariants, Popover, Separator, TextField } from "@heroui/react";

import { Modal } from "@heroui/react";
import { FaCopy, FaShare, FaShareAlt } from "react-icons/fa";
import { getShareableRoomLink } from "@/common/room";
import QRCode from "react-qr-code";
import { useState } from "react";
import { AnyARecord } from "node:dns";

export default function RoomSharingModal({ roomCode }: { roomCode: string }) {
    const sharingUrl = getShareableRoomLink(roomCode)
    const [copiedFeedbackMessage, setCopiedFeedbackMessage] = useState<string | null>(null)
    const [copiedFeedbackTimeout, setCopiedFeedbackTimeout] = useState<any | null>(null)

    const sharePayload = {
        title: "Join my Plapok Room",
        text: "Accelerate our spring planning! Join my planning poker room:\n",
        url: sharingUrl,
    }

    const canShare = navigator.canShare && navigator.canShare(sharePayload)

    function handleUrlButtonPress() {
        if (canShare) {
            navigator.share(sharePayload)
        } else {
            navigator.clipboard.writeText(sharingUrl)
            clearTimeout(copiedFeedbackTimeout)
            setCopiedFeedbackMessage("Copied to clipboard")
            setCopiedFeedbackTimeout(setTimeout(() => {
                setCopiedFeedbackMessage(null)
            }, 2000))
        }
    }

    return <Modal>
        <Button variant="ghost" isIconOnly>
            <FaShareAlt />
        </Button>
        <Modal.Backdrop variant="transparent">
            <Modal.Container>
                <Modal.Dialog>
                    <Modal.CloseTrigger /> {/* Optional: Close button */}
                    <Modal.Header>
                        <Modal.Heading>
                            Invite Players
                        </Modal.Heading>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="w-full text-sm flex flex-col gap-1">
                            <p className={labelVariants({})}>Join URL</p>
                            <div className="flex flex-row items-center gap-1 justify-between bg-default rounded-lg p-1">
                                <p className="text-sm sm:text-base px-2 text-default-foreground shrink min-w-0 overflow-x-auto">{sharingUrl}</p>
                                <Popover isOpen={copiedFeedbackMessage !== null}>
                                    <Button isIconOnly aria-label={canShare ? "Share" : "Copy"} size="sm" variant="ghost" onPress={handleUrlButtonPress} className="text-muted hover:text-default-foreground">
                                        {canShare ? <FaShare /> : <FaCopy />}
                                    </Button>
                                    <Popover.Content className="p-1 text-xs" placement="top right">
                                        <Popover.Arrow />
                                        {copiedFeedbackMessage}
                                    </Popover.Content>
                                </Popover>
                            </div>
                            <Description>
                                Share the link with your players to join the room.
                            </Description>
                        </div>

                        <div className="flex items-center gap-4 opacity-50 my-2">
                            <Separator className="flex-1" />
                            <span className="text-tiny uppercase text-default-400">Or</span>
                            <Separator className="flex-1" />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>QR Code</Label>
                            <div className="self-center p-4 bg-white rounded-xl border border-border w-fit">
                                <QRCode value={sharingUrl} level="M" style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
                            </div>
                        </div>
                    </Modal.Body>
                </Modal.Dialog>
            </Modal.Container>
        </Modal.Backdrop>
    </Modal>
}
