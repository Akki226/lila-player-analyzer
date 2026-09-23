"use client";

import type { MatchIndexItem } from "@/lib/types";
import { MAP_NAMES } from "@/lib/maps";

type Props = {
    matches: MatchIndexItem[];
    selectedMatchId: string;
    onChange: (matchId: string) => void;
};

export default function MatchSelector({
    matches,
    selectedMatchId,
    onChange,
}: Props) {
    return (
        <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">
                Match
            </span>

            <select
                value={selectedMatchId}
                onChange={(event) => onChange(event.target.value)}
                className="w-[360px] rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none transition focus:border-zinc-500"
            >
                {matches.map((match) => (
                    <option
                        key={match.matchId}
                        value={match.matchId}
                    >
                        {MAP_NAMES[match.mapId] ?? match.mapId} ·{" "}
                        {match.playerCount} players ·{" "}
                        {match.matchId.slice(0, 8)}
                    </option>
                ))}
            </select>
        </div>
    );
}