#!/bin/bash

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Start PostgreSQL container
echo "Starting PostgreSQL container..."
docker run --name biobonds-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=biobonds -p 5432:5432 -d postgres:14

# Wait for PostgreSQL to start
echo "Waiting for PostgreSQL to start..."
sleep 5

# Install dependencies
echo "Installing dependencies..."
npm install
npm install tsx

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate --schema=./server/prisma/schema.prisma

# Push schema to database
echo "Pushing schema to database..."
npx prisma db push --schema=./server/prisma/schema.prisma

# Seed the database with mock data
echo "Seeding database with mock data..."
npx tsx server/prisma/seed.ts

echo "Setup complete! You can now start the development server with 'npm run dev'"
