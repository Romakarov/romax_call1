#!/bin/bash

# Compile TypeScript backend
npx tsc -p tsconfig.server.json --outDir dist_backend

# Run the compiled backend
node dist_backend/server.js
