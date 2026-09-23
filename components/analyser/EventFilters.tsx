"use client";

import type { EventVisibility } from "@/lib/types";

const EVENT_TYPES = [
    "Kill",
    "Killed",
    "BotKill",
    "BotKilled",
    "KilledByStorm",
    "Loot",
];

type Props = {
    enabledEvents: EventVisibility;
    onToggle: (eventType: string) => void;
};

export default function EventFilters({
    enabledEvents,
    onToggle,
}: Props) {
    return (
        <section>
            <div className="mb-3 text-xs uppercase tracking-wider text-zinc-500">
                Events
            </div>

            <div className="space-y-2">
                {EVENT_TYPES.map((eventType) => (
                    <label
                        key={eventType}
                        className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2.5 hover:bg-zinc-900"
                    >
                        <span className="text-sm text-zinc-300">
                            {eventType}
                        </span>

                        <input
                            type="checkbox"
                            checked={enabledEvents[eventType] ?? false}
                            onChange={() => onToggle(eventType)}
                            className="h-4 w-4 accent-sky-400"
                        />
                    </label>
                ))}
            </div>
        </section>
    );
}