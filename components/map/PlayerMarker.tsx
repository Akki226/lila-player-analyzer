import type {
    Player,
    Position,
} from "@/lib/types";

type Props = {
    player: Player;
    currentTime: number;
    selected: boolean;
};

export default function PlayerMarker({
    player,
    currentTime,
    selected,
}: Props) {
    const position = getPositionAtTime(
        player.positions,
        currentTime
    );

    if (!position) {
        return null;
    }

    const radius = selected ? 6 : 4;

    return (
        <g
            opacity={selected ? 1 : 0.2}
        >
            <circle
                cx={position.mapX}
                cy={position.mapY}
                r={radius + 2}
                fill="black"
                opacity={0.7}
            />

            <circle
                cx={position.mapX}
                cy={position.mapY}
                r={radius}
                fill={
                    player.isHuman
                        ? "rgb(56 189 248)"
                        : "rgb(251 146 60)"
                }
                stroke="white"
                strokeWidth="1.5"
            />
        </g>
    );
}

function getPositionAtTime(
    positions: Position[],
    currentTime: number
): Position | null {
    if (positions.length === 0) {
        return null;
    }

    if (currentTime < positions[0].t) {
        return null;
    }

    if (currentTime >= positions[positions.length - 1].t) {
        return positions[positions.length - 1];
    }

    for (let index = 0; index < positions.length - 1; index++) {
        const previous = positions[index];
        const next = positions[index + 1];

        if (
            currentTime >= previous.t &&
            currentTime <= next.t
        ) {
            const interval = next.t - previous.t;

            if (interval <= 0) {
                return previous;
            }

            const progress =
                (currentTime - previous.t) / interval;

            return {
                ...previous,
                t: currentTime,
                mapX:
                    previous.mapX +
                    (next.mapX - previous.mapX) * progress,
                mapY:
                    previous.mapY +
                    (next.mapY - previous.mapY) * progress,
            };
        }
    }

    return null;
}