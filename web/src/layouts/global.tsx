import React from "react";
import {
  Button,
  linkVariants,
} from "@heroui/react";
import { Link, useLocation } from "react-router";
import { FaArrowLeft, FaGithub } from "react-icons/fa";
import { cx } from "tailwind-variants";
import ProfileIcon from "@/components/profileIcon";


export function GlobalLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  // Check if we are on the home page
  const isRoomPage = location.pathname.startsWith("/room");

  return (
    <div className="relative flex h-full flex-col bg-background font-sans text-foreground antialiased">

      {/* Subtle Grid Background */}
      <div className="fixed inset-0 z-0 h-full w-full bg-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      {/* Custom Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-default-200/50 bg-background/10  backdrop-blur-sm">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

          {/* Brand / Logo */}
          <nav className="flex items-center gap-4 h-full">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity h-full text-accent-hover hover:shadow-xs">
              <FaArrowLeft className={cx("text-xl", !isRoomPage && "invisible")} />
              <img src="/plapok.svg" alt="Plapok" className="h-full -my-2" />
            </Link>
            <Link to="https://github.com/timerertim/plapok" target="_blank" className={linkVariants({}).base()}>
              Star on <FaGithub className="text-lg ml-2" />
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            <ProfileIcon />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex flex-grow flex-col">
        <div className="container mx-auto flex flex-grow flex-col max-w-7xl px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}