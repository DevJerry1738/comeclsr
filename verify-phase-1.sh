#!/usr/bin/env bash
# ComeClsr Supabase Migration - Phase 1 Verification Script
# Run this to verify Phase 1 is properly set up

echo "🔍 Phase 1 Setup Verification"
echo "=============================="
echo ""

# Check Node.js
echo "✓ Checking Node.js version..."
node --version
if [ $? -ne 0 ]; then
  echo "  ✗ Node.js not found. Please install Node.js 20 LTS"
  exit 1
fi
echo ""

# Check npm
echo "✓ Checking npm version..."
npm --version
echo ""

# Check if node_modules exists
echo "✓ Checking dependencies..."
if [ ! -d "node_modules" ]; then
  echo "  ⚠️  node_modules not found. Running 'npm install'..."
  npm install
else
  echo "  ✓ node_modules found"
fi
echo ""

# Check TypeScript compilation
echo "✓ Checking TypeScript..."
npm run check
if [ $? -eq 0 ]; then
  echo "  ✓ TypeScript check passed"
else
  echo "  ✗ TypeScript errors found. Please fix before continuing."
  exit 1
fi
echo ""

# Check .env file
echo "✓ Checking environment setup..."
if [ -f ".env" ]; then
  echo "  ✓ .env file found"
  # Check if it has Supabase values
  if grep -q "SUPABASE_URL" .env; then
    echo "  ✓ Supabase variables detected"
  else
    echo "  ⚠️  Supabase variables not set. Copy from .env.example and update with your values."
  fi
else
  echo "  ⚠️  .env file not found. Creating from template..."
  cp .env.example .env
  echo "  ⚠️  Please update .env with your Supabase credentials"
fi
echo ""

# Check Supabase files
echo "✓ Checking Supabase setup..."
if [ -d "supabase/migrations" ]; then
  echo "  ✓ supabase/migrations directory found"
  if [ -f "supabase/migrations/20260504_initial_schema.sql" ]; then
    echo "  ✓ Database schema migration found"
  fi
fi

if [ -f "supabase/config.toml" ]; then
  echo "  ✓ supabase/config.toml found"
fi

if [ -f "src/lib/supabase.ts" ]; then
  echo "  ✓ src/lib/supabase.ts client found"
fi

if [ -f "src/providers/supabase.tsx" ]; then
  echo "  ✓ src/providers/supabase.tsx provider found"
fi

if [ -f "src/types/supabase.ts" ]; then
  echo "  ✓ src/types/supabase.ts types found"
fi
echo ""

# Summary
echo "=============================="
echo "✅ Phase 1 Verification Complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your Supabase credentials"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Review PHASE_1_SETUP.md for detailed information"
echo ""
echo "For Phase 2, you'll need to:"
echo "1. Create a Supabase project at https://supabase.com"
echo "2. Get your API credentials"
echo "3. Push the database schema"
echo ""
