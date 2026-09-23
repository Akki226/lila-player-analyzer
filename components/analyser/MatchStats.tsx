import type { MatchIndexItem } from "@/lib/types";

type Props = {
    index: MatchIndexItem;
};

export default function MatchStats({ index }: Props) {
    return (
        <section>
            <div className="mb-3 text-xs uppercase tracking-wider text-zinc-500">
                Overview
            </div>

            <div className="grid grid-cols-2 gap-2">
                <Stat
                    label="Players"
                    value={index.playerCount}
                />

                <Stat
                    label="Humans"
                    value={index.humanCount}
                />

                <Stat
                    label="Bots"
                    value={index.botCount}
                />

                <Stat
                    label="Events"
                    value={index.eventCount}
                />
            </div>
        </section>
    );
}

function Stat({
    label,
    value,
}: {
    label: string;
    value: number;
}) {
    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
            <div className="text-xl font-semibold">
                {value}
            </div>

            <div className="mt-1 text-[11px] text-zinc-500">
                {label}
            </div>
        </div>
    );
}