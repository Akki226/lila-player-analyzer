"use client";

import { EventVisibility, Match, PlayerEvent } from "@/lib/types";
import { useMemo } from "react";

type TimelineProps = {
    match: Match;
    currentTime: number;
    isPlaying: boolean;
    enabledEvents: EventVisibility;
    selectedPlayerId: string | null;
    onTimeChange: (time: number) => void;
    onTogglePlay: () => void;
};

const EVENT_COLORS: Record<string, string> = {
    Kill: "bg-red-500",
    Killed: "bg-purple-500",
    BotKill: "bg-orange-500",
    BotKilled: "bg-pink-500",
    KilledByStorm: "bg-blue-400",
    Loot: "bg-yellow-400",
};

const EVENT_LABELS: Record<string, string> = {
    Kill: "Kill",
    Killed: "Death",
    BotKill: "Bot Kill",
    BotKilled: "Bot Death",
    KilledByStorm: "Storm Death",
    Loot: "Loot",
};

function formatTime(ms: number) {
    const seconds = ms / 1000;

    if (seconds < 10) {
        return `${seconds.toFixed(2)}s`;
    }

    return `${seconds.toFixed(1)}s`;
}

function getEventTime(event: PlayerEvent) {
    return event.t;
}

export default function Timeline({
    match,
    currentTime,
    isPlaying,
    enabledEvents,
    selectedPlayerId,
    onTimeChange,
    onTogglePlay,
}: TimelineProps) {
    const duration = Math.max(match.durationMs, 1);

    const events = useMemo(() => {
        const result: Array<
            PlayerEvent & {
                playerId: string;
            }
        > = [];

        for (const player of match.players) {
            // If a player is selected, prioritize that player's journey.
            if (selectedPlayerId && player.userId !== selectedPlayerId) {
                continue;
            }

            for (const event of player.events) {
                if (!enabledEvents[event.type]) {
                    continue;
                }

                result.push({
                    ...event,
                    playerId: player.userId,
                });
            }
        }

        return result.sort((a, b) => a.t - b.t);
    }, [match.players, selectedPlayerId, enabledEvents]);

    const visibleEventTypes = useMemo(() => {
        return Object.keys(EVENT_LABELS).filter(
            (type) => enabledEvents[type as keyof EventVisibility]
        );
    }, [enabledEvents]);

    const handleTimelineClick = (
        event: React.MouseEvent<HTMLDivElement>
    ) => {
        const rect = event.currentTarget.getBoundingClientRect();

        const percentage =
            Math.min(Math.max(event.clientX - rect.left, 0), rect.width) /
            rect.width;

        onTimeChange(percentage * duration);
    };

    return (
        <div className="sticky bottom-0 z-30 border-t border-white/10 bg-zinc-950/95 px-4 py-3 shadow-2xl backdrop-blur">
            {/* Top row */}
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onTogglePlay}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-semibold text-black transition hover:bg-zinc-200"
                        aria-label={isPlaying ? "Pause playback" : "Play playback"}
                    >
                        {isPlaying ? "Ⅱ" : "▶"}
                    </button>

                    <div className="font-mono text-sm text-white">
                        {formatTime(currentTime)}
                        <span className="mx-1 text-zinc-600">/</span>
                        <span className="text-zinc-400">
                            {formatTime(duration)}
                        </span>
                    </div>
                </div>

                <div className="text-xs text-zinc-500">
                    {selectedPlayerId ? "Selected player" : "All players"}
                </div>
            </div>

            {/* Timeline */}
            <div
                className="relative h-10 cursor-pointer"
                onClick={handleTimelineClick}
            >
                {/* Track */}
                <div className="absolute left-0 right-0 top-4 h-1 rounded-full bg-zinc-800">
                    <div
                        className="h-full rounded-full bg-white"
                        style={{
                            width: `${Math.min(
                                (currentTime / duration) * 100,
                                100
                            )}%`,
                        }}
                    />
                </div>

                {/* Event markers */}
                {events.map((event, index) => {
                    const percentage = Math.min(
                        Math.max((getEventTime(event) / duration) * 100, 0),
                        100
                    );

                    const color =
                        EVENT_COLORS[event.type] ?? "bg-white";

                    return (
                        <button
                            key={`${event.playerId}-${event.t}-${event.type}-${index}`}
                            type="button"
                            title={`${EVENT_LABELS[event.type] ?? event.type} at ${formatTime(
                                event.t
                            )}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onTimeChange(event.t);
                            }}
                            className={`absolute top-[11px] h-3 w-3 -translate-x-1/2 rounded-full ${color} border border-black transition hover:scale-150`}
                            style={{ left: `${percentage}%` }}
                        />
                    );
                })}

                {/* Current-time handle */}
                <div
                    className="absolute top-1 h-7 w-0.5 bg-white"
                    style={{
                        left: `${Math.min(
                            (currentTime / duration) * 100,
                            100
                        )}%`,
                    }}
                />

                {/* Native range input for keyboard/accessibility */}
                <input
                    type="range"
                    min={0}
                    max={duration}
                    step={1}
                    value={Math.min(currentTime, duration)}
                    onChange={(e) => onTimeChange(Number(e.target.value))}
                    className="absolute inset-0 h-10 w-full cursor-pointer opacity-0"
                    aria-label="Match timeline"
                />
            </div>

            {/* Legend */}
            {visibleEventTypes.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                    {visibleEventTypes.map((type) => (
                        <div
                            key={type}
                            className="flex items-center gap-1.5 text-[11px] text-zinc-500"
                        >
                            <span
                                className={`h-2 w-2 rounded-full ${EVENT_COLORS[type] ?? "bg-white"
                                    }`}
                            />

                            <span>{EVENT_LABELS[type] ?? type}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}