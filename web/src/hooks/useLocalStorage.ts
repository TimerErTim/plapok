import { useEffect, useState } from "react"

export default function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
    const [value, setValue] = useState<T>(initialValue)
    const localStorage = typeof window !== "undefined" && window.localStorage ? window.localStorage : null

    useEffect(() => {
        if (localStorage === null) {
            return
        }

        const item = localStorage.getItem(key)
        if (item) {
            setValue(JSON.parse(item))
        }
    }, [key, localStorage])

    useEffect(() => {
        if (localStorage === null) {
            return
        }

        localStorage.setItem(key, JSON.stringify(value))
    }, [value, key, localStorage])

    return [value, setValue]
}