#!/bin/bash
# Run Gateway Test — double-click this file in Finder to run
cd "$(dirname "$0")"
echo ""
echo "  Starting SOL REViBE Gateway Test..."
echo ""
~/.nvm/versions/node/v20.20.2/bin/node test-gateway.js
echo ""
echo "  Press any key to close..."
read -n 1
