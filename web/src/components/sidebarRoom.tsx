import { roleTags, formatRoleTag } from "@/common/roles";
import { formatDateTime } from "@/common/timestamp";
import { getAvatar } from "@/hooks/useAvatar";
import { reducers } from "@/spacetimedb_bindings";
import { ParticipantRole, ParticipantView, Profile, RoomView } from "@/spacetimedb_bindings/types";
import { Surface, Select, ListBox, Separator, ScrollShadow, Tooltip, Avatar } from "@heroui/react";
import { useReducer } from "spacetimedb/react";
import { cx } from "tailwind-variants";

export default function SidebarRoom({ connectedRoom, myParticipant }: { connectedRoom: RoomView, myParticipant: ParticipantView }) {
    const setParticipantRole = useReducer(reducers.setParticipantRole)
    const isModerator = myParticipant.role.tag === "Moderator"

    const historicVotes = connectedRoom.voteHistory
    historicVotes.sort((a, b) => Number(b.timestamp.toMillis() - a.timestamp.toMillis()))

    return <Surface className="flex-col gap-4 grow p-4 flex min-h-0 h-full max-w-64">
        {/* Participants Section */}
        <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold uppercase text-default-400 tracking-wider">Participants ({connectedRoom.participants.length})</h3>
            <div className="flex flex-col gap-1 overflow-y-auto max-h-32 pr-2">
                {connectedRoom.participants.map((user) => {
                    const canEditRole = isModerator || user.profile.identity.equals(myParticipant.profile.identity);
                    const avatar = getAvatar(user.profile)
                    return (
                        <div key={user.profile.identity.toString()} className="flex items-center gap-2 justify-between py-1.5 rounded-lg hover:bg-default-100/50 transition-colors">
                            <div className="shrink flex items-center gap-2 min-w-0">
                                <Avatar size="sm">
                                    <Avatar.Image src={avatar.toDataUri()} />
                                </Avatar>
                                <span className={cx("text-sm truncate min-w-0", user.profile.identity.equals(myParticipant.profile.identity) && "font-semibold")}>
                                    {user.profile.name}
                                </span>
                            </div>
                            <Select
                                isDisabled={!canEditRole}
                                value={user.role.tag}
                                onChange={(value) => setParticipantRole({ identity: user.profile.identity, role: { tag: value } as any as ParticipantRole })}
                                className="h-8"
                                aria-label="Select Role"
                            >
                                <Select.Trigger className="text-sm h-8">
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

        <Separator />

        {/* Last Results Section */}
        <ScrollShadow hideScrollBar orientation="vertical" className="flex flex-col gap-3 shrink grow min-h-0">
            <h3 className="text-sm font-bold uppercase text-default-400 tracking-wider">Last Round Results</h3>
            {connectedRoom.voteHistory.length === 0 ? (
                <p className="text-tiny text-default-400 italic">No votes yet.</p>
            ) : (
                <div className="flex flex-col gap-4">
                    {historicVotes.map((data) => {
                        const votesByCardId = data.votes.reduce((acc, vote) => {
                            acc[vote.chosenCardId.toString()] = [...(acc[vote.chosenCardId.toString()] || []), vote.profile]
                            return acc
                        }, {} as Record<string, Profile[]>)
                        const totalVotes = Object.values(votesByCardId).reduce((acc, votes) => acc + votes.length, 0)
                        return (
                            <div key={data.timestamp.toISOString()} className="flex flex-col items-start gap-0 text-sm w-full">
                                <span className="text-xs text-muted">{formatDateTime(data.timestamp)}</span>
                                <span className="text-sm font-medium mb-2">{data.topic}</span>
                                <div className="flex flex-col items-center gap-1 w-full">
                                    {Object.entries(votesByCardId).map(([cardId, voters]) => {
                                        const count = voters.length
                                        const percentage = count / totalVotes * 100;
                                        return (
                                            <div key={cardId} className="grid grid-cols-[max-content_auto] gap-2 w-full">
                                                <span className="font-mono font-bold text-right">{data.votes.find(v => v.chosenCardId.toString() === cardId)?.chosenCardSymbol}</span>
                                                <Tooltip delay={0} closeDelay={250} >
                                                    <Tooltip.Trigger className="relative rounded-2xl overflow-clip bg-surface-tertiary cursor-help w-full h-6">
                                                        <div className="absolute left-0 h-full bg-accent" style={{ width: `${percentage}%` }} />
                                                    </Tooltip.Trigger>

                                                    <Tooltip.Content showArrow placement="right" className="shadow-xl flex flex-col gap-1.5 p-3 pt-2">
                                                        <Tooltip.Arrow />
                                                        <h3 className="text-sm font-medium mb-1">Voters</h3>
                                                        <ul className="text-tiny">
                                                            {voters.map(v => <li key={cardId} className="flex items-center gap-2">
                                                                <Avatar size="sm" className="text-tiny font-bold size-6">
                                                                    <Avatar.Image src={getAvatar(v).toDataUri()} />
                                                                </Avatar>
                                                                {v.name}
                                                            </li>)}
                                                        </ul>
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
        </ScrollShadow>
    </Surface>
}