"use client";

import { MAP_IMAGES, MAP_NAMES } from "@/lib/maps";
import type {
    EventVisibility,
    Match,
} from "@/lib/types";

import EventMarker from "./EventMarker";
import PlayerMarker from "./PlayerMarker";
import PlayerPath from "./PlayerPath";

type Props = {
    match: Match;
    currentTime: number;
    selectedPlayerId: string | null;
    showHumans: boolean;
    showBots: boolean;
    enabledEvents: EventVisibility;
};

export default function GameMap({
    match,
    currentTime,
    selectedPlayerId,
    showHumans,
    showBots,
    enabledEvents,
}: Props) {
    const visiblePlayers = match.players.filter((player) => {
        if (player.isHuman && !showHumans) {
            return false;
        }

        if (!player.isHuman && !showBots) {
            return false;
        }

        return true;
    });

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
                src={MAP_IMAGES[match.mapId]}
                alt={`${MAP_NAMES[match.mapId] ?? match.mapId} minimap`}
                className="absolute inset-0 h-full w-full object-contain"
            />

            {/* Telemetry overlay */}
            <svg
                viewBox="0 0 1024 1024"
                className="absolute inset-0 h-full w-full"
                preserveAspectRatio="none"
            >
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
        </div>
    );
}