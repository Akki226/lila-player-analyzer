from pathlib import Path
from collections import Counter

import pandas as pd
import pyarrow.parquet as pq


# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------

DATA_DIR = Path("player_data")


# ---------------------------------------------------------
# Helpers
# ---------------------------------------------------------

def decode_event(value):
    """Convert Parquet binary event values into strings."""
    if isinstance(value, bytes):
        return value.decode("utf-8")
    return str(value)


def is_human(user_id):
    """Humans have UUID-style IDs; bots have numeric IDs."""
    user_id = str(user_id)
    return "-" in user_id


# ---------------------------------------------------------
# Discover files
# ---------------------------------------------------------

files = []

for path in DATA_DIR.rglob("*"):
    if path.is_file() and ".nakama-0" in path.name:
        files.append(path)

print("=" * 70)
print("LILA BLACK DATASET ANALYSIS")
print("=" * 70)

print(f"\nData directory: {DATA_DIR}")
print(f"Files found: {len(files):,}")


# ---------------------------------------------------------
# Read all files
# ---------------------------------------------------------

frames = []
failed_files = []

for index, filepath in enumerate(files, start=1):

    try:
        table = pq.read_table(filepath)
        df = table.to_pandas()

        if "event" in df.columns:
            df["event"] = df["event"].apply(decode_event)

        # Keep track of which source file produced each row.
        df["_source_file"] = filepath.name
        df["_source_day"] = filepath.parent.name

        frames.append(df)

    except Exception as error:
        failed_files.append((str(filepath), str(error)))

    # Progress every 100 files
    if index % 100 == 0 or index == len(files):
        print(f"Processed {index:,}/{len(files):,} files")


if not frames:
    raise RuntimeError("No Parquet files could be read.")


data = pd.concat(frames, ignore_index=True)


# ---------------------------------------------------------
# Basic statistics
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("BASIC STATISTICS")
print("=" * 70)

print(f"\nTotal event rows: {len(data):,}")

print(f"Unique players/bots: {data['user_id'].nunique():,}")

print(f"Unique matches: {data['match_id'].nunique():,}")

print(f"Maps: {data['map_id'].nunique()}")

print("\nMap names:")
for map_name in sorted(data["map_id"].dropna().unique()):
    print(f"  - {map_name}")


# ---------------------------------------------------------
# Date / source distribution
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("ROWS BY DAY")
print("=" * 70)

rows_by_day = data.groupby("_source_day").size().sort_index()

for day, count in rows_by_day.items():
    print(f"{day:20} {count:>8,}")


# ---------------------------------------------------------
# Event distribution
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("EVENT DISTRIBUTION")
print("=" * 70)

event_counts = data["event"].value_counts()

for event, count in event_counts.items():
    percentage = count / len(data) * 100
    print(f"{event:20} {count:>8,}  ({percentage:6.2f}%)")


# ---------------------------------------------------------
# Human vs bot
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("HUMANS VS BOTS")
print("=" * 70)

player_types = data["user_id"].astype(str).apply(
    lambda user_id: "Human" if is_human(user_id) else "Bot"
)

unique_users = (
    pd.DataFrame({
        "user_id": data["user_id"].astype(str),
        "type": player_types,
    })
    .drop_duplicates("user_id")
)

human_count = (unique_users["type"] == "Human").sum()
bot_count = (unique_users["type"] == "Bot").sum()

print(f"Humans: {human_count:,}")
print(f"Bots:   {bot_count:,}")
print(f"Total:  {len(unique_users):,}")


# ---------------------------------------------------------
# Humans vs bots by event
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("EVENTS BY PLAYER TYPE")
print("=" * 70)

event_by_type = (
    data.assign(player_type=player_types)
    .groupby(["player_type", "event"])
    .size()
    .unstack(fill_value=0)
)

print(event_by_type.to_string())


# ---------------------------------------------------------
# Matches by map
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("MATCHES BY MAP")
print("=" * 70)

matches_by_map = (
    data[["match_id", "map_id"]]
    .drop_duplicates("match_id")
    .groupby("map_id")
    .size()
    .sort_values(ascending=False)
)

for map_name, count in matches_by_map.items():
    print(f"{map_name:20} {count:>6,}")


# ---------------------------------------------------------
# Players per match
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("PLAYERS PER MATCH")
print("=" * 70)

players_per_match = (
    data.groupby("match_id")["user_id"]
    .nunique()
)

print(f"Minimum: {players_per_match.min()}")
print(f"Maximum: {players_per_match.max()}")
print(f"Average: {players_per_match.mean():.2f}")
print(f"Median:  {players_per_match.median():.2f}")


# ---------------------------------------------------------
# Humans / bots per match
# ---------------------------------------------------------

match_players = (
    data[["match_id", "user_id"]]
    .drop_duplicates()
    .copy()
)

match_players["player_type"] = match_players["user_id"].astype(str).apply(
    lambda user_id: "Human" if is_human(user_id) else "Bot"
)

match_type_counts = (
    match_players
    .groupby(["match_id", "player_type"])
    .size()
    .unstack(fill_value=0)
)

print("\n" + "=" * 70)
print("HUMANS / BOTS PER MATCH")
print("=" * 70)

if "Human" in match_type_counts.columns:
    print(
        f"Average humans per match: "
        f"{match_type_counts['Human'].mean():.2f}"
    )

