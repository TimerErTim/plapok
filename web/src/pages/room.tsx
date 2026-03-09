import useConnectionRoom from "@/hooks/useConnectionRoom";
import { reducers } from "@/spacetimedb_bindings";
import { Spinner } from "@heroui/react";
import { useEffect, useState } from "react";
import { FaHome } from "react-icons/fa";
import { Link, useParams } from "react-router";
import { useReducer } from "spacetimedb/react";

export default function Room() {
    const { connectedRoom, roomReady } = useConnectionRoom()
    const joinRoom = useReducer(reducers.joinRoom)
    const { roomCode } = useParams()
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (roomReady && !!roomCode && (!connectedRoom || connectedRoom.code !== roomCode)) {
            joinRoom({code: roomCode}).catch((error) => {
                setError(String(error.message))
            })
        }
    }, [connectedRoom, roomReady])


    if (error) {
        return <div className="flex flex-col items-center justify-center grow">
            <p className="text-danger">{error}</p>
            <Link to="/" className="button button--tertiary">
                <FaHome />
                Back to home
            </Link>
        </div>
    }

    if (!roomReady || !connectedRoom) {
        return <div className="flex flex-col items-center justify-center grow">
            <Spinner size="xl"/>
        </div>
    }

    return (
        <div>
            <h1>Room</h1>
            <p>{connectedRoom.currentTopic}</p>
            <div>
                {connectedRoom.participants.map(participant => (
                    <div key={participant.id}>
                        <p>{participant.name}</p>
                        <p>{participant.role.tag}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}