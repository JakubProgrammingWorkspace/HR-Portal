# HR-Portal

A Polish HR management application (Users & flexible Roles, Companies, Employees, an
occupational exposure factors catalogue, and standardized medical examination referrals
with PDF generation), built with a Symfony 6 + API Platform backend (PHP 8.5, thick
services / thin controllers) and a React + Tailwind CSS frontend.

## Stack

- **php** - PHP 8.5-FPM running the Symfony 6 backend (`backend/`)
- **nginx** - serves the backend on `http://localhost:8000`
- **postgres** - PostgreSQL 16 database
- **node** - Vite dev server for the React frontend (`frontend/`), on `http://localhost:5173`

## Getting started

1. Copy the example environment file and adjust values if needed:

   ```bash
   cp .env.example .env
   ```

2. Start the stack:

   ```bash
   docker compose up -d
   ```

   - Backend API: http://localhost:8000
   - Frontend dev server: http://localhost:5173

3. Install backend dependencies and run database migrations:

   ```bash
   docker compose exec php composer install
   docker compose exec php bin/console doctrine:database:create --if-not-exists
   docker compose exec php bin/console doctrine:migrations:migrate --no-interaction
   ```

4. Load fixtures (seed roles, default admin user, exposure factors catalogue, etc.):

   ```bash
   docker compose exec php bin/console doctrine:fixtures:load --no-interaction
   ```

5. Stop the stack:

   ```bash
   docker compose down
   ```

## Default admin account

After loading fixtures, log in with:

- **Email:** `admin@hr-portal.local`
- **Password:** `admin123`

(see `backend/src/DataFixtures` once US-005 is implemented)

## Validating the Docker setup

```bash
docker compose config   # validate the compose file
docker compose up        # start all services
```
