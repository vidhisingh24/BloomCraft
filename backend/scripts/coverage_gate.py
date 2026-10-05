"""Per-package coverage floors (PLAN §3.2).

Usage: uv run python scripts/coverage_gate.py var/coverage.json

Overall >= 85 %. Security-critical packages >= 90 %, each enforced only once the package has
measured statements.
"""

import json
import sys
from dataclasses import dataclass
from pathlib import Path

OVERALL_FLOOR = 85.0
PACKAGE_FLOORS: dict[str, float] = {
    "app/auth": 90.0,
    "app/authz": 90.0,
    "app/crypto": 90.0,
    "app/modules/checkout": 90.0,
    "app/modules/orders": 90.0,
}


@dataclass
class Totals:
    statements: int = 0
    covered_lines: int = 0
    branches: int = 0
    covered_branches: int = 0

    def add(self, summary: dict[str, int]) -> None:
        self.statements += summary.get("num_statements", 0)
        self.covered_lines += summary.get("covered_lines", 0)
        self.branches += summary.get("num_branches", 0)
        self.covered_branches += summary.get("covered_branches", 0)

    @property
    def percent(self) -> float:
        total = self.statements + self.branches
        return 100.0 if total == 0 else 100.0 * (self.covered_lines + self.covered_branches) / total


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("usage: coverage_gate.py <coverage.json>")
        return 2
    report = json.loads(Path(argv[1]).read_text(encoding="utf-8"))
    packages = {name: Totals() for name in PACKAGE_FLOORS}
    for filename, data in report["files"].items():
        path = filename.replace("\\", "/")
        for name, totals in packages.items():
            if path.startswith(name + "/"):
                totals.add(data["summary"])

    overall = float(report["totals"]["percent_covered"])
    rows: list[tuple[str, str, str, str]] = [
        (
            "overall",
            f"{overall:.2f}",
            f"{OVERALL_FLOOR:.0f}",
            "PASS" if overall >= OVERALL_FLOOR else "FAIL",
        )
    ]
    failed = overall < OVERALL_FLOOR
    for name, totals in packages.items():
        floor = PACKAGE_FLOORS[name]
        if totals.statements == 0:
            rows.append((name, "-", f"{floor:.0f}", "SKIP (no code yet)"))
            continue
        ok = totals.percent >= floor
        failed |= not ok
        rows.append((name, f"{totals.percent:.2f}", f"{floor:.0f}", "PASS" if ok else "FAIL"))

    width = max(len(r[0]) for r in rows)
    print(f"{'package'.ljust(width)}  covered%  floor%  result")
    for package, covered, floor_text, result in rows:
        print(f"{package.ljust(width)}  {covered:>8}  {floor_text:>6}  {result}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
