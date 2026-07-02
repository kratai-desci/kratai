#!/usr/bin/env python3
import sys

file_path = 'src/test/unit/enrichment/springboot/springboot.test.ts'

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Keep only first 933 lines
lines_to_keep = lines[:933]

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines_to_keep)

print(f"✅ Truncated to {len(lines_to_keep)} lines")
print(f"Last 3 lines:")
for i, line in enumerate(lines_to_keep[-3:], start=len(lines_to_keep)-2):
    print(f"  {i}: {line.rstrip()}")
