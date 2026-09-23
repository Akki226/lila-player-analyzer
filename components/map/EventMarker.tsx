import type { PlayerEvent } from "@/lib/types";

type Props = {
    event: PlayerEvent;
};

export default function EventMarker({
    event,
}: Props) {
    if (
        event.mapX === undefined ||
        event.mapY === undefined
    ) {
        return null;
    }

    const isLoot = event.type === "Loot";

    const isKill =
        event.type === "Kill" ||
        event.type === "BotKill";

    const isDeath =
        event.type === "Killed" ||
        event.type === "BotKilled" ||
        event.type === "KilledByStorm";

    let fill = "white";

    if (isLoot) {
        fill = "rgb(250 204 21)";
    } else if (isKill) {
        fill = "rgb(239 68 68)";
    } else if (isDeath) {
        fill = "rgb(168 85 247)";
    }

    return (
        <g>
            <circle
                cx={event.mapX}
                cy={event.mapY}
                r="5"
                fill="black"
                opacity="0.7"
            />

            <circle
                cx={event.mapX}
                cy={event.mapY}
                r="3.5"
                fill={fill}
                stroke="white"
                strokeWidth="0.75"
            />
        </g>
    );
}