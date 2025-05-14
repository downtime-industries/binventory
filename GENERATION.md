Binventory Overall Design
========================
The Binventory application is a web-based inventory management system that allows users to manage items, areas, containers, bins, and tags. The application is designed to be user-friendly and responsive, with a focus on providing a seamless experience for users.

## Running with Docker (Single Container)

The application can be run as a single Docker container that includes both the FastAPI backend and the compiled React frontend. This approach simplifies deployment and ensures that the application runs consistently across different environments.

### Prerequisites
- Docker and Docker Compose installed on your system

### Running the Application

1. Build and run the container with the provided script:
   ```
   ./build_and_run.sh
   ```

   Or manually:
   ```
   docker-compose build
   docker-compose up
   ```

2. Access the application in your browser:
   ```
   http://localhost:8000
   ```

## Development Setup

If you prefer to run the application in development mode, with separate frontend and backend servers, follow these instructions:

We should use tailwind CSS for styling the application. Tailwind CSS is a utility-first CSS framework that allows us to create custom designs without writing custom CSS. This will help us maintain a consistent design throughout the application and make it easier to update the design in the future.

Interactions should be smooth and responsive. For example if an item is deleted while viewing the item in a search view then it should be immediately removed. 

Each page, view, and modal should support a dark mode. The dark mode should be a toggle that allows users to switch between light and dark modes. The dark mode should be applied to all pages, views, and modals. The dark mode should also be applied to the search bar and the item detail view. 

Where it makes sense we should use individual react components for each element. This will help us maintain a consistent design throughout the application and make it easier to update the design in the future. The components should be reusable and should be able to be used in multiple places throughout the application.

The backend will be fastapi and a sqlite database. The fastapi backend will be responsible for handling all requests to the database and returning the data to the frontend. 

For authentication users should be able to login using GitHub OAuth. This will allow users to login using their GitHub account and will also allow us to use GitHub as the authentication provider. The authentication should be handled by fastapi and should be secure. It preferred to use an external library for this.

Binventory Views
========================

## Homepage

The homepage renders the item list. It's an arbitrary list of items, with the ability to filter by area, container, bin, and tags. The homepage also has a search bar that allows users to search for items by name or description. The homepage includes a button to add a new item. Finally, the homepage includes a button to view the item detail view for a selected item. 

When typing in search for an item the search should autocomplete with a list of items by name, container, area, bin, and tags. Pressing tab should select the currently highlighted item. Using the down arrow key should highlight the next item in the list. Using the up arrow key should highlight the previous item in the list. Pressing enter should submit the search.

## Item Detail Modal
The item detail view is a modal view of the item. Clicking into the item detail view will pop up a modal with the item details. This view should support being linked directly to such that following the link will open the modal. The item detail view should include a button to edit the item, a button to delete the item, and a button to add a tag. 

The item detail view should contain the following. At the top a set of pills representing the area, container, and bin. These pills should be clickable and should link to the corresponding detail views. The item view should have all the details of the item. This should include the name, description, area, container, bin, quantity, cost, and URL. The item detail view should also include a list of tags in a separate section below the details for the tags associated with the item. Each tag should be clickable and should link to the tag detail view.

## Tag Page
The tag detail is a full page view of a tag. There should be a section that shows It should contain a section of that shows up to the first 9 areas/containers/bins that are associated with the tag. This should be a list of pills that link to the corresponding detail views. The tag detail view should also include a list of items associated with the tag. Each item should be clickable and should link to the item detail view. The tag detail view should also include a button to add a new item.

## Area/Container/Bin Page
This view is a full page view of the respective area/container/bin. The first section on the page should show the view you are in (eg. Area: <area_name>), along with the path below it (Home/<area_name>). The next section should contain a total number of items, total quantity, and number of unique sub-containers/bins that are clickable to view their respective page.

It should contain a section of that shows up to the first 6 areas/containers/bins that are associated with the area/container/bin. This should be a list of pills that link to the corresponding detail views. If there are more than 6 this should include a button to view all.

The area/container/bin detail view should also include a list of items associated with the area/container/bin. Each item should be clickable and should link to the item detail view. The area/container/bin detail view should also include a button to add a new item. This should utilize the item list view.

Binventory API
========================
The Binventory API is a RESTful API that allows users to interact with the Binventory application. The API is built using FastAPI and is designed to be easy to use and understand. The API is organized into several endpoints that correspond to the different views in the application.

The API is designed to be secure and will require authentication for all endpoints. The API will use GitHub OAuth for authentication and will require users to login using their GitHub account. 

The only special requirements for the api is that it should try to maintain a reasonable number of endpoints. Eventually, this will be used by an MCP server so keep that in mind. Additionally, we will eventually want to extend the API service with endpoints that will not be shipped in the open source version. This should be done in a way that is easy to extend and maintain.

Binventory Data Model
========================

items (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    area TEXT,
    container TEXT,
    bin TEXT,
    quantity INTEGER DEFAULT 1,
    cost REAL DEFAULT 0.0,
    url TEXT
);

items_fts USING fts5 (
    name, 
    description,
    area,
    container, 
    bin,
    content='items', 
    content_rowid='id',
    tokenize='porter'
);

items_tags (
    id INTEGER PRIMARY KEY,
    item_id INTEGER NOT NULL,
    tag TEXT NOT NULL,
    FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
);

items_tags_fts USING fts5 (
    tag,
    content='items_tags',
    content_rowid='id',
    tokenize='porter'
);