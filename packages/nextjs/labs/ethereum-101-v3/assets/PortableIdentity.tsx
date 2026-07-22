"use client";

import { useState } from "react";
import { ArrowPathIcon, CheckIcon, UserCircleIcon, UsersIcon } from "@heroicons/react/24/outline";

type AppId = "commons" | "signal";

const apps: Record<AppId, { name: string; description: string; accent: string }> = {
  commons: {
    name: "Commons",
    description: "A community feed",
    accent: "bg-[#54d6a8]",
  },
  signal: {
    name: "Signal Garden",
    description: "A public-goods social client",
    accent: "bg-[#ff7ccb]",
  },
};

export const PortableIdentity = () => {
  const [app, setApp] = useState<AppId>("commons");
  const [following, setFollowing] = useState(false);
  const [caption, setCaption] = useState(
    "Both apps read Alex's same protocol account. Follow Mina in Commons, then switch to Signal Garden.",
  );

  const current = apps[app];

  const follow = () => {
    setFollowing(value => !value);
    setCaption(
      following
        ? "The shared relationship was removed. Switch apps and both interfaces will read the same result."
        : "The relationship was written to the shared protocol state. Now switch apps — Alex's account does not reset.",
    );
  };

  const switchApp = (next: AppId) => {
    setApp(next);
    setCaption(
      following
        ? `${apps[next].name} recognizes the same account and sees that you follow Mina.`
        : `${apps[next].name} recognizes the same account. The interface changed; the protocol identity did not.`,
    );
  };

  const reset = () => {
    setApp("commons");
    setFollowing(false);
    setCaption("Both apps read Alex's same protocol account. Follow Mina in Commons, then switch to Signal Garden.");
  };

  return (
    <div className="flex flex-col gap-4 text-dark-text">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2" role="group" aria-label="Choose an application">
          {(Object.keys(apps) as AppId[]).map(id => (
            <button
              key={id}
              type="button"
              onClick={() => switchApp(id)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                app === id
                  ? "border-violet-bright bg-lab-code-panel-tint text-dark-text"
                  : "border-dark-border text-dark-text-muted hover:border-violet-bright"
              }`}
            >
              {apps[id].name}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={reset}
          className="cursor-pointer font-mono text-xs text-dark-text-muted transition-colors hover:text-dark-text"
        >
          reset
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-dark-border bg-dark-surface">
        <div className="flex items-center gap-3 border-b border-dark-border px-4 py-3">
          <span className={`h-3 w-3 rounded-full ${current.accent}`} />
          <div>
            <p className="m-0 text-sm font-semibold text-dark-text">{current.name}</p>
            <p className="m-0 text-xs text-dark-text-muted">{current.description}</p>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-dark-border bg-dark-bg/60 p-3">
            <UserCircleIcon className="h-10 w-10 text-violet-bright" />
            <div className="min-w-0 flex-1">
              <p className="m-0 font-semibold text-dark-text">Alex</p>
              <p className="m-0 truncate font-mono text-xs text-dark-text-muted">0x71C2…F3a9</p>
            </div>
            <span className="rounded-full bg-lab-code-panel-tint px-2 py-1 font-mono text-[10px] text-dark-text-muted">
              protocol account
            </span>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-dark-border p-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#ff7ccb]/15 text-[#ff7ccb]">M</span>
            <div className="min-w-0 flex-1">
              <p className="m-0 text-sm font-semibold text-dark-text">Mina</p>
              <p className="m-0 flex items-center gap-1 text-xs text-dark-text-muted">
                <UsersIcon className="h-3.5 w-3.5" /> builds Open Garden
              </p>
            </div>
            <button
              type="button"
              onClick={follow}
              className={`btn btn-sm ${
                following
                  ? "border-lab-mint/60 bg-lab-mint/10 text-lab-mint hover:bg-lab-mint/15"
                  : "border-0 bg-violet-bright text-[#1a102c] hover:bg-violet-bright/90"
              }`}
            >
              {following && <CheckIcon className="h-4 w-4" />}
              {following ? "Following" : "Follow"}
            </button>
          </div>
        </div>
      </div>

      <p className="m-0 min-h-[3rem] text-sm leading-relaxed text-dark-text-muted">{caption}</p>

      <div className="flex items-center gap-2 rounded-lg border border-dark-border bg-lab-code-panel-tint px-3 py-2 text-xs text-dark-text-muted">
        <ArrowPathIcon className="h-4 w-4 shrink-0 text-violet-bright" />
        <span>The apps are different interfaces reading one shared identity and relationship.</span>
      </div>
    </div>
  );
};
