#!/usr/bin/env python3
"""
Integrates BetaWarningBanner into DAWPlayer.tsx
Handles CRLF line endings properly
"""

# Read file as binary to preserve line endings
with open('/features/player/components/DAWPlayer.tsx', 'rb') as f:
    content = f.read()

# Decode
text = content.decode('utf-8')

# === CHANGE 1: Add import ===
import_search = "import { TransportHeader } from './player/TransportHeader';\r\n"
import_replacement = "import { TransportHeader } from './player/TransportHeader';\r\nimport { BetaWarningBanner } from './BetaWarningBanner';\r\n"

if import_search in text:
    text = text.replace(import_search, import_replacement, 1)  # Replace only first occurrence
    print("✅ Step 1: Import added after line 48")
else:
    print("❌ Step 1 FAILED: Could not find import line")
    print("Searching for:", repr(import_search))

# === CHANGE 2: Add component ===
component_search = "          />\r\n\r\n          {/* Main Content Area */}"
component_replacement = "          />\r\n\r\n          <BetaWarningBanner />\r\n\r\n          {/* Main Content Area */}"

if component_search in text:
    # Count occurrences to make sure we're replacing the right one
    count = text.count(component_search)
    print(f"Found {count} occurrence(s) of component marker")
    
    # Replace first occurrence (should be the TransportHeader closing)
    text = text.replace(component_search, component_replacement, 1)
    print("✅ Step 2: Component added after line 1018")
else:
    print("❌ Step 2 FAILED: Could not find component marker")
    print("Searching for:", repr(component_search))

# Write back preserving encoding
with open('/features/player/components/DAWPlayer.tsx', 'wb') as f:
    f.write(text.encode('utf-8'))

print("\n" + "="*60)
print("🎉 INTEGRATION COMPLETE!")
print("="*60)
print("\nChanges made to: /features/player/components/DAWPlayer.tsx")
print("1. Added import at line 49")
print("2. Added <BetaWarningBanner /> after line 1018")
print("\nThe beta warning banner is now integrated!")
