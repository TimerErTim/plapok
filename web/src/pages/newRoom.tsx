import useConnectionRoom from "@/hooks/useConnectionRoom"
import { reducers } from "@/spacetimedb_bindings"
import { Spinner } from "@heroui/react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { useReducer } from "spacetimedb/react"

export default function NewRoom() {
    const navigate = useNavigate()
    const disconnectCurrentRoom = useReducer(reducers.disconnectCurrentRoom)
    const createRoom = useReducer(reducers.createRoom)
    const { connectedRoom, roomReady } = useConnectionRoom()

    const [error, setError] = useState<string | null>(null)
    const [roomWasCreated, setRoomWasCreated] = useState(false)

    useEffect(() => {
        disconnectCurrentRoom()
        .then(() => {
            createRoom()
            .then(() => {
                setRoomWasCreated(true)
            })
        })
        .catch((error) => {
            setError(String(error.message))
            console.error(error)
        })
    }, [])

    useEffect(() => {
        if (roomWasCreated && !!connectedRoom) {
            navigate(`/room/${connectedRoom.code}`)
        }
    }, [roomWasCreated, connectedRoom])

    return (
        <div className="grow w-full h-full flex items-center justify-center">
            {error ? <p className="text-danger">{error}</p> : <Spinner size="xl" />}
        </div>
    )
}