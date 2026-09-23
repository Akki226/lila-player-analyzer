"use client";

type Props = {
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    onSeek: (time: number) => void;
    onTogglePlayback: () => void;
};

export default function Timeline({
    currentTime,
    duration,
    isPlaying,
    onSeek,
    onTogglePlayback,
}: Props) {
    const safeDuration = Math.max(duration, 1);

    const progress =
        Math.min(
            Math.max(currentTime / safeDuration, 0),
            1
        ) * 100;

    return (
        <div className="flex items-center gap-4">
            <button
                type="button"
                onClick={onTogglePlayback}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black transition hover:bg-zinc-200"
                aria-label={
                    isPlaying ? "Pause playback" : "Play playback"
                }
            >
                {isPlaying ? "Ⅱ" : "▶"}
            </button>

            <div className="min-w-0 flex-1">
                <input
                    type="range"
                    min={0}
                    max={safeDuration}
                    step={1}
                    value={Math.min(currentTime, safeDuration)}
                    onChange={(event) =>
                        onSeek(Number(event.target.value))
                    }
                    className="timeline-slider w-full"
                    style={{
                        background: `linear-gradient(
              to right,
              rgb(56 189 248) ${progress}%,
              rgb(63 63 70) ${progress}%
            )`,
                    }}
                />
            </div>

            <div className="w-[110px] shrink-0 text-right font-mono text-xs text-zinc-400">
                {formatTime(currentTime)}
                {" / "}
                {formatTime(duration)}
            </div>
        </div>
    );
}

function formatTime(milliseconds: number) {
    return `${(milliseconds / 1000).toFixed(3)}s`;
}