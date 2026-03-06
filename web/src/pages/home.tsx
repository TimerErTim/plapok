import React, { useState } from "react";
import {
    Card,
    CardHeader,
    Input,
    Button,
    Separator,
    Kbd,
    Label,
    InputGroup,
} from "@heroui/react";
import { config } from "@/config";
import { FaArrowRight, FaPlus } from "react-icons/fa";
import { useLocation } from "react-router";

export default function PlanningPokerLanding() {
    const [roomCode, setRoomCode] = useState("");

    // Placeholder navigation logic - replace with your Router (e.g., Next.js useRouter)
    const handleJoin = () => {
        if (!roomCode) return;
        console.log(`Navigating to /room/${roomCode}`);
        window.location.href = `/room/${roomCode}`;
    };

    const handleCreate = () => {
        // Generate a random ID or hit an API endpoint here
        const newRoomId = Math.random().toString(36).substring(7);
        console.log(`Creating room ${newRoomId}`);
        window.location.href = `/room/${newRoomId}`;
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleJoin();
    };

    return (
        <div className="flex flex-grow w-full flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorator (Optional Glow) */}
            <div className="absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-secondary/20 blur-[120px]" />

            <Card className="w-full max-w-md border-default-200 bg-background/60 backdrop-blur-lg pt-4 pb-2">
                <CardHeader className="flex flex-col items-start gap-2 px-6 pb-0">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Planning Poker
                    </h1>
                    <p className="text-small text-default-500">
                        Estimate tasks with your team efficiently.
                    </p>
                </CardHeader>

                <Card.Content className="flex flex-col gap-6 px-6 py-8">
                    {/* Join Room Section */}
                    <div className="flex flex-col gap-2">
                        <Label className="text-default-600 font-medium">Join a Session</Label>
                        <div className="flex flex-row items-center gap-2">
                            <Input
                                autoFocus
                                placeholder="Enter room code..."
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="bg-default-100/50 hover:bg-default-100 transition-colors pr-1 grow"
                            />
                                <Button
                                    isIconOnly
                                    size="md"
                                    isDisabled={!roomCode}
                                    variant="primary"
                                    onPress={handleJoin}
                                >
                                    <FaArrowRight />
                                </Button>

                        </div>
                        <div className="flex justify-end px-1">
                            <span className="text-tiny text-default-400">Press <Kbd className="mx-1">
                                <Kbd.Abbr keyValue="enter" />
                                <Kbd.Content>Enter</Kbd.Content>
                            </Kbd> to join</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 opacity-50">
                        <Separator className="flex-1" />
                        <span className="text-tiny uppercase text-default-400">Or</span>
                        <Separator className="flex-1" />
                    </div>

                    {/* Create Room Section */}
                    <Button
                        size="lg"
                        variant="primary"
                        className="w-full font-medium"
                        onPress={handleCreate}
                    >
                        <FaPlus />
                        Create New Room
                    </Button>
                </Card.Content>
            </Card>
        </div>
    );
}