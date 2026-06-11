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
