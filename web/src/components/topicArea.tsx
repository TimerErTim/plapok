import { reducers } from "@/spacetimedb_bindings"
import { useReducer } from "spacetimedb/react"
import { useState } from "react"
import { cn, TextArea } from "@heroui/react"

import { useEffect, useRef } from "react"

export default function TopicArea({ topic, isReadOnly }: { topic: string, isReadOnly: boolean }) {
    const setRoomTopic = useReducer(reducers.setRoomTopic)
    const [localTopic, setLocalTopic] = useState<string | undefined>(undefined)
    const debounceRef = useRef<NodeJS.Timeout | null>(null)
    console.log("topic", topic)

    // Debounced effect to submit the topic after 500ms of inactivity
    useEffect(() => {
        if (typeof localTopic !== "string" || isReadOnly) return

        if (debounceRef.current) {
            clearTimeout(debounceRef.current)
        }
        debounceRef.current = setTimeout(() => {
            setRoomTopic({ topic: localTopic })
                .catch((error) => {
                    console.error(error)
                })
            debounceRef.current = null
        }, 500)

        // Cleanup when localTopic changes or component unmounts
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current)
            }
        }
    }, [localTopic, isReadOnly, setRoomTopic])

    useEffect(() => {
        // If topic has been updated and it matchs localtopic, reset localtopic to default
        // If not matching, the user is still editing
        if (topic == localTopic) {
            setLocalTopic(undefined)
        }
    }, [topic])

    function handleTopicChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
        setLocalTopic(e.target.value)
    }

    return <TextArea value={localTopic ?? topic} onChange={handleTopicChange} readOnly={isReadOnly} fullWidth={true} className={cn("text-xs sm:text-base !h-full", isReadOnly && "!bg-transparent")} inert={isReadOnly} />
}
