#!/usr/bin/env python3
"""Apply the 3 color fixes to DAWPlayer.tsx"""

file_path = 'features/player/components/DAWPlayer.tsx'

# Read file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Count before
before_count = content.count("backgroundColor: '#404040'")
print(f"Found {before_count} occurrences of backgroundColor: '#404040'")

# Replace
content = content.replace("backgroundColor: '#404040'", "backgroundColor: 'var(--daw-control)'")

# Count after
after_count = content.count("backgroundColor: 'var(--daw-control)'")

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"✅ Done! Replaced {before_count} occurrences")
print(f"Total instances of 'var(--daw-control)': {after_count}")
