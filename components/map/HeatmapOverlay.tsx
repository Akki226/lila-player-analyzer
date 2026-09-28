import type { HeatmapMode, Match } from "@/lib/types";

type Props = {
    match: Match;
    mode: HeatmapMode;
    visiblePlayerIds: Set<string>;
};

type HeatPoint = {
    x: number;
    y: number;
    weight: number;
};

const GRID_SIZE = 32;

export default function HeatmapOverlay({
    match,
    mode,
    visiblePlayerIds,
}: Props) {
    if (mode === "off") {
        return null;
    }

    const cells = buildHeatmap(
        match,
        mode,
        visiblePlayerIds
    );

    if (cells.length === 0) {
        return null;
    }

    const maxWeight = Math.max(
        ...cells.map((cell) => cell.weight)
    );

    if (maxWeight <= 0) {
        return null;
    }

    return (
        <g pointerEvents="none">
            {cells.map((cell) => {
                const intensity =
                    cell.weight / maxWeight;

                /*
                 * Keep very low-density cells subtle while
                 * making the strongest areas clearly visible.
                 */
                const opacity =
                    0.08 + intensity * 0.62;

                return (
                    <rect
                        key={`${cell.x}-${cell.y}`}
                        x={cell.x}
                        y={cell.y}
                        width={1024 / GRID_SIZE}
                        height={1024 / GRID_SIZE}
                        fill={getHeatmapColor(mode)}
                        opacity={opacity}
                    />
                );
            })}
        </g>
    );
}

function buildHeatmap(
    match: Match,
    mode: HeatmapMode,
    visiblePlayerIds: Set<string>
): HeatPoint[] {
    const grid = new Map<string, HeatPoint>();

    for (const player of match.players) {
        if (!visiblePlayerIds.has(player.userId)) {
            continue;
        }

        if (mode === "traffic") {
            for (const position of player.positions) {
                addPoint(
                    grid,
                    position.mapX,
                    position.mapY
                );
            }
        }

        if (mode === "kills") {
            for (const event of player.events) {
                if (
                    event.type !== "Kill" &&
                    event.type !== "BotKill"
                ) {
                    continue;
                }

                if (
                    event.mapX === undefined ||
                    event.mapY === undefined
                ) {
                    continue;
                }

                addPoint(
                    grid,
                    event.mapX,
                    event.mapY
                );
            }
        }

        if (mode === "deaths") {
            for (const event of player.events) {
                if (
                    event.type !== "Killed" &&
                    event.type !== "BotKilled" &&
                    event.type !== "KilledByStorm"
                ) {
                    continue;
                }

                if (
                    event.mapX === undefined ||
                    event.mapY === undefined
                ) {
                    continue;
                }

                addPoint(
                    grid,
                    event.mapX,
                    event.mapY
                );
            }
        }
    }

    return Array.from(grid.values());
}

function addPoint(
    grid: Map<string, HeatPoint>,
    mapX: number,
    mapY: number
) {
    const cellSize = 1024 / GRID_SIZE;

    const column = Math.floor(mapX / cellSize);
    const row = Math.floor(mapY / cellSize);

    if (
        column < 0 ||
        column >= GRID_SIZE ||
        row < 0 ||
        row >= GRID_SIZE
    ) {
        return;
    }

    const key = `${column}-${row}`;

    const existing = grid.get(key);

    if (existing) {
        existing.weight += 1;
        return;
    }

    grid.set(key, {
        x: column * cellSize,
        y: row * cellSize,
        weight: 1,
    });
}

function getHeatmapColor(mode: HeatmapMode) {
    switch (mode) {
        case "traffic":
            return "#38bdf8";

        case "kills":
            return "#ef4444";

        case "deaths":
            return "#a855f7";

        default:
            return "transparent";
    }
}
