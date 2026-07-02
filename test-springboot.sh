#!/bin/bash
echo "Testing SpringBoot Enricher Phase 1 MVP..."
npm run compile && npm test -- --grep "Phase 1 MVP" 2>&1 | grep -E "passing|failing|✔"
