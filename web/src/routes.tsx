import { Navigate, Route, Routes } from "react-router";
import Home from "@/pages/home";
import ProfileGuard from "@/pages/profileGuard";
import NewRoom from "@/pages/newRoom";
import Room from "@/pages/room";

export function GlobalRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route element={<ProfileGuard />}>
                <Route path="/new" element={<NewRoom />} />
                <Route path="/room/:roomCode" element={<Room />} />
            </Route>
            <Route path="/*" element={<Navigate to="/" replace/>} />
        </Routes>
    )
}