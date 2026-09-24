import type { Match, Player } from "@/lib/types";

type Props = {
    match: Match;
};

export default function MatchInsights({
    match,
}: Props) {
    const humans = match.players.filter(
        (player) => player.isHuman
    );

    const bots = match.players.filter(
        (player) => !player.isHuman
    );

    const totalLoot = countEvents(match, "Loot");

    const totalKills =
        countEvents(match, "Kill") +
        countEvents(match, "BotKill");

    const totalDeaths =
        countEvents(match, "Killed") +
        countEvents(match, "BotKilled");

    const stormDeaths = countEvents(
        match,
        "KilledByStorm"
    );

    const playerDistances = match.players.map(
        (player) => ({
            player,
            distance: calculateDistance(player),
        })
    );

    const longestJourney =
        playerDistances.length > 0
            ? playerDistances.reduce((longest, current) =>
                current.distance > longest.distance
                    ? current
                    : longest
            )
            : null;

    const mostActive =
        match.players.length > 0
            ? match.players.reduce((active, current) =>
                current.positions.length >
                    active.positions.length
                    ? current
                    : active
            )
            : null;

    return (
        <section>
            <div className="mb-3 text-xs uppercase tracking-wider text-zinc-500">
                Match Insights
            </div>

            <div className="space-y-3">
                {/* Player composition */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                    <div className="text-xs text-zinc-500">
                        PLAYER COMPOSITION
                    </div>

                    <div className="mt-3 flex items-end justify-between">
                        <div>
                            <div className="text-2xl font-semibold">
                                {match.players.length}
                            </div>

                            <div className="text-xs text-zinc-500">
                                total players
                            </div>
                        </div>

                        <div className="text-right text-xs">
                            <div className="text-sky-400">
                                {humans.length} human
                                {humans.length !== 1 ? "s" : ""}
                            </div>

                            <div className="mt-1 text-orange-400">
                                {bots.length} bot
                                {bots.length !== 1 ? "s" : ""}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Journey */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                    <div className="text-xs text-zinc-500">
                        JOURNEY
                    </div>

                    {longestJourney ? (
                        <div className="mt-3">
                            <div className="text-xs text-zinc-500">
                                Longest journey
                            </div>

                            <div className="mt-1 flex items-center justify-between gap-3">
                                <PlayerLabel
                                    player={longestJourney.player}
                                />

                                <span className="font-mono text-sm text-zinc-200">
                                    {longestJourney.distance.toFixed(1)}m
                                </span>
                            </div>
                        </div>
                    ) : (
                        <EmptyState />
                    )}

                    {mostActive && (
                        <div className="mt-4 border-t border-zinc-800 pt-3">
                            <div className="text-xs text-zinc-500">
                                Most telemetry points
                            </div>

                            <div className="mt-1 flex items-center justify-between gap-3">
                                <PlayerLabel
                                    player={mostActive}
                                />

                                <span className="font-mono text-sm text-zinc-200">
                                    {mostActive.positions.length.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Events */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                    <div className="text-xs text-zinc-500">
                        EVENTS
                    </div>

                    <div className="mt-3 space-y-2">
                        <EventRow
                            label="Loot"
                            value={totalLoot}
                            dotClass="bg-yellow-400"
                        />

                        <EventRow
                            label="Kills"
                            value={totalKills}
                            dotClass="bg-red-400"
                        />

                        <EventRow
                            label="Deaths"
                            value={totalDeaths}
                            dotClass="bg-purple-400"
                        />

                        <EventRow
                            label="Storm deaths"
                            value={stormDeaths}
                            dotClass="bg-zinc-400"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}

function PlayerLabel({
    player,
}: {
    player: Player;
}) {
    return (
        <div className="flex min-w-0 items-center gap-2">
            <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${player.isHuman
                    ? "bg-sky-400"
                    : "bg-orange-400"
                    }`}
            />

            <span className="truncate text-xs text-zinc-300">
                {player.isHuman ? "Human" : "Bot"}
            </span>

            <span className="truncate font-mono text-[10px] text-zinc-600">
                {player.userId.slice(0, 8)}
            </span>
        </div>
    );
}

function EventRow({
    label,
    value,
    dotClass,
}: {
    label: string;
    value: number;
    dotClass: string;
}) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span
                    className={`h-2 w-2 rounded-full ${dotClass}`}
                />

                <span className="text-xs text-zinc-400">
                    {label}
                </span>
            </div>

            <span className="font-mono text-xs text-zinc-300">
                {value}
            </span>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="mt-3 text-xs text-zinc-600">
            No journey data available.
        </div>
    );
}

function countEvents(
    match: Match,
    eventType: string
) {
    return match.players.reduce(
        (total, player) =>
            total +
            player.events.filter(
                (event) => event.type === eventType
            ).length,
        0
    );
}

function calculateDistance(player: Player) {
    let distance = 0;

    for (
        let index = 1;
        index < player.positions.length;
        index++
    ) {
        const previous = player.positions[index - 1];
        const current = player.positions[index];

        const dx = current.x - previous.x;
        const dz = current.z - previous.z;

        distance += Math.sqrt(dx * dx + dz * dz);
    }

    return distance;
}