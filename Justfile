# Justfile for appliance-errors.com

# Seed the database + start dev server
dev:
    npm run seed
    npm run dev

# Generate error codes JSON + stamp verified dates for new codes
seed:
    cd ../data-seed && cargo run --release -- --out ../appliance-site/src/data/error-codes.json
    node ../scripts/update-verified-dates.mjs

# Build static site
build:
    npm run seed
    npm run build

# Preview the built site
preview:
    npm run preview

# Deploy to Cloudflare Pages
deploy:
    npm run build
    npx wrangler pages deploy ./dist --project-name appliance-errors

# Count total error codes
count:
    cat src/data/error-codes.json | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log('Codes:', d.error_codes.length, '| Brands:', d.brands.length)"

# Install dependencies
install:
    npm install

# Type check
check:
    npx tsc --noEmit

# Measure content uniqueness (thin-page audit)
measure:
    node scripts/content-uniqueness.mjs

# CI gate — fail if thin-page count regresses
measure-ci:
    node scripts/content-uniqueness.mjs --json > /tmp/uniqueness.json
    node -e "const r=require('/tmp/uniqueness.json');const fail=r.thresholds.lt120>70;console.log('lt120:'+r.thresholds.lt120+' lt180:'+r.thresholds.lt180+' lt280:'+r.thresholds.lt280+' models_present:'+r.modelsAffected.present);if(fail){console.error('FAIL: too many thin pages');process.exit(1);}else{console.log('PASS');}"
