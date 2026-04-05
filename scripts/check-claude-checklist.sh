#!/usr/bin/env bash
# Pre-commit checklist enforcement.
# Blocks commits if any checklist item in .claude/pre-commit-checklist.md is unchecked.

CHECKLIST=".claude/pre-commit-checklist.md"

if [ ! -f "$CHECKLIST" ]; then
  echo "ERROR: Checklist file not found at $CHECKLIST"
  echo "Create it with all items checked before committing."
  exit 1
fi

# Find unchecked items (lines with "- [ ]")
unchecked=$(grep -n '\- \[ \]' "$CHECKLIST" || true)

if [ -n "$unchecked" ]; then
  echo ""
  echo "=========================================="
  echo "  COMMIT BLOCKED — Checklist incomplete"
  echo "=========================================="
  echo ""
  echo "These items are not checked off:"
  echo ""
  echo "$unchecked" | while IFS= read -r line; do
    echo "  $line"
  done
  echo ""
  echo "Update $CHECKLIST and check all items before committing."
  echo "=========================================="
  echo ""
  exit 1
fi

echo "Checklist: all items checked."
