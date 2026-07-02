#!/bin/bash
# Truncate springboot.test.ts to line 933
head -n 933 src/test/unit/enrichment/springboot/springboot.test.ts > /tmp/springboot_truncated.ts
mv /tmp/springboot_truncated.ts src/test/unit/enrichment/springboot/springboot.test.ts
echo "File truncated to 933 lines"
