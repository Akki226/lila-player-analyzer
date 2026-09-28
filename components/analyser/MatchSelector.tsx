"use client";

import { MAP_NAMES } from "@/lib/maps";
import type { MatchIndexItem } from "@/lib/types";

type Props = {
    matches: MatchIndexItem[];
    selectedMatchId: string;
    selectedMap: string;
    selectedDate: string;
    onChange: (matchId: string) => void;
    onMapChange: (mapId: string) => void;
    onDateChange: (date: string) => void;
};

export default function MatchSelector({
    matches,
    selectedMatchId,
    selectedMap,
    selectedDate,
    onChange,
    onMapChange,
    onDateChange,
}: Props) {
    const maps = Array.from(
        new Set(matches.map((match) => match.mapId))
    );

    const dates = Array.from(
        new Set(matches.map((match) => match.gameDate))
    ).sort();

    const filteredMatches = matches.filter((match) => {
        const matchesMap =
            selectedMap === "all" ||
            match.mapId === selectedMap;

        const matchesDate =
            selectedDate === "all" ||
            match.gameDate === selectedDate;

        return matchesMap && matchesDate;
    });

    return (
        <div className="flex items-center gap-2">
            {/* Map */}
            <select
                value={selectedMap}
                onChange={(event) =>
                    onMapChange(event.target.value)
                }
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none transition focus:border-zinc-500"
            >
                <option value="all">
                    All maps
                </option>

                {maps.map((mapId) => (
                    <option key={mapId} value={mapId}>
                        {MAP_NAMES[mapId] ?? mapId}
                    </option>
                ))}
            </select>

            {/* Date */}
            <select
                value={selectedDate}
                onChange={(event) =>
                    onDateChange(event.target.value)
                }
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none transition focus:border-zinc-500"
            >
                <option value="all">
                    All dates
                </option>

                {dates.map((date) => (
                    <option key={date} value={date}>
                        {formatDate(date)}
                    </option>
                ))}
            </select>

            {/* Match */}
            <select
                value={selectedMatchId}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                className="w-[300px] rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none transition focus:border-zinc-500"
            >
                {filteredMatches.length === 0 ? (
                    <option value="">
                        No matches
                    </option>
                ) : (
                    filteredMatches.map((match) => (
                        <option
                            key={match.matchId}
                            value={match.matchId}
                        >
                            {MAP_NAMES[match.mapId] ??
                                match.mapId}{" "}
                            · {match.playerCount} players ·{" "}
                            {match.matchId.slice(0, 8)}
                        </option>
                    ))
                )}
            </select>
        </div>
    );
}

function formatDate(date: string) {
    const [year, month, day] = date.split("-");

    return `${day}/${month}/${year}`;
}