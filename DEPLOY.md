# Deploying to Cloudflare Pages with D1 Database

This guide walks through the process of deploying the Grow app to Cloudflare Pages with a D1 database.

## Prerequisites

1. A Cloudflare account
2. Cloudflare CLI (Wrangler) installed: `npm install -g wrangler`
3. Logged in to Wrangler: `wrangler login`

## Steps to Deploy

### 1. Create a D1 Database

```bash
# You've already created a D1 database called "selfdiscovery" manually
# Now you need to get its ID to use in the next step

# Run this command to list your D1 databases
wrangler d1 list

# This will output something like:
# ┌──────────────┬──────────────────────────────────────┐
# │ Name         │ UUID                                 │
# ├──────────────┼──────────────────────────────────────┤
# │ selfdiscovery │ 1234abcd-5678-efgh-9101-ijklmnopqrst │
# └──────────────┴──────────────────────────────────────┘
```

### 2. Update wrangler.toml with your database ID

Open `wrangler.toml` and add the database_id from the previous step:

```toml
[[d1_databases]]
binding = "DB"
database_name = "selfdiscovery"
database_id = "1234abcd-5678-efgh-9101-ijklmnopqrst" # Update with your DB ID
```

### 3. Create the database schema

```bash
# Create a schema file
cat > schema.sql << EOL
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mission_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
EOL

# Apply the schema to your D1 database
wrangler d1 execute selfdiscovery --file=schema.sql
```

### 4. Configure Cloudflare Pages deployment

```bash
# Create a new Cloudflare Pages project through the dashboard or using:
npx wrangler pages project create selfdiscovery

# Add your D1 database binding to the Pages project
npx wrangler pages deployment list selfdiscovery
# Find your latest deployment ID

# Add the binding (replace DEPLOYMENT_ID with your actual deployment ID)
npx wrangler pages deployment environment-variable set DEPLOYMENT_ID DB d1:selfdiscovery
```

### 5. Deploy your application

```bash
# Build the application for production
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy .output/public --project-name=selfdiscovery
```

### 6. Configure Authentication

Make sure to add the following environment variables in the Cloudflare Pages dashboard:

- `NEXTAUTH_SECRET`: A random string for session encryption
- `NEXTAUTH_URL`: Your deployment URL (https://selfdiscovery.pages.dev)
- Any other auth provider credentials required

### Troubleshooting

- If you encounter issues with the D1 binding, check the Cloudflare Pages dashboard for error logs
- Make sure your environment variables are correctly set
- Verify that the D1 database is created and initialized with the schema

## Local Development with D1

For local development with D1:

```bash
# Start a local development server with D1 connection
wrangler pages dev .output/public --binding DB=<database_id>
```

This will use your remote D1 database during local development.