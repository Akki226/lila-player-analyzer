from pathlib import Path
from collections import defaultdict
import json

import pandas as pd
import pyarrow.parquet as pq


# ============================================================================
# CONFIG
# ============================================================================

DATA_DIR = Path("player_data")
OUTPUT_DIR = Path("processed")

MINIMAP_SIZE = 1024

MAP_CONFIG = {
    "AmbroseValley": {
        "scale": 900,
        "origin_x": -370,
        "origin_z": -473,
        "image": "AmbroseValley_Minimap.png",
    },
    "GrandRift": {
        "scale": 581,
        "origin_x": -290,
        "origin_z": -290,
        "image": "GrandRift_Minimap.png",
    },
    "Lockdown": {
        "scale": 1000,
        "origin_x": -500,
        "origin_z": -500,
        "image": "Lockdown_Minimap.jpg",
    },
}

GAME_DATE_MAP = {
    "February_10": "2026-02-10",
    "February_11": "2026-02-11",
    "February_12": "2026-02-12",
    "February_13": "2026-02-13",
    "February_14": "2026-02-14",
}


MOVEMENT_EVENTS = {
    "Position",
    "BotPosition",
}

DISCRETE_EVENTS = {
    "Kill",
    "Killed",
    "BotKill",
    "BotKilled",
    "KilledByStorm",
    "Loot",
}


# ============================================================================
# HELPERS
# ============================================================================


def decode_event(value):
    """Convert the Parquet binary event value into a string."""
    if isinstance(value, bytes):
        return value.decode("utf-8")

    return str(value)


def is_human(user_id):
    """
    Human player IDs are UUIDs containing '-'.
    Bot IDs are short numeric IDs.
    """
    return "-" in str(user_id)


def infer_game_date(file_path):
    """
    Extract the production gameplay date from the dataset folder.

    Expected structure:

        player_data/Feb10/*.nakama-0
        player_data/Feb11/*.nakama-0
        player_data/Feb12/*.nakama-0
        player_data/Feb13/*.nakama-0
        player_data/Feb14/*.nakama-0

    We intentionally do not derive this from the Parquet timestamp because
    the supplied ts field represents telemetry time rather than the
    production calendar date.
    """

    for part in file_path.parts:
        if part in GAME_DATE_MAP:
            return GAME_DATE_MAP[part]

    return None


def world_to_minimap(x, z, map_id):
    """
    Convert world coordinates to 1024x1024 minimap coordinates.

    x/z are used for the 2D map.
    The minimap's Y axis is flipped because image coordinates
    start from the top-left.
    """
    config = MAP_CONFIG[map_id]

    u = (x - config["origin_x"]) / config["scale"]
    v = (z - config["origin_z"]) / config["scale"]

    pixel_x = u * MINIMAP_SIZE
    pixel_y = (1 - v) * MINIMAP_SIZE

    return pixel_x, pixel_y


def timestamp_to_ms(timestamp, match_start):
    """
    Convert a Pandas timestamp into milliseconds elapsed
    since the beginning of the match.
    """
    delta = timestamp - match_start

    return int(delta.total_seconds() * 1000)


def clean_number(value):
    """
    Convert numpy/pandas numeric values into normal Python numbers
    so they serialize cleanly to JSON.
    """
    if pd.isna(value):
        return None

    if hasattr(value, "item"):
        return value.item()

    return value


# ============================================================================
# LOAD DATA
# ============================================================================


def load_gameplay_data():
    print()
    print("Loading gameplay data...")
    print()

    gameplay_files = sorted(
        path
        for path in DATA_DIR.rglob("*")
        if path.is_file() and ".nakama-0" in path.name
    )

    print(f"Gameplay files found: {len(gameplay_files):,}")

    if not gameplay_files:
        raise FileNotFoundError(
            f"No gameplay files found in {DATA_DIR.resolve()}"
        )

    frames = []

    for index, file_path in enumerate(gameplay_files, start=1):
        try:
            table = pq.read_table(file_path)
            df = table.to_pandas()

            if df.empty:
                continue

            # Make sure IDs are strings.
            df["user_id"] = df["user_id"].astype(str)
            df["match_id"] = df["match_id"].astype(str)
            df["map_id"] = df["map_id"].astype(str)

            # Decode binary event values.
            df["event"] = df["event"].apply(decode_event)

            # Make sure timestamps are datetime.
            df["ts"] = pd.to_datetime(df["ts"])

            # Preserve the production gameplay date from the source folder.
            df["game_date"] = infer_game_date(file_path)

            frames.append(df)

        except Exception as error:
            print(
                f"WARNING: Failed to read {file_path.name}: {error}"
            )

        if index % 100 == 0 or index == len(gameplay_files):
            print(
                f"Processed {index:,}/{len(gameplay_files):,} files"
            )

    if not frames:
        raise RuntimeError("No gameplay data could be loaded.")

    data = pd.concat(frames, ignore_index=True)

    # Sort once globally so all subsequent grouping is deterministic.
    data = data.sort_values(
        ["match_id", "user_id", "ts"]
    ).reset_index(drop=True)

    print()
    print(f"Loaded {len(data):,} event rows.")

    return data


