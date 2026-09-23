"use client";

import { useEffect, useMemo, useState } from "react";

import { loadMatchData } from "@/lib/data";
import type {
    EventVisibility,
    Match,
    MatchIndexItem,
} from "@/lib/types";

import GameMap from "../map/GameMap";
import MatchSelector from "./MatchSelector";
import MatchSidebar from "./MatchSidebar";
import Timeline from "./Timeline";

const DEFAULT_EVENTS: EventVisibility = {
    Kill: true,
    Killed: true,
    BotKill: true,
    BotKilled: true,
    KilledByStorm: true,
    Loot: true,
};

export default function PlayerAnalyzer() {
    const [matchIndex, setMatchIndex] = useState<MatchIndexItem[]>([]);
    const [matches, setMatches] = useState<Record<string, Match>>({});

    const [selectedMatchId, setSelectedMatchId] = useState("");
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(
        null
    );

    const [showHumans, setShowHumans] = useState(true);
    const [showBots, setShowBots] = useState(true);

    const [enabledEvents, setEnabledEvents] =
        useState<EventVisibility>(DEFAULT_EVENTS);

    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /*
     * Load processed data.
     */
    useEffect(() => {
        async function initialize() {
            try {
                const data = await loadMatchData();

                setMatchIndex(data.matchIndex);
                setMatches(data.matches);

                if (data.matchIndex.length > 0) {
                    setSelectedMatchId(data.matchIndex[0].matchId);
                }
            } catch (err) {
                console.error(err);

                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load player data."
                );
            } finally {
                setLoading(false);
            }
        }

        initialize();
    }, []);

    /*
     * Current match.
     */
    const selectedMatch = useMemo(
        () => matches[selectedMatchId],
        [matches, selectedMatchId]
    );

    /*
     * Current match index metadata.
     */
    const selectedIndex = useMemo(
        () =>
            matchIndex.find(
                (match) => match.matchId === selectedMatchId
            ),
        [matchIndex, selectedMatchId]
    );

    /*
     * Reset playback/player selection when changing matches.
     */
    useEffect(() => {
        setCurrentTime(0);
        setIsPlaying(false);
        setSelectedPlayerId(null);
    }, [selectedMatchId]);

    /*
     * Playback loop.
     *
     * The supplied telemetry timestamps are in milliseconds,
     * so playback uses the same time scale.
     */
    useEffect(() => {
        if (!isPlaying || !selectedMatch) {
            return;
        }

        let animationFrame = 0;
        let previousTimestamp: number | null = null;

        const animate = (timestamp: number) => {
            if (previousTimestamp === null) {
                previousTimestamp = timestamp;
            }

            const delta = timestamp - previousTimestamp;
            previousTimestamp = timestamp;

            setCurrentTime((previous) => {
                const next = previous + delta;

                if (next >= selectedMatch.durationMs) {
                    setIsPlaying(false);
                    return selectedMatch.durationMs;
                }

                return next;
            });

            animationFrame = requestAnimationFrame(animate);
        };

        animationFrame = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationFrame);
        };
    }, [isPlaying, selectedMatch]);

    function handleMatchChange(matchId: string) {
        setSelectedMatchId(matchId);
    }

    function handleToggleEvent(eventType: string) {
        setEnabledEvents((current) => ({
            ...current,
            [eventType]: !current[eventType],
        }));
    }

    function handleSeek(time: number) {
        setCurrentTime(time);

        if (time < (selectedMatch?.durationMs ?? 0)) {
            setIsPlaying(false);
        }
    }

    function handleTogglePlayback() {
        if (!selectedMatch) {
            return;
        }

        if (currentTime >= selectedMatch.durationMs) {
            setCurrentTime(0);
            setIsPlaying(true);
            return;
        }

        setIsPlaying((current) => !current);
    }

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#0b0d10] text-white">
                <div className="text-sm text-zinc-400">
                    Loading player data...
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#0b0d10] px-6 text-white">
                <div className="max-w-lg rounded-xl border border-red-900 bg-red-950/30 p-6">
                    <h1 className="font-semibold text-red-300">
                        Failed to load data
                    </h1>

                    <p className="mt-2 text-sm text-red-400">
                        {error}
                    </p>
                </div>
            </main>
        );
    }

    if (!selectedMatch || !selectedIndex) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#0b0d10] text-white">
                <div className="text-sm text-zinc-500">
                    No matches available.
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#0b0d10] text-white">
            {/* Header */}
            <header className="border-b border-zinc-800 px-6 py-4">
                <div className="flex items-center justify-between gap-6">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            LILA Player Analyzer
                        </h1>

                        <p className="mt-1 text-xs text-zinc-500">
                            Player journeys, combat events and match telemetry
                        </p>
                    </div>

                    <MatchSelector
                        matches={matchIndex}
                        selectedMatchId={selectedMatchId}
                        onChange={handleMatchChange}
                    />
                </div>
            </header>

            {/* Main content */}
            <div className="grid min-h-[calc(100vh-73px)] grid-cols-[minmax(0,1fr)_320px]">
                {/* Map area */}
                <section className="relative flex min-h-0 items-center justify-center p-6 pb-24">
                    <GameMap
                        match={selectedMatch}
                        currentTime={currentTime}
                        selectedPlayerId={selectedPlayerId}
                        showHumans={showHumans}
                        showBots={showBots}
                        enabledEvents={enabledEvents}
                    />

                    {/* Timeline */}
                    <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-800 bg-[#0e1014] px-6 py-4">
                        <Timeline
                            currentTime={currentTime}
                            duration={selectedMatch.durationMs}
                            isPlaying={isPlaying}
                            onSeek={handleSeek}
                            onTogglePlayback={handleTogglePlayback}
                        />
                    </div>
                </section>

                {/* Sidebar */}
                <aside className="border-l border-zinc-800 bg-[#0e1014] p-5">
                    <MatchSidebar
                        match={selectedMatch}
                        index={selectedIndex}
                        selectedPlayerId={selectedPlayerId}
                        showHumans={showHumans}
                        showBots={showBots}
                        enabledEvents={enabledEvents}
                        onSelectPlayer={setSelectedPlayerId}
                        onShowHumans={setShowHumans}
                        onShowBots={setShowBots}
                        onToggleEvent={handleToggleEvent}
                    />
                </aside>
            </div>
        </main>
    );
}