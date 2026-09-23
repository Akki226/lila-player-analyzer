"use client";

import type {
    EventVisibility,
    Match,
    MatchIndexItem,
} from "@/lib/types";

import PlayerDetails from "../analytics/PlayerDetails";
import EventFilters from "./EventFilters";
import MatchStats from "./MatchStats";
import PlayerFilters from "./PlayerFilters";

type Props = {
    match: Match;
    index: MatchIndexItem;
    selectedPlayerId: string | null;
    showHumans: boolean;
    showBots: boolean;
    enabledEvents: EventVisibility;

    onSelectPlayer: (playerId: string | null) => void;
    onShowHumans: (value: boolean) => void;
    onShowBots: (value: boolean) => void;
    onToggleEvent: (eventType: string) => void;
};

export default function MatchSidebar({
    match,
    index,
    selectedPlayerId,
    showHumans,
    showBots,
    enabledEvents,
    onSelectPlayer,
    onShowHumans,
    onShowBots,
    onToggleEvent,
}: Props) {
    return (
        <div className="h-full overflow-y-auto pr-1">
            <div className="space-y-7">
                {/* Match identity */}
                <div>
                    <div className="text-xs uppercase tracking-wider text-zinc-500">
                        Match
                    </div>

                    <div className="mt-2 break-all font-mono text-xs leading-5 text-zinc-300">
                        {match.matchId}
                    </div>
                </div>

                <MatchStats index={index} />

                <PlayerFilters
                    players={match.players}
                    selectedPlayerId={selectedPlayerId}
                    showHumans={showHumans}
                    showBots={showBots}
                    onSelectPlayer={onSelectPlayer}
                    onShowHumans={onShowHumans}
                    onShowBots={onShowBots}
                />
                {selectedPlayerId && (
                    <>
                        {(() => {
                            const selectedPlayer = match.players.find(
                                (player) =>
                                    player.userId === selectedPlayerId
                            );

                            if (!selectedPlayer) {
                                return null;
                            }

                            return (
                                <PlayerDetails
                                    player={selectedPlayer}
                                />
                            );
                        })()}
                    </>
                )}
                <EventFilters
                    enabledEvents={enabledEvents}
                    onToggle={onToggleEvent}
                />

                {/* Duration */}
                <div>
                    <div className="mb-3 text-xs uppercase tracking-wider text-zinc-500">
                        Match duration
                    </div>

                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                        <div className="font-mono text-lg">
                            {(match.durationMs / 1000).toFixed(3)}s
                        </div>

                        <div className="mt-1 text-xs text-zinc-500">
                            Recorded telemetry duration
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}