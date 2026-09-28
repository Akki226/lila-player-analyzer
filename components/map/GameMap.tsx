"use client";

import { MAP_IMAGES, MAP_NAMES } from "@/lib/maps";
import type {
    EventVisibility,
    HeatmapMode,
    Match,
} from "@/lib/types";

import { useEffect, useState } from "react";
import EventMarker from "./EventMarker";
import HeatmapOverlay from "./HeatmapOverlay";
import PlayerMarker from "./PlayerMarker";
import PlayerPath from "./PlayerPath";

type Props = {
    match: Match;
    currentTime: number;
    selectedPlayerId: string | null;
    showHumans: boolean;
    showBots: boolean;
    enabledEvents: EventVisibility;
    heatmapMode: HeatmapMode;
    onHeatmapModeChange: (mode: HeatmapMode) => void;
};

export default function GameMap({
    match,
    currentTime,
    selectedPlayerId,
    showHumans,
    showBots,
    enabledEvents,
    heatmapMode,
    onHeatmapModeChange,
}: Props) {

    const mapSrc = MAP_IMAGES[match.mapId];
    const [isMapLoading, setIsMapLoading] = useState(true);

    useEffect(() => {
        setIsMapLoading(true);
    }, [mapSrc]);

    const visiblePlayers = match.players.filter((player) => {
        if (player.isHuman && !showHumans) {
            return false;
        }

        if (!player.isHuman && !showBots) {
            return false;
        }

        return true;
    });
    const visiblePlayerIds = new Set(
        visiblePlayers.map((player) => player.userId)
    );

    return (
        <div
            className="
                relative
                aspect-square
                h-full
                w-auto
                max-h-full
                max-w-full
                overflow-hidden
                rounded-xl
                border
                border-zinc-800
                bg-black
                shadow-2xl
            "
        >
            {/* Minimap */}
            <img
                src={mapSrc}
                alt={`${MAP_NAMES[match.mapId] ?? match.mapId} minimap`}
                onLoad={() => setIsMapLoading(false)}
                className="absolute inset-0 h-full w-full object-contain"
            />

            {/* Telemetry overlay */}
            {!isMapLoading && (
                <svg
                    viewBox="0 0 1024 1024"
                    className="absolute inset-0 h-full w-full"
                    preserveAspectRatio="none"
                >
                    <HeatmapOverlay
                        match={match}
                        mode={heatmapMode}
                        visiblePlayerIds={visiblePlayerIds}
                    />
                    {/* Player paths */}
                    {visiblePlayers.map((player) => {
                        const selected =
                            selectedPlayerId === null ||
                            selectedPlayerId === player.userId;

                        return (
                            <PlayerPath
                                key={`path-${player.userId}`}
                                player={player}
                                currentTime={currentTime}
                                selected={selected}
                            />
                        );
                    })}

                    {/* Player markers */}
                    {visiblePlayers.map((player) => {
                        const selected =
                            selectedPlayerId === null ||
                            selectedPlayerId === player.userId;

                        return (
                            <PlayerMarker
                                key={`marker-${player.userId}`}
                                player={player}
                                currentTime={currentTime}
                                selected={selected}
                            />
                        );
                    })}

                    {/* Events */}
                    {visiblePlayers.flatMap((player) => {
                        const selected =
                            selectedPlayerId === null ||
                            selectedPlayerId === player.userId;

                        if (!selected) {
                            return [];
                        }

                        return player.events
                            .filter(
                                (event) =>
                                    event.t <= currentTime &&
                                    event.mapX !== undefined &&
                                    event.mapY !== undefined &&
                                    enabledEvents[event.type]
                            )
                            .map((event, index) => (
                                <EventMarker
                                    key={`${player.userId}-${event.type}-${index}`}
                                    event={event}
                                />
                            ));
                    })}
                </svg>
            )}


            {/* Map label */}
            <div className="absolute left-4 top-4 rounded-lg border border-zinc-700 bg-black/70 px-3 py-2 backdrop-blur">
                <div className="text-sm font-medium">
                    {MAP_NAMES[match.mapId] ?? match.mapId}
                </div>

                <div className="mt-1 text-[11px] text-zinc-400">
                    {visiblePlayers.length} visible players
                </div>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 flex gap-4 rounded-lg border border-zinc-700 bg-black/70 px-3 py-2 text-xs backdrop-blur">
                {showHumans && (
                    <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
                        Human
                    </div>
                )}

                {showBots && (
                    <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
                        Bot
                    </div>
                )}
            </div>
            <div className="absolute right-4 top-4 rounded-lg border border-zinc-700 bg-black/75 p-1.5 backdrop-blur">
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-500">
                    Heatmap
                </div>

                <div className="flex gap-1">
                    {(
                        [
                            ["off", "Off"],
                            ["traffic", "Traffic"],
                            ["kills", "Kills"],
                            ["deaths", "Deaths"],
                        ] as const
                    ).map(([mode, label]) => (
                        <button
                            key={mode}
                            type="button"
                            onClick={() =>
                                onHeatmapModeChange(mode)
                            }
                            className={`rounded px-2 py-1 text-[10px] transition ${heatmapMode === mode
                                ? "bg-white text-black"
                                : "text-zinc-400 hover:bg-white/10 hover:text-white"
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
            {isMapLoading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
                        <span className="text-xs text-zinc-400">
                            Loading map…
                        </span>
                    </div>
                </div>
            )}
        </div>

    );
}