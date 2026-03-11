import { ParticipantRole, ParticipantView, RoomView } from "@/spacetimedb_bindings/types";
import { reducers } from "@/spacetimedb_bindings";
import { useReducer, useSpacetimeDB } from "spacetimedb/react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Avatar, Button, Card, InputGroup, Label, ListBox, Modal, Select, Separator, Surface, SurfaceContext, TextField, Tooltip } from "@heroui/react";
import { cx } from "tailwind-variants";
import { getAvatar } from "@/hooks/useAvatar";
import { formatRoleTag, roleTags } from "@/common/roles";
import { FaCopy, FaGlobe, FaShare } from "react-icons/fa";
import { getShareableRoomLink } from "@/common/room";
import RoomSharingModal from "./roomSharingModal";
import RoomSettingsModal from "./roomSettingsModal";

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
    const setRoomTopic = useReducer(reducers.setRoomTopic)
    const setRoomDeck = useReducer(reducers.setRoomDeck)
    const revealRoom = useReducer(reducers.revealRoom)
    const unrevealRoom = useReducer(reducers.unrevealRoom)
    const setParticipantRole = useReducer(reducers.setParticipantRole)
    const makeRoomPermanent = useReducer(reducers.makeRoomPermanent)
    const cancelMyVote = useReducer(reducers.cancelMyVote)
    const voteForCard = useReducer(reducers.voteForCard)

    // Myself
    const myParticipant = useMyParticipant(connectedRoom)
    const isModerator = myParticipant.role.tag === ParticipantRole.Moderator.tag
    const isPlayer = myParticipant.role.tag === ParticipantRole.Player.tag
    const isSpectator = myParticipant.role.tag === ParticipantRole.Spectator.tag

    const [localTopic, setLocalTopic] = useState(connectedRoom.currentTopic)

    // Reusable Sidebar Content (for Desktop aside and Mobile drawer)
    const SidebarContent = () => (
        <Surface className="flex flex-col gap-6 grow p-4">
            {/* Participants Section */}
            <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold uppercase text-default-400 tracking-wider">Participants ({connectedRoom.participants.length})</h3>
                <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px] pr-2">
                    {connectedRoom.participants.map((user) => {
                        const canEditRole = isModerator || user.profile.identity.equals(myParticipant.profile.identity);
                        const avatar = getAvatar(user.profile)
                        return (
                            <div key={user.profile.identity.toString()} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-default-100/50 transition-colors">
                                <div className="flex items-center gap-2">
                                    <Avatar size="sm">
                                        <Avatar.Image src={avatar.toDataUri()} />
                                    </Avatar>
                                    <span className={cx("text-sm", user.profile.identity.equals(myParticipant.profile.identity) && "font-semibold")}>
                                        {user.profile.name}
                                    </span>
                                </div>
                                <Select
                                    isDisabled={!canEditRole}
                                    value={user.role.tag}
                                    onChange={(value) => setParticipantRole({ identity: user.profile.identity, role: { tag: value } as any as ParticipantRole })}
                                    className="max-w-[110px] h-8"
                                    aria-label="Select Role"
                                >
                                    <Select.Trigger>
                                        <Select.Value />  {/* TODO: Add loading indicator */}
                                        <Select.Indicator />
                                    </Select.Trigger>
                                    <Select.Popover>
                                        <ListBox>
                                            {roleTags.map((role) => (
                                                <ListBox.Item key={role} id={role} textValue={formatRoleTag(role)}>
                                                    {formatRoleTag(role)}
                                                    <ListBox.ItemIndicator />
                                                </ListBox.Item>
                                            ))}
                                        </ListBox>
                                    </Select.Popover>
                                </Select>
                            </div>
                        );
                    })}
                </div>
            </div>

            <Separator className="opacity-50" />

            {/* Last Results Section */}
            <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold uppercase text-default-400 tracking-wider">Last Round Results</h3>
                {connectedRoom.voteHistory.length === 0 ? (
                    <p className="text-tiny text-default-400 italic">No votes yet.</p>
                ) : (
                    <div className="flex flex-col gap-2 pt-2">
                        {connectedRoom.voteHistory.map((data) => {
                            const voteMap = new Map<number, number>()
                            const cardMap = new Map<number, string>()
                            for (const vote of data.votes) {
                                voteMap.set(Number(vote.chosenCardId), (voteMap.get(Number(vote.chosenCardId)) || 0) + 1)
                                cardMap.set(Number(vote.chosenCardId), vote.chosenCardSymbol)
                            }
                            const maxCount = Math.max(...voteMap.values())
                            return (
                                <div key={data.timestamp.toISOString()} className="flex flex-col items-center gap-2 text-sm">
                                    <span>{data.timestamp.toISOString()}</span>
                                    <div className="flex items-center gap-1">
                                        {Array.from(voteMap.entries()).map(([cardId, count]) => {
                                            const percentage = count / maxCount * 100;
                                            return (
                                                <div key={cardId} className="flex gap-2">
                                                    <span className="font-mono font-bold w-6 text-right">{cardMap.get(cardId)}</span>
                                                    <Tooltip>
                                                        <Tooltip.Trigger>
                                                            <div className="flex-1 h-6 bg-default-100 rounded-full overflow-hidden relative cursor-help">
                                                                <div className="h-full bg-primary/40 absolute left-0 top-0 rounded-full transition-all" style={{ width: `${percentage}%` }}></div>
                                                                <span className="absolute inset-0 flex items-center justify-end px-2 text-tiny font-medium z-10 mix-blend-multiply">{count} votes</span>
                                                            </div>
                                                        </Tooltip.Trigger>

                                                        <Tooltip.Content showArrow placement="right">
                                                            <Tooltip.Arrow />
                                                            <div className="px-1 py-2">
                                                                <p className="font-bold text-tiny mb-1">
                                                                    Voted by:
                                                                </p>
                                                                <ul className="list-disc pl-4 text-tiny">
                                                                    {data.votes
                                                                        .filter(v => Number(v.chosenCardId) === cardId)
                                                                        .map(v => <li key={v.profile.identity.toString()}>
                                                                            <Avatar size="sm" className="text-tiny font-bold">
                                                                                <Avatar.Image src={getAvatar(v.profile).toDataUri()} />
                                                                            </Avatar>
                                                                            {v.profile.name}
                                                                        </li>)}
                                                                </ul>
                                                            </div>
                                                        </Tooltip.Content>
                                                    </Tooltip>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </Surface>
    );


    return (<>
        <div className="grow grid grid-rows-[max-content_auto] grid-cols-[max-content_auto]">
            <div className="row-span-2">
                <SidebarContent />
            </div>
            <div className="flex flex-row items-center justify-between">
                <h1 className="text-2xl font-bold">{connectedRoom.currentTopic}</h1>
                <div className="flex flex-col gap-2 items-end">
                    <div className="flex flex-row items-center gap-2">
                        {isModerator && <RoomSettingsModal connectedRoom={connectedRoom} />}
                        <RoomSharingModal roomCode={connectedRoom.code} />
                    </div>
                    <Button variant="outline" onPress={() => { }}>
                        Feedback
                    </Button>
                </div>
            </div>
        </div>
    </>
    )
}