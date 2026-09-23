import type { Player } from "@/lib/types";

type Props = {
    player: Player;
    currentTime: number;
    selected: boolean;
};

export default function PlayerPath({
    player,
    currentTime,
    selected,
}: Props) {
    const positions = player.positions.filter(
        (position) => position.t <= currentTime
    );

    if (positions.length < 2) {
        return null;
    }

    const path = positions
        .map((position, index) => {
            return `${index === 0 ? "M" : "L"} ${position.mapX} ${position.mapY
                }`;
        })
        .join(" ");

    return (
        <path
            d={path}
            fill="none"
            stroke={
                player.isHuman
                    ? "rgb(56 189 248)"
                    : "rgb(251 146 60)"
            }
            strokeWidth={selected ? 3 : 2}
            strokeOpacity={selected ? 0.9 : 0.18}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    );
}