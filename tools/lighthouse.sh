#!/usr/bin/env sh
# Usage: sh tools/lighthouse.sh <url> <outPrefix> [runs]
# Lighthouse 13 mobile (simulated Slow 4G + 4x CPU), then a one-line summary per run.
URL=$1; OUT=$2; RUNS=${3:-3}
for i in $(seq 1 "$RUNS"); do
  npx -y lighthouse@13.6.0 "$URL" --quiet --chrome-flags="--headless=new" \
    --only-categories=performance,accessibility,best-practices,seo \
    --output=json --output-path="$OUT-$i.json" >/dev/null 2>&1
done
node -e '
const fs=require("fs"),[out,n]=process.argv.slice(1);
for(let i=1;i<=+n;i++){const r=JSON.parse(fs.readFileSync(`${out}-${i}.json`)),a=r.audits,c=r.categories;
console.log(i,JSON.stringify({perf:Math.round(c.performance.score*100),a11y:Math.round(c.accessibility.score*100),bp:Math.round(c["best-practices"].score*100),seo:Math.round(c.seo.score*100),FCP:a["first-contentful-paint"].displayValue,LCP:a["largest-contentful-paint"].displayValue,CLS:a["cumulative-layout-shift"].displayValue,TBT:a["total-blocking-time"].displayValue,SI:a["speed-index"].displayValue,TTI:a.interactive?.displayValue}))}' "$OUT" "$RUNS"
