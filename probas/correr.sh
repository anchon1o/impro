#!/bin/bash
fail=0; total=0; casos=0
for f in probas/test_*.mjs probas/test_*.jsx; do
  out=$(node --import ./probas/dom.mjs --experimental-loader ./probas/loader.mjs "$f" 2>&1 | grep -v "ExperimentalWarning\|trace-warnings")
  n=$(echo "$out" | grep -c "^✓\|^✗")
  casos=$((casos+n)); total=$((total+1))
  if echo "$out" | grep -q "^✗\|Error\|error:"; then
    fail=$((fail+1)); echo "── ✗ $f"; echo "$out" | grep "^✗\|Error" | head -8
  else echo "✓ $f ($n)"; fi
done
echo "── $total ficheiros · $casos casos · $fail con fallos"
