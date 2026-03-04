"use client";

import { hasFlag } from "country-flag-icons";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useTable, useReducer } from "spacetimedb/react";
import { tables, reducers } from "@/spacetimedb_bindings";
import { Identity, Timestamp } from "spacetimedb";
import {
  BookOpen,
  Clock,
  Feather,
  TrendingUp,
  Users,
  Send,
  Info
} from "lucide-react";
import { AvatarIcon } from "./avatar";
import { Avatar } from "@/spacetimedb_bindings/types";



// ---------------------------------------------------------------------------
// Main View
// ---------------------------------------------------------------------------

export function MainView() {
  const createProfile = useReducer(reducers.createProfile);
  const [profile, profileViewLoaded] = useTable(tables.my_profile)

  if (!profileViewLoaded) {
    return <div>Loading...</div>;
  }

  const myProfile = profile?.[0];

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<Avatar>(Avatar.FromName);

  function handleCreateProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createProfile({ name, avatar });
  }

  return (
    <div className="flex flex-col h-svh bg-stone-950 text-stone-200 font-sans selection:bg-amber-900/50">
        {myProfile === undefined ? 
        <div>
          <form onSubmit={handleCreateProfile}>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            <AvatarIcon profile={{
              identity: new Identity(name),
              name: name,
              avatar: avatar
            }} />
            </form>
        </div> : 
          <div>
            <AvatarIcon profile={myProfile} />
            <div>
              <h1>{myProfile.name}</h1>
              <p>{myProfile.identity.toString()}</p>
            </div>
          </div>
        }
    </div>
  );
}
