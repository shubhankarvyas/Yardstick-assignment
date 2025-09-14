#!/bin/bash

# Production database setup script for Vercel deployment

echo "Setting up production database..."

# Generate Prisma client
npx prisma generate

# Apply database schema
npx prisma db push

# Seed the database with test accounts
npx prisma db seed

echo "Database setup complete!"