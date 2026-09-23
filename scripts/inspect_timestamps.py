from pathlib import Path

import pyarrow.parquet as pq


DATA_DIR = Path("player_data")


files = [
    path
    for path in DATA_DIR.rglob("*")
    if path.is_file() and ".nakama-0" in path.name
]

print(f"Gameplay files: {len(files)}")

# Inspect the first few files
for filepath in files[:10]:

    table = pq.read_table(filepath)
    df = table.to_pandas()

    print("\n" + "=" * 80)
    print(filepath.name)
    print("=" * 80)

    print("Columns:")
    print(df.columns.tolist())

    print("\nTimestamp dtype:")
    print(df["ts"].dtype)

    print("\nFirst timestamps:")
    print(df["ts"].head(10).to_string(index=False))

    print("\nLast timestamps:")
    print(df["ts"].tail(10).to_string(index=False))

    print("\nTimestamp differences:")
    print(
        df["ts"]
        .sort_values()
        .diff()
        .dropna()
        .describe()
    )