# ============================================================================
# BUILD MATCH METADATA
# ============================================================================


def build_match_times(data):
    """
    Calculate the first and last timestamp for each match.

    Also preserve the production gameplay date from the source folder.

    Important:
    Keep timestamps as Pandas timestamps internally.
    We only convert them to ISO strings when writing JSON.
    """

    match_times = (
        data.groupby("match_id")
        .agg(
            start=("ts", "min"),
            end=("ts", "max"),
            game_date=("game_date", "first"),
        )
        .reset_index()
    )

    match_times = {
        row["match_id"]: {
            "start": row["start"],
            "end": row["end"],
            "gameDate": row["game_date"],
        }
        for _, row in match_times.iterrows()
    }

    return match_times


# ============================================================================
# BUILD PLAYER JOURNEYS
# ============================================================================


def build_player_journeys(data, match_times):
    print()
    print("Building player journeys...")

    matches = {}

    grouped_players = data.groupby(
        ["match_id", "user_id"],
        sort=False,
    )

    total_players = len(grouped_players)

    for player_index, ((match_id, user_id), player_df) in enumerate(
        grouped_players,
        start=1,
    ):
        player_df = player_df.sort_values("ts")

        match_id = str(match_id)
        user_id = str(user_id)

        map_id = str(player_df["map_id"].iloc[0])

        match_start = match_times[match_id]["start"]
        match_end = match_times[match_id]["end"]
        game_date = match_times[match_id]["gameDate"]

        human = is_human(user_id)

        # ------------------------------------------------------------------
        # Create match container if this is the first player we encounter.
        # ------------------------------------------------------------------

        if match_id not in matches:
            matches[match_id] = {
                "matchId": match_id,
                "mapId": map_id,
                "gameDate": game_date,

                # IMPORTANT:
                # Keep these as Timestamp objects while processing.
                # They will be converted to ISO strings later.
                "startTime": match_start,
                "endTime": match_end,

                "durationMs": timestamp_to_ms(
                    match_end,
                    match_start,
                ),

                "players": [],
                "eventCount": 0,
            }

        else:
            # Keep everything as Timestamp objects.
            if match_start < matches[match_id]["startTime"]:
                matches[match_id]["startTime"] = match_start

            if match_end > matches[match_id]["endTime"]:
                matches[match_id]["endTime"] = match_end

            matches[match_id]["durationMs"] = timestamp_to_ms(
                matches[match_id]["endTime"],
                matches[match_id]["startTime"],
            )

            # Preserve the first valid gameplay date.
            if not matches[match_id].get("gameDate"):
                matches[match_id]["gameDate"] = game_date

        # ------------------------------------------------------------------
        # Build player object.
        # ------------------------------------------------------------------

        player = {
            "userId": user_id,
            "isHuman": human,
            "positions": [],
            "events": [],
        }

        # ------------------------------------------------------------------
        # Build events.
        # ------------------------------------------------------------------

        for _, row in player_df.iterrows():
            timestamp = row["ts"]

            t = timestamp_to_ms(
                timestamp,
                match_start,
            )

            event_type = row["event"]

            x = clean_number(row["x"])
            y = clean_number(row["y"])
            z = clean_number(row["z"])

            # --------------------------------------------------------------
            # Movement
            # --------------------------------------------------------------

            if event_type in MOVEMENT_EVENTS:
                if x is None or z is None:
                    continue

                map_x, map_y = world_to_minimap(
                    x,
                    z,
                    map_id,
                )

                position = {
                    "t": t,
                    "x": x,
                    "y": y,
                    "z": z,
                    "mapX": round(map_x, 2),
                    "mapY": round(map_y, 2),
                }

                player["positions"].append(position)

            # --------------------------------------------------------------
            # Discrete events
            # --------------------------------------------------------------

            elif event_type in DISCRETE_EVENTS:
                event = {
                    "t": t,
                    "type": event_type,
                }

                if x is not None and z is not None:
                    map_x, map_y = world_to_minimap(
                        x,
                        z,
                        map_id,
                    )

                    event["x"] = x
                    event["y"] = y
                    event["z"] = z
                    event["mapX"] = round(map_x, 2)
                    event["mapY"] = round(map_y, 2)

                player["events"].append(event)

        # ------------------------------------------------------------------
        # Add player to match.
        # ------------------------------------------------------------------

        matches[match_id]["players"].append(player)

        matches[match_id]["eventCount"] += (
            len(player["positions"])
            + len(player["events"])
        )

        if player_index % 100 == 0 or player_index == total_players:
            print(
                f"Built {player_index:,}/{total_players:,} player journeys"
            )

    return matches


# ============================================================================
# BUILD MATCH INDEX
# ============================================================================


