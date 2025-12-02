#!/usr/bin/env python3
import sys

# Read file preserving line endings
with open('/features/player/components/DAWPlayer.tsx', 'rb') as f:
    content = f.read()

# Decode as UTF-8
text = content.decode('utf-8')

# CHANGE 1: Add import after TransportHeader
import_line = "import { TransportHeader } from './player/TransportHeader';"
if import_line in text:
    text = text.replace(
        import_line,
        import_line + "\r\nimport { BetaWarningBanner } from './BetaWarningBanner';"
    )
    print("✅ Import added")
else:
    print("❌ Import line not found")
    sys.exit(1)

# CHANGE 2: Add component after TransportHeader closing
marker = "          />\r\n\r\n          {/* Main Content Area */}"
if marker in text:
    text = text.replace(
        marker,
        "          />\r\n\r\n          <BetaWarningBanner />\r\n\r\n          {/* Main Content Area */}"
    )
    print("✅ Component added")
else:
    print("❌ Component marker not found")
    # Try with just \n
    marker2 = "          />\n\n          {/* Main Content Area */}"
    if marker2 in text:
        text = text.replace(
            marker2,
            "          />\n\n          <BetaWarningBanner />\n\n          {/* Main Content Area */}"
        )
        print("✅ Component added (LF version)")
    else:
        print("❌ Neither marker found")
        sys.exit(1)

# Write back with original line endings preserved  
with open('/features/player/components/DAWPlayer.tsx', 'wb') as f:
    f.write(text.encode('utf-8'))

print("\n🎉 Integration successful!")
print("File: /features/player/components/DAWPlayer.tsx")
