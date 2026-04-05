#!/usr/bin/env bash
# Resets the pre-commit checklist after a successful commit.
# All items go back to unchecked so the checklist is fresh for next time.

CHECKLIST=".claude/pre-commit-checklist.md"

if [ ! -f "$CHECKLIST" ]; then
  exit 0
fi

# Replace all checked items with unchecked
sed -i 's/- \[x\]/- [ ]/g' "$CHECKLIST"

echo "Checklist reset for next commit."
