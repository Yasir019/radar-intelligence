import difflib

from app.schemas import DiffLine


def structured_diff(old_text: str, new_text: str, context: int = 3) -> list[DiffLine]:
    """Unified diff rendered as structured lines for the UI."""
    lines: list[DiffLine] = []
    diff = difflib.unified_diff(
        old_text.splitlines(),
        new_text.splitlines(),
        lineterm="",
        n=context,
    )
    for raw in diff:
        if raw.startswith("---") or raw.startswith("+++"):
            continue
        if raw.startswith("@@"):
            lines.append(DiffLine(type="hunk", text=raw))
        elif raw.startswith("+"):
            lines.append(DiffLine(type="add", text=raw[1:]))
        elif raw.startswith("-"):
            lines.append(DiffLine(type="del", text=raw[1:]))
        else:
            lines.append(DiffLine(type="ctx", text=raw[1:] if raw.startswith(" ") else raw))
    return lines


def changed_excerpt(old_text: str, new_text: str, context: int = 2, max_chars: int = 8000) -> tuple[str, str]:
    """Extract only the changed regions (with a little context) from both texts,
    so AI prompts stay small and focused."""
    old_lines = old_text.splitlines()
    new_lines = new_text.splitlines()
    matcher = difflib.SequenceMatcher(None, old_lines, new_lines, autojunk=False)

    old_parts: list[str] = []
    new_parts: list[str] = []
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            continue
        old_start = max(0, i1 - context)
        old_end = min(len(old_lines), i2 + context)
        new_start = max(0, j1 - context)
        new_end = min(len(new_lines), j2 + context)
        if old_end > old_start:
            old_parts.append("\n".join(old_lines[old_start:old_end]))
        if new_end > new_start:
            new_parts.append("\n".join(new_lines[new_start:new_end]))

    old_excerpt = "\n[...]\n".join(old_parts)[:max_chars]
    new_excerpt = "\n[...]\n".join(new_parts)[:max_chars]
    return old_excerpt or "(no removed content)", new_excerpt or "(no added content)"
