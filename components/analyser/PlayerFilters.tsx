"use client";

import type { Player } from "@/lib/types";

type Props = {
    players: Player[];
    selectedPlayerId: string | null;
    showHumans: boolean;
    showBots: boolean;

    onSelectPlayer: (playerId: string | null) => void;
    onShowHumans: (value: boolean) => void;
    onShowBots: (value: boolean) => void;
};

export default function PlayerFilters({
    players,
    selectedPlayerId,
    showHumans,
    showBots,
    onSelectPlayer,
    onShowHumans,
    onShowBots,
}: Props) {
    return (
        <section>
            <div className="mb-3 text-xs uppercase tracking-wider text-zinc-500">
                Players
            </div>

            <div className="space-y-2">
                <Toggle
                    label="Human players"
                    checked={showHumans}
                    onChange={onShowHumans}
                />

                <Toggle
                    label="Bots"
                    checked={showBots}
                    onChange={onShowBots}
                />
            </div>

            <div className="mt-4 max-h-[280px] space-y-1 overflow-y-auto pr-1">
                <button
                    type="button"
                    onClick={() => onSelectPlayer(null)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-xs transition ${selectedPlayerId === null
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                        }`}
                >
                    All players
                </button>

                {players.map((player, index) => {
                    const selected =
                        selectedPlayerId === player.userId;

                    const visible =
                        player.isHuman ? showHumans : showBots;

                    if (!visible) {
                        return null;
                    }

                    return (
                        <button
                            key={player.userId}
                            type="button"
                            onClick={() =>
                                onSelectPlayer(player.userId)
                            }
                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition ${selected
                                ? "bg-zinc-800"
                                : "hover:bg-zinc-900"
                                }`}
                        >
                            <span
                                className={`h-2.5 w-2.5 shrink-0 rounded-full ${player.isHuman
                                    ? "bg-sky-400"
                                    : "bg-orange-400"
                                    }`}
                            />

                            <div className="min-w-0 flex-1">
                                <div className="truncate text-xs text-zinc-300">
                                    {player.isHuman ? "Human" : "Bot"}{" "}
                                    #{index + 1}
                                </div>

                                <div className="truncate font-mono text-[9px] text-zinc-600">
                                    {player.userId}
                                </div>
                            </div>

                            <span className="text-[10px] text-zinc-600">
                                {player.events.length}
                            </span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}

function Toggle({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2.5 hover:bg-zinc-900">
            <span className="text-sm text-zinc-300">
                {label}
            </span>

            <input
                type="checkbox"
                checked={checked}
                onChange={(event) =>
                    onChange(event.target.checked)
                }
                className="h-4 w-4 accent-sky-400"
            />
        </label>
    );
}