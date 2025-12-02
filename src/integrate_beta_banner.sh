#!/bin/bash

# Backup original
cp /features/player/components/DAWPlayer.tsx /features/player/components/DAWPlayer.tsx.backup

# Add import after line 48 (TransportHeader import)
sed -i '48 a import { BetaWarningBanner } from '\''./BetaWarningBanner'\'';' /features/player/components/DAWPlayer.tsx

# Add component after line 1018 (the closing /> of TransportHeader)
# First, find the exact line number that contains the closing />
LINE_NUM=$(grep -n "onToolChange={handleToolChange}" /features/player/components/DAWPlayer.tsx | head -1 | cut -d: -f1)

# Add 2 lines after that (skip the /> line)
sed -i "$((LINE_NUM + 2)) a\\
\\
          <BetaWarningBanner />" /features/player/components/DAWPlayer.tsx

echo "✅ Integration complete!"
echo "Import added after line 48"
echo "Component added after TransportHeader"
