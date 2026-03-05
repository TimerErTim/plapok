import React from "react";
import {
  Button,
  linkVariants,
} from "@heroui/react";
import { Link } from "react-router";
import { FaGithub } from "react-icons/fa";

// 1. Simple Theme Switcher Icon (Sun/Moon)
// Ideally, use next-themes or your preferred theme context here
const ThemeIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    height="24"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="24"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const LogoIcon = () => (
  <svg
    fill="none"
    height="32"
    viewBox="0 0 32 32"
    width="32"
    className="text-primary"
  >
    <path
      clipRule="evenodd"
      d="M17.6482 10.1305L15.8785 7.02583L7.02979 22.5499H10.5278L17.6482 10.1305ZM19.8798 14.0457L18.11 17.1983L19.394 19.4511H16.8453L15.1056 22.5499H24.7275L19.8798 14.0457Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);


export function GlobalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-full flex-col bg-background font-sans text-foreground antialiased">

      {/* Subtle Grid Background */}
      <div className="fixed inset-0 z-0 h-full w-full bg-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      {/* Custom Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-default-200/50 bg-background/10  backdrop-blur-sm">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

          {/* Brand / Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity h-full">
            <img src="/plapok.svg" alt="Plapok" className="h-full -my-2" />
          </Link>

          {/* Right Side Actions */}
          <nav className="flex items-center gap-4">
            <Link to="https://github.com/timerertim/plapok" target="_blank" className={linkVariants({}).base()}>
              <FaGithub className="text-2xl" />
            </Link>
          </nav>
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