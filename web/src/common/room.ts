import { useHref } from "react-router";

export function getShareableRoomLink(roomCode: string) {
    const href = useHref(`/room/${roomCode}`)
    return `${window.location.origin}${href}`
}