import { ParticipantRole, ParticipantView, Profile, RoomView, VoteStateView } from "@/spacetimedb_bindings/types";
import { reducers } from "@/spacetimedb_bindings";
import { useReducer, useSpacetimeDB } from "spacetimedb/react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Avatar, Button, Card, Drawer, InputGroup, Label, ListBox, Modal, ScrollShadow, Select, Separator, Surface, SurfaceContext, TextArea, TextField, Tooltip } from "@heroui/react";
import { cx, cn } from "tailwind-variants";
import { getAvatar } from "@/hooks/useAvatar";
import { formatRoleTag, roleTags } from "@/common/roles";
import { FaCopy, FaGlobe, FaShare } from "react-icons/fa";
import { FiMenu } from "react-icons/fi";
import { getShareableRoomLink } from "@/common/room";
import RoomSharingModal from "./roomSharingModal";
import RoomSettingsModal from "./roomSettingsModal";
import FeedbackModal from "./feedbackModal";
import CardSelection from "./cardSelection";
import TopicArea from "./topicArea";
import CurrentVoting from "./currentVoting";
import RevealCardsSection from "./revealCardsSection";
import RevealedVote from "./revealedVote";
import { formatDateTime } from "@/common/timestamp";
import SidebarRoom from "./sidebarRoom";

function useMyParticipant(connectedRoom: RoomView): ParticipantView {
    const navigate = useNavigate()
    const { identity } = useSpacetimeDB()
    if (!identity) {
        throw new Error("No identity found")
    }
    const myParticipant = useMemo(() => {
        const participant = connectedRoom.participants.find(participant => identity.equals(participant.profile.identity))
        if (!participant) {
            console.error("Not part of the room, should never happen", identity)
            navigate("/")
        }
        return participant as ParticipantView
    }, [connectedRoom, identity])

    return myParticipant
}

export default function WholeRoom({ connectedRoom }: { connectedRoom: RoomView }) {
    const setParticipantRole = useReducer(reducers.setParticipantRole)

    // Myself
    const myParticipant = useMyParticipant(connectedRoom)
    const isModerator = myParticipant.role.tag === ParticipantRole.Moderator.tag
    const isPlayer = myParticipant.role.tag === ParticipantRole.Player.tag
    const isSpectator = myParticipant.role.tag === ParticipantRole.Spectator.tag

    const sidebarContent = <SidebarRoom connectedRoom={connectedRoom} myParticipant={myParticipant} />

    return (<>
        <div className="grow shrink grid grid-rows-[max-content_minmax(0,1fr)] grid-cols-[max-content_auto] min-h-0 space-x-4">
            <div className="row-span-2 min-h-0 hidden sm:block">
                {sidebarContent}
            </div>

            <div className="flex flex-row items-center justify-between gap-4 col-start-2">
                <div className="flex flex-col gap-1 items-start font-bold grow h-full py-1">
                    <Drawer>
                        <Button variant="ghost" className="sm:hidden" size="sm"><FiMenu /> Room Details</Button>
                        <Drawer.Backdrop>
                            <Drawer.Content placement="left" className="h-full p-0 w-fit">
                                <Drawer.Dialog className="w-fit h-full p-0">
                                    <Drawer.Body className="h-full">
                                        {sidebarContent}
                                    </Drawer.Body>
                                </Drawer.Dialog>
                            </Drawer.Content>
                        </Drawer.Backdrop>
                    </Drawer>
                    <TopicArea topic={connectedRoom.currentTopic} isReadOnly={!isModerator} />
                </div>
                <div className="flex flex-col gap-2 items-end">
                    <div className="flex flex-row items-center gap-2">
                        {isModerator && <RoomSettingsModal connectedRoom={connectedRoom} />}
                        <RoomSharingModal roomCode={connectedRoom.code} />
                    </div>
                    <FeedbackModal />
                </div>
            </div>

            <div className="flex flex-col gap-2 min-w-0 min-h-0 items-center col-start-2">
                <div className="grow py-4 min-h-0 w-full flex">
                    <CurrentVoting connectedRoom={connectedRoom} />
                </div>
                <RevealCardsSection connectedRoom={connectedRoom} myParticipant={myParticipant as ParticipantView} />
                {connectedRoom.revealed && <RevealedVote connectedRoom={connectedRoom} />}
                {!isSpectator && !connectedRoom.revealed && <CardSelection connectedRoom={connectedRoom} myParticipant={myParticipant} />}
            </div>
        </div>
    </>
    )
}