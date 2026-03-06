import { Navigate, Route, Routes } from "react-router";
import Home from "@/pages/home";

export function GlobalRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/*" element={<Navigate to="/" replace/>} />
        </Routes>
    )
}