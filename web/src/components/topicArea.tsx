import { reducers } from "@/spacetimedb_bindings"
import { useReducer } from "spacetimedb/react"
import { useState } from "react"
import { TextArea } from "@heroui/react"

export default function TopicArea({ topic, isReadOnly }: { topic: string, isReadOnly: boolean }) {
    const setRoomTopic = useReducer(reducers.setRoomTopic)
    const [localTopic, setLocalTopic] = useState(topic)

    function handleTopicChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
        setLocalTopic(e.target.value)
        setRoomTopic({ topic: e.target.value })
    }

    return <TextArea value={localTopic} onChange={handleTopicChange} readOnly={isReadOnly} />
}