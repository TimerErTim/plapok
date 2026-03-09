import useProfile from "@/hooks/useProfile";
import { Spinner } from "@heroui/react";
import { Navigate, Outlet } from "react-router";
import { useSpacetimeDB } from "spacetimedb/react";
import ProfileCreation from "@/components/profileCreation";

export default function ProfileGuard() {
    const { isActive } = useSpacetimeDB();
    const { profile, isReady } = useProfile();

    return (
        (isActive && isReady) ? (profile ? <Outlet /> : <div className="grow w-full h-full flex items-center justify-center">
            <ProfileCreation />
        </div>) : <div className="grow w-full h-full flex items-center justify-center">
            <Spinner size="xl"/>
        </div>
    )
}