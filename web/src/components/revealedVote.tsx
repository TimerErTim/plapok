import { invoke } from "@/common";
import { ParticipantView, RoomView } from "@/spacetimedb_bindings/types";
import { Card, Separator, ProgressCircle, Label, Badge, ScrollShadow, Tooltip, Avatar } from "@heroui/react";
import { useMemo } from "react";
import { getAvatar } from "@/hooks/useAvatar";


export default function RevealedVote({ connectedRoom }: { connectedRoom: RoomView }) {
    // 1. Calculate Statistics
    const stats = useMemo(() => {
        const isRevealed = connectedRoom.revealed
        if (!isRevealed) return null

        const revealedVotes = connectedRoom.participants.map(participant => participant.voteState.tag === "Revealed" ? {
            participant: participant,
            card: participant.voteState.value
        } : null).filter((v): v is NonNullable<typeof v> => v !== null);

        if (revealedVotes.length === 0) return { votesByCardId: {}, agreement: 0, count: 0 };

        // Aggregate participants by card
        const cardCounts: Record<string, Array<ParticipantView>> = {};
        revealedVotes.forEach(v => cardCounts[v.card.id.toString()] = [...(cardCounts[v.card.id.toString()] || []), v.participant]);

        // Calculate consensus percentage (how many people voted for the most popular number)
        const maxVotesForOneNumber = Math.max(...Object.values(cardCounts).map(v => v.length));
        const agreement = (maxVotesForOneNumber / revealedVotes.length) * 100;

        return {
            votesByCardId: cardCounts,
            agreement: Math.round(agreement),
            count: revealedVotes.length
        };
    }, [connectedRoom]);

    if (!stats) return null;

    const { color, label } = invoke(() => {
        if (stats.agreement >= 100) return { color: 'success' as const, label: 'High' };
        if (stats.agreement > 70) return { color: 'warning' as const, label: 'Medium' };
        return { color: 'danger' as const, label: 'Low' };
    });

    return (
        <Card className="z-20 w-full ml-4 border border-default-200 bg-content1/80 backdrop-blur-lg shadow-2xl p-0">
            <Card.Content className="flex flex-row items-center text-center">
                <ScrollShadow orientation="horizontal" hideScrollBar className="h-full p-2 grow grid grid-flow-col auto-cols-[minmax(min,1fr)] gap-2 overflow-x-auto w-full">
                    {Object.entries(stats.votesByCardId).map(([cardId, voters]) => {
                        const cardSymbol = connectedRoom.currentDeck.find(card => card.id.toString() === cardId)?.symbol;
                        if (!cardSymbol) return null;
                        const meterValue = voters.length / stats.count * 100;
                        return (
                            <div key={cardId} className="flex flex-col items-center justify-center gap-1 grow h-full text-xs">
                                <Tooltip delay={0} closeDelay={250} >
                                    <Tooltip.Trigger className="relative grow w-4 rounded-2xl overflow-clip bg-surface-tertiary">
                                        <div className="absolute bottom-0 w-full bg-accent" style={{ height: `${meterValue}%` }} />
                                    </Tooltip.Trigger>
                                    <Tooltip.Content showArrow placement="top left" className="shadow-xl flex flex-col gap-1.5 p-3 pt-2">
                                        <Tooltip.Arrow />
                                        <h3 className="text-sm font-medium mb-1">Voters</h3>
                                        <ul className="text-tiny">
                                            {voters.map(v => <li key={v.profile.identity.toString()} className="flex items-center gap-2">
                                                <Avatar size="sm" className="text-tiny font-bold size-6">
                                                    <Avatar.Image src={getAvatar(v.profile).toDataUri()} />
                                                </Avatar>
                                                {v.profile.name}
                                            </li>)}
                                        </ul>
                                    </Tooltip.Content>
                                </Tooltip>
                                <span>{cardSymbol}</span>
                            </div>
                        )
                    })}
                </ScrollShadow>
                <Separator orientation="vertical" />
                <div className="flex flex-row gap-4 items-center p-4 ">
                    <Badge.Anchor>
                        <ProgressCircle value={stats.agreement} className="-rotate-y-180" size="lg" color={color}>
                            <ProgressCircle.Track className="size-15">
                                <ProgressCircle.TrackCircle />

                                <ProgressCircle.FillCircle />
                            </ProgressCircle.Track>
                        </ProgressCircle>
                        <Badge color={color} size="sm" variant="secondary" placement="bottom-right">
                            {label}
                        </Badge>
                    </Badge.Anchor>
                    <Label>
                        <b>{stats.agreement}%</b> <br />
                        Consensus
                    </Label>
                </div>
            </Card.Content>
        </Card>
    );
}