import { Outlet } from "react-router";
import { Provider } from "./provider";
import "@/styles/globals.css";

export default function RootLayout({ children }: { children?: React.ReactNode }) {
    return <Provider>
        {children || <Outlet />}
    </Provider>
}