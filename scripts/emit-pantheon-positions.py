"""Project the pinned Pantheon+ release into the four public fields used by the atlas."""
import csv
import hashlib
import json
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1]).read_bytes()
summary = json.loads((root / "data/source/pantheon-sky-summary.json").read_text())
if hashlib.sha256(source).hexdigest() != summary["sha256"]:
    raise ValueError("Input differs from the release pinned by the sky map")
lines = iter(source.decode().splitlines())
fields = next(lines).split()
objects = {}
bins = [0] * len(summary["redshiftCounts"])
for line in lines:
    row = dict(zip(fields, line.split(), strict=True))
    if row["CID"] not in objects:
        objects[row["CID"]] = [row[key] for key in ("CID", "RA", "DEC", "zCMB")]
        bins[int(float(row["zCMB"]) / summary["redshiftBinWidth"])] += 1
if len(objects) != summary["uniqueCID"] or bins != summary["redshiftCounts"]:
    raise ValueError("Catalogue selection differs from the public atlas")
with (root / "public/pantheon-positions.csv").open("w", newline="") as output:
    writer = csv.writer(output, lineterminator="\n")
    writer.writerow(["CID", "RA_deg", "DEC_deg", "zCMB"])
    writer.writerows(objects.values())
