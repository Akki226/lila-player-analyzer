import type { Player } from "@/lib/types";

type Props = {
    player: Player;
};

export default function PlayerDetails({
    player,
}: Props) {
    const distance = calculateDistance(player);

    const lootCount = player.events.filter(
        (event) => event.type === "Loot"
    ).length;

    const killCount = player.events.filter(
        (event) =>
            event.type === "Kill" ||
            event.type === "BotKill"
    ).length;

    const deathCount = player.events.filter(
        (event) =>
            event.type === "Killed" ||
            event.type === "BotKilled" ||
            event.type === "KilledByStorm"
    ).length;

    const duration =
        player.positions.length > 1
            ? player.positions[
                player.positions.length - 1
            ].t - player.positions[0].t
            : 0;

    return (
        <section>
            <div className="mb-3 flex items-center justify-between">
                <div className="text-xs uppercase tracking-wider text-zinc-500">
                    Selected Player
                </div>

                <span
                    className={`rounded-full px-2 py-1 text-[10px] ${player.isHuman
                        ? "bg-sky-400/10 text-sky-400"
                        : "bg-orange-400/10 text-orange-400"
                        }`}
                >
                    {player.isHuman ? "HUMAN" : "BOT"}
                </span>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <div className="font-mono text-xs text-zinc-400">
                    {player.userId}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                    <Metric
                        label="Positions"
                        value={player.positions.length}
                    />

                    <Metric
                        label="Events"
                        value={player.events.length}
                    />

                    <Metric
                        label="Distance"
                        value={`${distance.toFixed(1)}m`}
                    />

                    <Metric
                        label="Duration"
                        value={`${(duration / 1000).toFixed(3)}s`}
                    />

                    <Metric
                        label="Loot"
                        value={lootCount}
                    />

                    <Metric
                        label="Kills"
                        value={killCount}
                    />

                    <Metric
                        label="Deaths"
                        value={deathCount}
                    />

                    <Metric
                        label="Start X"
                        value={
                            player.positions.length > 0
                                ? player.positions[0].x.toFixed(1)
                                : "—"
                        }
                    />
                </div>
            </div>

            <div className="mt-4">
                <div className="mb-3 text-xs uppercase tracking-wider text-zinc-500">
                    Event Timeline
                </div>

                {player.events.length === 0 ? (
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3 text-xs text-zinc-600">
                        No discrete events recorded.
                    </div>
                ) : (
                    <div className="max-h-[220px] space-y-1 overflow-y-auto pr-1">
                        {player.events.map((event, index) => (
                            <div
                                key={`${event.type}-${event.t}-${index}`}
                                className="flex items-center justify-between rounded-lg border border-zinc-800/70 bg-zinc-900/30 px-3 py-2"
                            >
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`h-2 w-2 rounded-full ${eventColor(
                                            event.type
                                        )}`}
                                    />

                                    <span className="text-xs text-zinc-300">
                                        {event.type}
                                    </span>
                                </div>

                                <span className="font-mono text-[10px] text-zinc-600">
                                    {formatTime(event.t)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

function Metric({
    label,
    value,
}: {
    label: string;
    value: number | string;
}) {
    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-2.5">
            <div className="text-sm font-medium text-zinc-200">
                {value}
            </div>

            <div className="mt-1 text-[10px] text-zinc-600">
                {label}
            </div>
        </div>
    );
}

function calculateDistance(player: Player) {
    let distance = 0;

    for (let index = 1; index < player.positions.length; index++) {
        const previous = player.positions[index - 1];
        const current = player.positions[index];

        const dx = current.x - previous.x;
        const dz = current.z - previous.z;

        distance += Math.sqrt(
            dx * dx + dz * dz
        );
    }

    return distance;
}

function formatTime(milliseconds: number) {
    return `${(milliseconds / 1000).toFixed(3)}s`;
}

function eventColor(eventType: string) {
    if (eventType === "Loot") {
        return "bg-yellow-400";
    }

    if (
        eventType === "Kill" ||
        eventType === "BotKill"
    ) {
        return "bg-red-400";
    }

    if (
        eventType === "Killed" ||
        eventType === "BotKilled" ||
        eventType === "KilledByStorm"
    ) {
        return "bg-purple-400";
    }

    return "bg-zinc-400";
}