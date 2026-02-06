#!/bin/bash
# Script to analyze heavy dependencies in the codebase

echo "🔍 Analyzing Heavy Dependencies Usage..."
echo "=========================================="
echo ""

# Check date-fns usage
echo "📅 date-fns usage:"
echo "  Count: $(grep -r "from 'date-fns'" app/ components/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | xargs)"
if [ $(grep -r "from 'date-fns'" app/ components/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | xargs) -gt 0 ]; then
  echo "  Files:"
  grep -r "from 'date-fns'" app/ components/ --include="*.ts" --include="*.tsx" 2>/dev/null | cut -d':' -f1 | sort -u | sed 's/^/    - /'
fi
echo ""

# Check dayjs usage
echo "📅 dayjs usage:"
echo "  Count: $(grep -r "from 'dayjs'" app/ components/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | xargs)"
if [ $(grep -r "from 'dayjs'" app/ components/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | xargs) -gt 0 ]; then
  echo "  Files:"
  grep -r "from 'dayjs'" app/ components/ --include="*.ts" --include="*.tsx" 2>/dev/null | cut -d':' -f1 | sort -u | sed 's/^/    - /'
fi
echo ""

# Check leaflet usage
echo "🗺️  react-leaflet usage:"
echo "  Count: $(grep -r "from 'react-leaflet\|from 'leaflet" app/ components/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | xargs)"
if [ $(grep -r "from 'react-leaflet\|from 'leaflet" app/ components/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | xargs) -gt 0 ]; then
  echo "  Files:"
  grep -r "from 'react-leaflet\|from 'leaflet" app/ components/ --include="*.ts" --include="*.tsx" 2>/dev/null | cut -d':' -f1 | sort -u | sed 's/^/    - /'
fi
echo ""

# Check faker usage
echo "🎭 @faker-js/faker usage:"
echo "  Count: $(grep -r "from '@faker-js/faker'" app/ components/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | xargs)"
if [ $(grep -r "from '@faker-js/faker'" app/ components/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | xargs) -gt 0 ]; then
  echo "  Files:"
  grep -r "from '@faker-js/faker'" app/ components/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null | cut -d':' -f1 | sort -u | sed 's/^/    - /'
fi
echo ""

# Check pdf-parse usage
echo "📄 pdf-parse usage:"
echo "  Count: $(grep -r "pdf-parse" app/ components/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | xargs)"
if [ $(grep -r "pdf-parse" app/ components/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | xargs) -gt 0 ]; then
  echo "  Files:"
  grep -r "pdf-parse" app/ components/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null | cut -d':' -f1 | sort -u | sed 's/^/    - /'
fi
echo ""

# Check framer-motion usage
echo "🎬 framer-motion usage:"
echo "  Count: $(grep -r "from 'framer-motion'" app/ components/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | xargs)"
if [ $(grep -r "from 'framer-motion'" app/ components/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | xargs) -gt 0 ]; then
  echo "  Top files using it:"
  grep -r "from 'framer-motion'" app/ components/ --include="*.ts" --include="*.tsx" 2>/dev/null | cut -d':' -f1 | sort | uniq -c | sort -rn | head -10 | sed 's/^/    /'
fi
echo ""

# Check CSV parsers
echo "📊 CSV parsers usage:"
echo "  csv-parse: $(grep -r "from 'csv-parse'" app/ components/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | xargs)"
echo "  csv-parser: $(grep -r "from 'csv-parser'" app/ components/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | xargs)"
echo ""

# Check client components count
echo "🖥️  Client Components ('use client'):"
echo "  Count: $(grep -r "^'use client'" app/ components/ --include="*.tsx" 2>/dev/null | wc -l | xargs)"
echo ""

echo "✅ Analysis complete!"
echo ""
echo "💡 To run bundle analyzer: npm run build:analyze"