if "Bot" in match_type_counts.columns:
    print(
        f"Average bots per match: "
        f"{match_type_counts['Bot'].mean():.2f}"
    )


# ---------------------------------------------------------
# Match duration
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("MATCH DURATIONS")
print("=" * 70)

# ts is already datetime64[ms].
# The README describes it as elapsed match time represented
# through a timestamp-like value. We calculate durations by
# subtracting the earliest and latest timestamp in each match.

match_times = (
    data.groupby("match_id")["ts"]
    .agg(["min", "max"])
)

match_times["duration"] = (
    match_times["max"] - match_times["min"]
)

duration_seconds = (
    match_times["duration"]
    .dt.total_seconds()
)

print(f"Minimum: {duration_seconds.min():,.2f} seconds")
print(f"Maximum: {duration_seconds.max():,.2f} seconds")
print(f"Average: {duration_seconds.mean():,.2f} seconds")
print(f"Median:  {duration_seconds.median():,.2f} seconds")

# ---------------------------------------------------------
# Match size distribution
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("MATCH SIZE DISTRIBUTION")
print("=" * 70)

match_size_distribution = (
    data.groupby("match_id")["user_id"]
    .nunique()
    .value_counts()
    .sort_index()
)

for player_count, match_count in match_size_distribution.items():
    print(
        f"{player_count:>2} player(s): "
        f"{match_count:>4} match(es)"
    )


# ---------------------------------------------------------
# Sample matches
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("SAMPLE MATCHES")
print("=" * 70)

sample_matches = (
    data.groupby("match_id")
    .agg(
        map_id=("map_id", "first"),
        players=("user_id", "nunique"),
        events=("event", "size"),
        start=("ts", "min"),
        end=("ts", "max"),
    )
    .sort_values(["players", "events"], ascending=False)
)

print(
    sample_matches.head(20).to_string()
)


# ---------------------------------------------------------
# Position sampling intervals
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("POSITION SAMPLING")
print("=" * 70)

position_data = data[
    data["event"].isin(["Position", "BotPosition"])
].copy()

position_data = position_data.sort_values(
    ["match_id", "user_id", "ts"]
)

position_data["interval_ms"] = (
    position_data
    .groupby(["match_id", "user_id"])["ts"]
    .diff()
    .dt.total_seconds()
    * 1000
)

intervals = position_data["interval_ms"].dropna()

if len(intervals) > 0:
    print(f"Samples: {len(intervals):,}")
    print(f"Minimum interval: {intervals.min():,.1f} ms")
    print(f"Maximum interval: {intervals.max():,.1f} ms")
    print(f"Average interval: {intervals.mean():,.1f} ms")
    print(f"Median interval: {intervals.median():,.1f} ms")

# ---------------------------------------------------------
# Coordinate ranges
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("WORLD COORDINATE RANGES")
print("=" * 70)

for coordinate in ["x", "y", "z"]:
    print(f"\n{coordinate.upper()}:")
    print(f"  Minimum: {data[coordinate].min():,.2f}")
    print(f"  Maximum: {data[coordinate].max():,.2f}")
    print(f"  Mean:    {data[coordinate].mean():,.2f}")


# ---------------------------------------------------------
# Coordinate ranges by map
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("COORDINATE RANGES BY MAP")
print("=" * 70)

for map_name, group in data.groupby("map_id"):

    print(f"\n{map_name}")

    for coordinate in ["x", "z"]:
        print(
            f"  {coordinate}: "
            f"{group[coordinate].min():.2f} "
            f"→ "
            f"{group[coordinate].max():.2f}"
        )


# ---------------------------------------------------------
# Event counts by map
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("EVENTS BY MAP")
print("=" * 70)

events_by_map = (
    data.groupby(["map_id", "event"])
    .size()
    .unstack(fill_value=0)
)

print(events_by_map.to_string())


# ---------------------------------------------------------
# Kill / death statistics
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("COMBAT EVENTS")
print("=" * 70)

combat_events = [
    "Kill",
    "Killed",
    "BotKill",
    "BotKilled",
    "KilledByStorm",
]

for event in combat_events:
    count = int((data["event"] == event).sum())
    print(f"{event:20} {count:>8,}")


# ---------------------------------------------------------
# Loot statistics
# ---------------------------------------------------------

loot_count = int((data["event"] == "Loot").sum())

print("\n" + "=" * 70)
print("LOOT")
print("=" * 70)

print(f"Total loot events: {loot_count:,}")


# ---------------------------------------------------------
# Position statistics
# ---------------------------------------------------------

position_events = data[
    data["event"].isin(["Position", "BotPosition"])
]

print("\n" + "=" * 70)
print("POSITION EVENTS")
print("=" * 70)

print(f"Position events: {len(position_events):,}")

if len(data) > 0:
    print(
        f"Percentage of all events: "
        f"{len(position_events) / len(data) * 100:.2f}%"
    )


# ---------------------------------------------------------
# Failed files
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("FILE READ ERRORS")
print("=" * 70)

if failed_files:
    print(f"Failed files: {len(failed_files)}")

    for filepath, error in failed_files[:20]:
        print(f"\n{filepath}")
        print(f"  {error}")

else:
    print("No file read errors.")


# ---------------------------------------------------------
# DataFrame schema
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("DATA TYPES")
print("=" * 70)

print(data.dtypes.to_string())


# ---------------------------------------------------------
# Final
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("ANALYSIS COMPLETE")
print("=" * 70)