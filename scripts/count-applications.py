import re
from pathlib import Path

p = Path(r"C:\Users\Fares\.openclaw\workspace-job-search\applications_log.md")
text = p.read_text(encoding="utf-8", errors="ignore") if p.exists() else ""

def count(label: str) -> int:
    return len(re.findall(rf"\|\s*{re.escape(label)}\s*\|", text, flags=re.I))

print({
    "applied": count("applied"),
    "skipped": count("skipped"),
    "saved": count("saved"),
    "log_exists": p.exists(),
})
