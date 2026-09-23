export type Position = {
    t: number;
    x: number;
    y: number | null;
    z: number;
    mapX: number;
    mapY: number;
};

export type PlayerEvent = {
    t: number;
    type: string;
    x?: number;
    y?: number | null;
    z?: number;
    mapX?: number;
    mapY?: number;
};

export type Player = {
    userId: string;
    isHuman: boolean;
    positions: Position[];
    events: PlayerEvent[];
};

export type Match = {
    matchId: string;
    mapId: string;
    startTime: string;
    endTime: string;
    durationMs: number;
    players: Player[];
    eventCount: number;
};

export type MatchIndexItem = {
    matchId: string;
    mapId: string;
    startTime: string;
    endTime: string;
    durationMs: number;
    playerCount: number;
    humanCount: number;
    botCount: number;
    eventCount: number;
};

export type EventVisibility = Record<string, boolean>;