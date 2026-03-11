import useConnectionRoom from "@/hooks/useConnectionRoom";
import { reducers } from "@/spacetimedb_bindings";
import { Spinner } from "@heroui/react";
import { lazy, useEffect, useState } from "react";
import { FaHome } from "react-icons/fa";
import { Link, useParams } from "react-router";
import { useReducer } from "spacetimedb/react";
const WholeRoom = lazy(() => import("@/components/wholeRoom"));

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

    return <>
        {/* <title>Room {connectedRoom.code} | Plapok</title> */}
        <WholeRoom connectedRoom={connectedRoom} />
    </>
}