def build_match_index(matches):
    print()
    print("Building match index...")

    match_index = []

    for match_id, match in matches.items():
        players = match["players"]

        human_count = sum(
            1
            for player in players
            if player["isHuman"]
        )

        bot_count = sum(
            1
            for player in players
            if not player["isHuman"]
        )

        match_index.append(
            {
                "matchId": match_id,
                "mapId": match["mapId"],
                "gameDate": match["gameDate"],
                "startTime": match["startTime"].isoformat(),
                "endTime": match["endTime"].isoformat(),
                "durationMs": match["durationMs"],
                "playerCount": len(players),
                "humanCount": human_count,
                "botCount": bot_count,
                "eventCount": match["eventCount"],
            }
        )

    match_index.sort(
        key=lambda match: (
            match["gameDate"] or "",
            match["startTime"],
        )
    )

    return match_index


# ============================================================================
# SERIALIZATION
# ============================================================================


def prepare_matches_for_json(matches):
    """
    Convert internal Pandas timestamps into JSON-safe ISO strings.
    """

    for match in matches.values():
        match["startTime"] = match["startTime"].isoformat()
        match["endTime"] = match["endTime"].isoformat()

    return matches


# ============================================================================
# WRITE OUTPUT
# ============================================================================


def write_output(matches, match_index):
    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    matches_path = OUTPUT_DIR / "matches.json"
    index_path = OUTPUT_DIR / "match_index.json"

    matches = prepare_matches_for_json(matches)

    print()
    print("Writing output...")

    with matches_path.open(
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            matches,
            file,
            ensure_ascii=False,
            indent=2,
        )

    with index_path.open(
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            match_index,
            file,
            ensure_ascii=False,
            indent=2,
        )

    print(f"Written: {matches_path}")
    print(f"Written: {index_path}")


# ============================================================================
# SUMMARY
# ============================================================================


def print_summary(matches, match_index):
    print()
    print("=" * 70)
    print("PREPROCESSING COMPLETE")
    print("=" * 70)

    total_matches = len(matches)

    total_players = sum(
        len(match["players"])
        for match in matches.values()
    )

    total_humans = sum(
        1
        for match in matches.values()
        for player in match["players"]
        if player["isHuman"]
    )

    total_bots = total_players - total_humans

    total_positions = sum(
        len(player["positions"])
        for match in matches.values()
        for player in match["players"]
    )

    total_events = sum(
        len(player["events"])
        for match in matches.values()
        for player in match["players"]
    )

    maps = defaultdict(int)
    dates = defaultdict(int)

    for match in matches.values():
        maps[match["mapId"]] += 1
        dates[match["gameDate"]] += 1

    print()
    print(f"Matches:          {total_matches:,}")
    print(f"Players:          {total_players:,}")
    print(f"Humans:           {total_humans:,}")
    print(f"Bots:             {total_bots:,}")
    print(f"Positions:        {total_positions:,}")
    print(f"Discrete events:  {total_events:,}")

    print()
    print("Matches by map:")

    for map_id, count in sorted(maps.items()):
        print(f"  {map_id}: {count:,}")

    print()
    print("Matches by gameplay date:")

    for game_date, count in sorted(dates.items()):
        print(f"  {game_date}: {count:,}")

    if match_index:
        durations = [
            match["durationMs"]
            for match in match_index
        ]

        print()
        print("Match duration:")
        print(f"  Minimum: {min(durations):,} ms")
        print(f"  Maximum: {max(durations):,} ms")
        print(
            f"  Average: {sum(durations) / len(durations):,.0f} ms"
        )

    print()
    print(f"Output directory: {OUTPUT_DIR.resolve()}")
    print()

    print("Generated files:")
    print(f"  - {OUTPUT_DIR / 'matches.json'}")
    print(f"  - {OUTPUT_DIR / 'match_index.json'}")

    print()
    print("=" * 70)


# ============================================================================
# MAIN
# ============================================================================


def main():
    print("=" * 70)
    print("LILA BLACK DATA PREPROCESSING")
    print("=" * 70)

    # ----------------------------------------------------------------------
    # Load raw Parquet data
    # ----------------------------------------------------------------------

    data = load_gameplay_data()

    # ----------------------------------------------------------------------
    # Determine match start/end timestamps
    # ----------------------------------------------------------------------

    match_times = build_match_times(data)

    # ----------------------------------------------------------------------
    # Build player journeys and match objects
    # ----------------------------------------------------------------------

    matches = build_player_journeys(
        data,
        match_times,
    )

    # ----------------------------------------------------------------------
    # Build lightweight index for frontend filtering
    # ----------------------------------------------------------------------

    match_index = build_match_index(matches)

    # ----------------------------------------------------------------------
    # Write JSON files
    # ----------------------------------------------------------------------

    write_output(
        matches,
        match_index,
    )

    # ----------------------------------------------------------------------
    # Print final statistics
    # ----------------------------------------------------------------------

    print_summary(
        matches,
        match_index,
    )


if __name__ == "__main__":
    main()