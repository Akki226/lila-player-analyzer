import type {
    Match,
    MatchIndexItem,
} from "./types";

export async function loadMatchData(): Promise<{
    matchIndex: MatchIndexItem[];
    matches: Record<string, Match>;
}> {
    const [indexResponse, matchesResponse] =
        await Promise.all([
            fetch("/data/match_index.json"),
            fetch("/data/matches.json"),
        ]);

    if (!indexResponse.ok) {
        throw new Error(
            `Failed to load match index: ${indexResponse.status}`
        );
    }

    if (!matchesResponse.ok) {
        throw new Error(
            `Failed to load matches: ${matchesResponse.status}`
        );
    }

    const matchIndex =
        (await indexResponse.json()) as MatchIndexItem[];

    const matches =
        (await matchesResponse.json()) as Record<
            string,
            Match
        >;

    return {
        matchIndex,
        matches,
    };
}