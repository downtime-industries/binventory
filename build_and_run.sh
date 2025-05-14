#!/bin/bash

echo "Building and running Binventory in a single container..."

# Build the container
docker-compose build

# Run the container
docker-compose up
