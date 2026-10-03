#!/usr/bin/env python3

import runpy
import sys
from pathlib import Path


def normalize_predicate(predicate, epics):
    column, separator, values = predicate.partition(":")
    if not separator or column.strip().lower() != "epic":
        return predicate
    labels = {}
    for epic in epics:
        value = epic.get("value", "").strip()
        label = epic.get("label", "").strip() or value.replace("-", " ").replace("_", " ").title()
        if value:
            labels[value.lower()] = label
            labels[label.lower()] = label
    normalized = [labels.get(value.strip().lower(), value.strip()) for value in values.split(",")]
    return f"Epic:{','.join(normalized)}"


def main():
    try:
        update = runpy.run_path(str(Path(__file__).resolve().parents[1] / "update-tasks"))
        text = Path(sys.argv[1]).read_text(encoding="utf-8")
        epics = update["read_frontmatter"](text).get("epics", [])
        for predicate in sys.argv[2:]:
            print(normalize_predicate(predicate, epics))
    except (OSError, ValueError) as error:
        print(f"Error normalizing task filters: {error}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
