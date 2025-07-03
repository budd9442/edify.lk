# edify-backend

This project contains the backend for Edify, powered by Strapi and PostgreSQL using Docker Compose.

## Folder Structure

```
edify-backend/
├── docker-compose.yml        # Docker config
├── .env                      # Secrets and DB credentials
├── .gitignore                # Ignore .env, node_modules, etc.
├── strapi-app/               # Auto-generated Strapi app code
│   ├── config/               # Environment config
│   ├── src/                  # Custom plugins, APIs, content types
│   └── ...
└── README.md                 # Project overview
```

## Usage

1. Copy `.env` and fill in your secrets.
2. Run `docker-compose up` to start the backend.
3. Strapi will be available at [http://localhost:1337](http://localhost:1337).
