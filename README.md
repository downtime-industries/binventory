# Binventory

![Binventory Logo](https://raw.githubusercontent.com/downtime-inventory/binventory/main/docs/BinventoryIcon.png)

A simple inventory management system built with FastAPI and SQLite, designed for easy deployment using Docker.

> [!WARNING] 
> This entire project has been "vibe coded" and provides no gurantees of backward or forward compatibility. 

[Binventory Homage](https://raw.githubusercontent.com/downtime-inventory/binventory/main/docs/BinventoryHomePage.png)

## Features

- Inventory item tracking with name, description, location, and quantity
- Search functionality
- Dark mode support
- URL linking for items
- Mobile-friendly responsive design
- Container inventory pages

[Binventory Container Tracking Page](https://raw.githubusercontent.com/downtime-inventory/binventory/main/docs/BinventoryContainersPage.png)

## Deployment with Docker

### Prerequisites

- Docker
- Docker Compose

### Quick Start

1. Clone this repository:
   ```
   git clone <repository-url>
   cd binventory
   ```

2. Deploy with Docker Compose:
   ```
   docker-compose up -d
   ```

3. Access the application at `http://<your-server-ip>:8000`

### Data Persistence

The application data is stored in a SQLite database that is persisted using a Docker volume named `binventory-data`. This ensures your inventory data persists across container restarts and updates.

### Updating the Application

To update the application:

1. Pull the latest code:
   ```
   git pull
   ```

2. Rebuild and restart the containers:
   ```
   docker-compose down
   docker-compose up -d --build
   ```

### Customization

- To change the port the application listens on, modify the `ports` section in the `docker-compose.yml` file.
- To set a different timezone, modify the `TZ` environment variable in the `docker-compose.yml` file.

## Backup and Restore

### Creating a Backup

To backup your inventory database:

```bash
docker exec binventory sqlite3 /app/data/inventory.db ".backup '/app/data/inventory_backup.db'"
docker cp binventory:/app/data/inventory_backup.db ./inventory_backup.db
```

### Restoring from a Backup

To restore from a backup:

```bash
docker cp inventory_backup.db binventory:/app/data/
docker exec binventory sqlite3 /app/data/inventory.db ".restore '/app/data/inventory_backup.db'"
docker-compose restart binventory
```