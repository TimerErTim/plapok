import { getAvatar } from "@/hooks/useAvatar";
import { Avatar as AvatarType, DeckCard, RoomView, VoteStateView } from "@/spacetimedb_bindings/types";
import { Avatar, Card, Chip, ScrollShadow, Separator, Tooltip, cn } from "@heroui/react";
import { useMemo } from "react";

// --- HELPER COMPONENT: THE VOTE CARD ---
// Uses the fix from previous step: Solid bg-content1, soft tint on CardBody
const RevealedCard = ({ vote, name }: { vote: VoteStateView; name: string }) => {
    return (
        <Card className={cn("relative w-16 h-24 border-2 border-primary bg-content1 shadow-lg overflow-hidden transition rotate-y-180", vote.tag === "Revealed" && 'rotate-y-0', vote.tag === "NotVoted" && 'border-dashed')}>
            <Card.Content className={cn('absolute inset-0 p-0 flex flex-col items-center justify-center h-full w-full', vote.tag === "Revealed" ? 'bg-accent' : 'bg-default-100', vote.tag === "Voted" && 'bg-accent/15')}>
                {vote.tag === "Revealed" ? (
                    <span className="text-4xl font-bold text-default-500">
                        {vote.value.symbol}
                    </span>
                ) : vote.tag === "NotVoted" && (
                    <Tooltip>
                        <Tooltip.Trigger className="transform rotate-y-180">
                            <span className="text-danger/20 text-xs font-bold text-center">NO VOTE</span>
                        </Tooltip.Trigger>
                        <Tooltip.Content showArrow placement="bottom" offset={10} className="w-max">
                            <Tooltip.Arrow />
                            <span className="text-danger">{name} missed the vote</span>
                        </Tooltip.Content>
                    </Tooltip>
                )}
            </Card.Content>
        </Card>
    );
};

// --- MAIN COMPONENT ---
export default function CurrentVoting({ connectedRoom }: { connectedRoom: RoomView }) {
    const revealedVotes = useMemo(() => {
        return connectedRoom.participants.map(participant => participant.voteState.tag === "Revealed" ? {
            participant: participant,
            vote: participant.voteState.value
        } : null)
            .filter((v): v is NonNullable<typeof v> => v !== null)
    }, [connectedRoom])

    const allLegiblePlayers = useMemo(() => {
        return connectedRoom.participants.filter(participant => participant.role.tag !== "Spectator")
    }, [connectedRoom])

    // 1. Calculate Statistics
    const stats = useMemo(() => {
        const isRevealed = connectedRoom.revealed
        if (!isRevealed) return null

        if (revealedVotes.length === 0) return { agreement: 0, count: 0 };

        // Calculate consensus percentage (how many people voted for the most popular number)
        const counts: Record<string, number> = {};
        revealedVotes.forEach(v => counts[v.vote.id.toString()] = (counts[v.vote.id.toString()] || 0) + 1);
        const maxVotesForOneNumber = Math.max(...Object.values(counts));
        const agreement = (maxVotesForOneNumber / revealedVotes.length) * 100;

        return {
            agreement: Math.round(agreement),
            count: revealedVotes.length
        };
    }, [connectedRoom, revealedVotes]);

    // 2. Circular Layout Math (for desktop only)
    const totalPlayers = revealedVotes.length;
    // Radius of the circle (in pixels)
    const radius = 280;

    const circularStyle = (index: number) => {
        // Calculate angle (starting from top, 12 o'clock)
        // We subtract PI/2 to offset CSS's 0-radian starting point (3 o'clock)
        const angle = (index / totalPlayers) * 2 * Math.PI - Math.PI / 2;

        // Calculate X and Y coordinates relative to center
        const x = Math.round(radius * Math.cos(angle));
        const y = Math.round(radius * Math.sin(angle));

        return {
            // transform keeps standard layout flow, translate places it absolutely
            transform: `translate(${x}px, ${y}px)`,
        };
    };

    return (
        <ScrollShadow className="w-full min-h-0 h-full">
            <div className="flex gap-6 flex-wrap justify-center-safe min-w-full">
                {allLegiblePlayers.map((player) => (
                    <div key={player.profile.identity.toString()} className="flex flex-col items-center gap-3 flex-shrink-0">
                        <RevealedCard vote={player.voteState} name={player.profile.name} />
                        <div className="flex items-center gap-2">
                            <Avatar size="sm" color="accent"> <Avatar.Image src={getAvatar(player.profile).toDataUri()} />
                                <Avatar.Fallback>{player.profile.name.charAt(0)}</Avatar.Fallback></Avatar>
                            <span className="text-tiny font-medium truncate max-w-[80px]">{player.profile.name}</span>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollShadow>
    );
}