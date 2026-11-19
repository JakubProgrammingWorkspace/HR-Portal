# PRD: HR-Portal (Portal Kadrowy)

## 1. Introduction/Overview

HR-Portal is a web application for Polish companies to manage HR-related data required by Polish labor law (Kodeks pracy). It allows authenticated staff to manage company users and their roles, register employees and the companies they work for, maintain a catalogue of occupational exposure factors ("czynniki narażeń"), and generate standardized medical examination referrals ("skierowania na badania profilaktyczne") as downloadable PDFs that comply with the official Polish form layout.

The application is a single-page React app (Tailwind CSS) talking to a Symfony 6 + API Platform backend over a JSON REST API, all running in Docker containers on the host.

## 2. Goals

- Provide secure login for staff users, with an extensible role-based permission system.
- Let an Administrator manage Users and assign Roles to them.
- Let any logged-in user manage a shared catalogue of Companies and Employees (each Employee belongs to exactly one Company).
- Provide a maintainable catalogue of "Czynniki narażeń" (occupational exposure factors), grouped into the 5 fixed categories used on the official Polish medical referral form.
- Allow users to create a "Skierowanie na badania profilaktyczne" for an Employee, selecting relevant exposure factors, and generate a PDF that follows the official Polish form layout, stored on the server and downloadable from the referral list.
- Keep Symfony controllers thin; all business logic lives in Services, using API Platform for the API layer.

## 3. User Stories

### Faza 0 — Project setup

#### US-001: Docker Compose environment
**Description:** As a developer, I need a Docker Compose stack so the whole app (frontend, backend, database, PDF/build tooling) runs locally with one command.

**Acceptance Criteria:**
- [ ] `docker-compose.yml` defines services: `php` (PHP 8.5-FPM running Symfony 6), `nginx` (reverse proxy/web server for the API), `postgres` (PostgreSQL 16), `node` (for the React/Vite dev server)
- [ ] `docker compose up` starts all services without errors
- [ ] Symfony app responds on `http://localhost:8000` (or documented port) with a default page
- [ ] React dev server responds on `http://localhost:5173` (or documented port)
- [ ] `.env` / `.env.example` documents required environment variables (DB credentials, JWT secrets, app URL, CORS origin)
- [ ] README documents how to start the stack and run migrations/fixtures

#### US-002: Symfony 6 + API Platform skeleton
**Description:** As a developer, I need a Symfony 6 project with API Platform installed and configured so backend resources can be exposed as a REST API.

**Acceptance Criteria:**
- [ ] Symfony 6.4 project created under `backend/`, running on PHP 8.5
- [ ] `api-platform/core` installed and configured (JSON format as default, API docs available at `/api/docs`)
- [ ] CORS configured (via `nelmio/cors-bundle`) to allow requests from the frontend dev origin
- [ ] Doctrine ORM configured against the `postgres` service
- [ ] `composer install` and `bin/console doctrine:database:create` succeed inside the `php` container
- [ ] Basic health-check route (`/api/health`) returns `200 OK`

#### US-003: React + Tailwind skeleton
**Description:** As a developer, I need a React app with Tailwind and routing set up so feature panels can be built consistently.

**Acceptance Criteria:**
- [ ] React app created under `frontend/` using Vite + TypeScript
- [ ] Tailwind CSS configured and a sample page renders Tailwind-styled content
- [ ] React Router configured with placeholder routes: `/login`, `/dashboard`, `/users`, `/companies`, `/employees`, `/exposure-factors`, `/referrals`
- [ ] A shared layout component (sidebar nav + top bar) renders around authenticated routes
- [ ] Verify in browser using the playwright-cli skill: app loads at dev server URL and navigation links switch routes

### Faza 1 — Users, Roles & Authentication

#### US-004: User and Role entities + migration
**Description:** As a developer, I need `User` and `Role` entities with a many-to-many relationship so roles can be assigned flexibly and new roles added later without code changes.

**Acceptance Criteria:**
- [ ] `Role` entity: `id`, `code` (unique string, e.g. `ROLE_ADMIN`), `name` (display name in Polish, e.g. "Administrator"), `description` (nullable text)
- [ ] `User` entity implements `UserInterface`/`PasswordAuthenticatedUserInterface`: `id`, `email` (unique), `password` (hashed), `firstName`, `lastName`, `isActive` (bool, default true), `createdAt`
- [ ] Many-to-many join table `user_role` between `User` and `Role`
- [ ] `User::getRoles()` returns the `code` of each assigned `Role` plus `ROLE_USER` as a base role for every authenticated user
- [ ] Doctrine migration generated and runs successfully (`bin/console doctrine:migrations:migrate`)

#### US-005: Seed data for Roles and default Admin user
**Description:** As a developer, I need fixtures so the app has a working Admin account and base roles after first setup.

**Acceptance Criteria:**
- [ ] `doctrine/doctrine-fixtures-bundle` installed
- [ ] Fixture creates `Role` records: `ROLE_ADMIN` ("Administrator") and `ROLE_USER` ("Użytkownik")
- [ ] Fixture creates one Admin user (email/password documented in README, e.g. `admin@hr-portal.local`) assigned `ROLE_ADMIN`
- [ ] `bin/console doctrine:fixtures:load` runs without error and admin user can be found in the database with a properly hashed password

#### US-006: JWT authentication
**Description:** As a user, I want to log in with email/password and receive a token so I can make authenticated API requests.

**Acceptance Criteria:**
- [ ] `lexik/jwt-authentication-bundle` installed and configured with generated key pair
- [ ] `POST /api/login` accepts `{ "email": ..., "password": ... }` and returns a JWT on success, `401` on invalid credentials
- [ ] JWT payload includes user id, email, and roles
- [ ] Inactive users (`isActive = false`) cannot log in (custom `UserChecker` throws a clear error)
- [ ] All other `/api/*` routes (except `/api/login` and `/api/docs`) require a valid JWT (`401` if missing/invalid)
- [ ] Token TTL is configurable via `.env` (default 1 hour)

#### US-007: Authorization voters for flexible roles
**Description:** As a developer, I need a central place to enforce permissions so that future roles can be granted/denied access to specific panels without rewriting controllers.

**Acceptance Criteria:**
- [ ] A `UserManagementVoter` (or equivalent) restricts User/Role management endpoints to subjects with `ROLE_ADMIN`
- [ ] All other resources (Company, Employee, ExposureCategory, ExposureFactor, Referral) are accessible to any authenticated user (`IS_AUTHENTICATED_FULLY`) regardless of role
- [ ] Voter logic lives in a dedicated `Security/Voter` class, not inline in controllers
- [ ] Automated test (PHPUnit) verifies a non-admin user gets `403` from `/api/users` and `/api/roles` endpoints, while an admin gets `200`

#### US-008: Login page (frontend)
**Description:** As a user, I want a login form so I can access the portal.

**Acceptance Criteria:**
- [ ] `/login` page with email + password fields and submit button
- [ ] On success, JWT stored (e.g. in memory + httpOnly-safe storage strategy documented) and user redirected to `/dashboard`
- [ ] On failure, an inline error message is shown ("Nieprawidłowy e-mail lub hasło")
- [ ] Authenticated requests automatically attach the `Authorization: Bearer <token>` header
- [ ] Unauthenticated users visiting any protected route are redirected to `/login`
- [ ] A "Wyloguj" (logout) action clears the token and redirects to `/login`
- [ ] Verify in browser using the playwright-cli skill: log in with seeded admin credentials and reach the dashboard

#### US-009: User management API
**Description:** As an Admin, I want API endpoints to list, create, update, and deactivate Users and assign Roles to them.

**Acceptance Criteria:**
- [ ] API Platform resource for `User` exposes `GET /api/users` (list), `GET /api/users/{id}`, `POST /api/users`, `PATCH /api/users/{id}`, `DELETE /api/users/{id}` — all restricted to `ROLE_ADMIN` via the voter from US-007
- [ ] `POST /api/users` accepts `email`, `password`, `firstName`, `lastName`, `roles` (array of Role codes); password is hashed via a custom API Platform state processor (logic in a `UserService`, not the controller)
- [ ] `PATCH /api/users/{id}` allows updating `firstName`, `lastName`, `isActive`, and `roles`
- [ ] `DELETE /api/users/{id}` removes the user (or sets `isActive = false` — decide and document); an Admin cannot delete/deactivate their own account (validated in `UserService`)
- [ ] API Platform resource for `Role` exposes `GET /api/roles` (list) and `POST /api/roles` (create new role: `code`, `name`, `description`), restricted to `ROLE_ADMIN`
- [ ] The seeded `ROLE_ADMIN` role cannot be deleted (enforced in service layer)
- [ ] Output serialization excludes the `password` field

#### US-010: User management panel (frontend)
**Description:** As an Admin, I want a panel to view all users, add new ones, remove them, and manage their roles.

**Acceptance Criteria:**
- [ ] `/users` page (visible in nav only for users with `ROLE_ADMIN`) lists all users with email, name, roles, and active status
- [ ] "Add user" form/modal creates a user with email, password, first/last name, and a multi-select for roles
- [ ] Each row has a "Remove"/"Deactivate" action with a confirmation dialog before submitting
- [ ] Each row has a way to edit assigned roles (multi-select reflecting available `Role` records from `/api/roles`)
- [ ] Non-admin users attempting to navigate to `/users` directly are redirected away (e.g., to `/dashboard`)
- [ ] Verify in browser using the playwright-cli skill: as admin, create a new user, assign a role, then remove the user

### Faza 2 — Companies

#### US-011: Company entity + API
**Description:** As a developer, I need a `Company` entity and API so employees can be linked to a company.

**Acceptance Criteria:**
- [ ] `Company` entity: `id`, `name`, `nip` (string, validated as 10-digit Polish NIP), `street`, `city`, `postalCode`, `createdAt`
- [ ] API Platform resource exposes `GET /api/companies`, `GET /api/companies/{id}`, `POST /api/companies`, `PATCH /api/companies/{id}`, `DELETE /api/companies/{id}` for any authenticated user
- [ ] Validation constraints enforce required fields and NIP format (returns `422` with field-level errors on failure)
- [ ] `DELETE /api/companies/{id}` returns `409 Conflict` with a clear error message if the company has linked Employees (logic in `CompanyService`, not the controller)
- [ ] PHPUnit test covers the delete-with-employees conflict case

#### US-012: Company management panel (frontend)
**Description:** As a user, I want a panel to add, view, and remove Companies.

**Acceptance Criteria:**
- [ ] `/companies` page lists companies with name, NIP, address, and number of employees
- [ ] "Add company" form creates a company with name, NIP, street, city, postal code; client-side validation mirrors backend constraints
- [ ] "Remove" action shows confirmation; if the API returns `409` (company has employees), an error message is shown instead of removing the row
- [ ] Form and list show validation/error messages in Polish
- [ ] Verify in browser using the playwright-cli skill: add a company, see it in the list, attempt to remove an empty company successfully

### Faza 3 — Employees

#### US-013: Employee entity + API
**Description:** As a developer, I need an `Employee` entity and API so employee records can be managed and linked to a Company (and later, to Referrals).

**Acceptance Criteria:**
- [ ] `Employee` entity: `id`, `firstName`, `lastName`, `pesel` (string, validated as 11-digit Polish PESEL — required for generating referrals), `phone`, `email`, `address` (free text: street, city, postal code), `company` (ManyToOne to `Company`, required), `createdBy` (ManyToOne to `User`), `createdAt`
- [ ] API Platform resource exposes `GET /api/employees` (with pagination), `GET /api/employees/{id}`, `POST /api/employees`, `PATCH /api/employees/{id}`, `DELETE /api/employees/{id}` for any authenticated user
- [ ] `POST /api/employees` requires a valid `company` IRI; validation returns `422` if missing or referencing a non-existent company
- [ ] `createdBy` is set automatically from the authenticated user in the state processor, not accepted from client input
- [ ] API Platform `SearchFilter` enabled on `firstName`, `lastName`, and `company`

#### US-014: Employee management panel (frontend)
**Description:** As a user, I want a panel to add, view, and remove Employees, assigning each to a Company.

**Acceptance Criteria:**
- [ ] `/employees` page lists employees with name, phone, email, address, and company name; supports search by name and filter by company
- [ ] "Add employee" form includes all fields (Imię, Nazwisko, PESEL, Telefon, E-mail, Adres) and a Company dropdown populated from `/api/companies`
- [ ] Client-side validation for PESEL (11 digits) and email format, mirroring backend errors
- [ ] "Remove" action shows confirmation before calling `DELETE /api/employees/{id}`
- [ ] Verify in browser using the playwright-cli skill: add an employee linked to an existing company, see it in the list, then remove it

### Faza 4 — Czynniki narażeń (Occupational Exposure Factors)

#### US-015: ExposureCategory and ExposureFactor entities + fixtures
**Description:** As a developer, I need the 5 fixed exposure-factor categories from the official Polish medical referral form, each containing a seeded list of real factors, so users can select them when creating referrals.

**Acceptance Criteria:**
- [ ] `ExposureCategory` entity: `id`, `code` (e.g. `I`–`V`), `name` (Polish display name), `sortOrder`
- [ ] `ExposureFactor` entity: `id`, `name`, `category` (ManyToOne to `ExposureCategory`), `description` (nullable)
- [ ] Fixtures seed exactly these 5 categories, matching Annex 3 of *Rozporządzenie Ministra Zdrowia i Opieki Społecznej z dnia 30 maja 1996 r.*:
  - I. Czynniki fizyczne
  - II. Pyły
  - III. Czynniki chemiczne
  - IV. Czynniki biologiczne
  - V. Inne czynniki, w tym niebezpieczne
- [ ] Fixtures seed factors per category (examples below — at least these must be present):
  - **I. Czynniki fizyczne**: Hałas; Hałas ultradźwiękowy; Wibracja (drgania mechaniczne) ogólne; Wibracja (drgania mechaniczne) miejscowe; Mikroklimat gorący; Mikroklimat zimny; Promieniowanie optyczne (UV/IR/widzialne); Promieniowanie laserowe; Promieniowanie jonizujące; Pole elektromagnetyczne; Praca przy monitorach ekranowych powyżej 4 godzin dziennie
  - **II. Pyły**: Pyły zawierające azbest; Pyły zawierające wolną krzemionkę; Pyły drewna; Pyły rud metali; Pyły węgla; Pyły mączne; Pyły bawełny; Pyły zwierzęce i roślinne niesklasyfikowane
  - **III. Czynniki chemiczne**: Substancje o działaniu toksycznym; Substancje o działaniu drażniącym; Substancje o działaniu uczulającym (alergizującym); Substancje o działaniu rakotwórczym lub mutagennym; Substancje o działaniu szkodliwym na rozrodczość; Rozpuszczalniki organiczne; Metale i ich związki (ołów, rtęć, kadm, chrom, nikiel); Pestycydy; Tlenek węgla; Tlenki azotu
  - **IV. Czynniki biologiczne**: Wirusy; Bakterie; Grzyby (pleśnie); Pasożyty; Materiał biologiczny pochodzenia ludzkiego (krew, płyny ustrojowe); Mikroorganizmy w środowisku pracy rolniczej/leśnej; Kontakt ze zwierzętami
  - **V. Inne czynniki, w tym niebezpieczne**: Praca na wysokości; Obsługa maszyn i urządzeń w ruchu; Wymuszona pozycja ciała; Obciążenie statyczne układu mięśniowo-szkieletowego; Obciążenie dynamiczne (praca fizyczna ciężka); Praca w porze nocnej; Praca zmianowa; Obciążenie psychiczne związane z odpowiedzialnością/kontaktem z ludźmi; Praca przy urządzeniach pod napięciem; Praca w warunkach ograniczonej widoczności; Ryzyko poślizgnięcia, potknięcia, upadku
- [ ] `bin/console doctrine:fixtures:load` produces exactly 5 categories and the factors above (plus an admin user/roles from US-005) in one combined fixture run

#### US-016: Exposure factor API
**Description:** As a developer, I need an API to list categories (read-only) and manage factors (add/remove) within them.

**Acceptance Criteria:**
- [ ] `GET /api/exposure-categories` returns all 5 categories with their factors (nested or via subresource), for any authenticated user
- [ ] `ExposureCategory` is read-only via the API (no `POST`/`PATCH`/`DELETE` operations exposed) — the 5 categories are fixed
- [ ] `GET /api/exposure-factors`, `POST /api/exposure-factors`, `DELETE /api/exposure-factors/{id}` available to any authenticated user; `POST` requires `name` and a valid `category` IRI
- [ ] `DELETE /api/exposure-factors/{id}` returns `409` if the factor is referenced by any existing Referral (logic in `ExposureFactorService`)

#### US-017: Czynniki narażeń panel (frontend)
**Description:** As a user, I want a panel showing the 5 fixed categories with their factors, where I can add new factors and remove existing ones.

**Acceptance Criteria:**
- [ ] `/exposure-factors` page renders the 5 categories (in I–V order) as sections/cards, each listing its factors
- [ ] Each category section has an "Add factor" inline form (name + optional description) that posts to `/api/exposure-factors` with the correct category
- [ ] Each factor row has a "Remove" action with confirmation; shows an error if the API returns `409` (factor in use by a referral)
- [ ] Category names/headers are not editable or removable in the UI
- [ ] Verify in browser using the playwright-cli skill: all 5 categories render with seeded factors, add a new factor to a category, then remove it

### Faza 5 — Referrals (Skierowania na badania profilaktyczne)

#### US-018: Referral and ReferralExposureFactor entities + API
**Description:** As a developer, I need a `Referral` entity capturing all fields from the official Polish referral form, linked to selected exposure factors with per-factor exposure details.

**Acceptance Criteria:**
- [ ] `Referral` entity: `id`, `employee` (ManyToOne, required), `examinationType` (PHP enum: `wstepne` | `okresowe` | `kontrolne`), `jobPosition` (stanowisko pracy), `jobDescription` (opis warunków pracy / zakres czynności, text), `issuePlace`, `issueDate`, `createdBy` (ManyToOne to `User`), `pdfPath` (nullable string), `pdfGeneratedAt` (nullable datetime), `createdAt`
- [ ] `ReferralExposureFactor` join entity: `id`, `referral` (ManyToOne), `factor` (ManyToOne to `ExposureFactor`), `exposureDetails` (text — free-text "wielkość narażenia / wyniki pomiarów")
- [ ] API Platform resource for `Referral` exposes `GET /api/referrals` (paginated, ordered by `issueDate` desc), `GET /api/referrals/{id}`, `POST /api/referrals`, `DELETE /api/referrals/{id}` for any authenticated user
- [ ] `POST /api/referrals` accepts employee IRI, examination type, job position/description, issue place/date, and an array of `{ factor: IRI, exposureDetails: string }`; creates the `Referral` and its `ReferralExposureFactor` rows in one transaction (logic in `ReferralService`)
- [ ] `createdBy` set automatically from the authenticated user
- [ ] Validation: `examinationType` must be one of the 3 enum values; `employee` must reference an existing Employee (`422` otherwise)

#### US-019: Referral creation form (frontend)
**Description:** As a user, I want a form at the top of the Referrals panel to create a new referral for an employee, matching the official Polish form fields.

**Acceptance Criteria:**
- [ ] Form fields: Pracownik (employee select/search), Typ badania (radio/select: wstępne / okresowe / kontrolne), Stanowisko pracy (text), Opis warunków pracy / zakres czynności (textarea), Miejsce wystawienia, Data wystawienia (date picker, defaults to today)
- [ ] Form renders the 5 exposure categories (from `/api/exposure-categories`) each with checkboxes for its factors; checking a factor reveals a text input for "Wielkość narażenia / wyniki pomiarów"
- [ ] Submitting calls `POST /api/referrals` with the selected employee, form fields, and the list of checked factors with their exposure details
- [ ] On success, the new referral appears at the top of the list below the form and the form resets
- [ ] Required-field validation prevents submission with missing employee, examination type, or job position; errors shown in Polish
- [ ] Verify in browser using the playwright-cli skill: fill the form for a seeded employee, select factors from at least 2 categories, submit, and see the new referral in the list

#### US-020: PDF generation service
**Description:** As a developer, I need a service that renders a Referral as a PDF matching the official "Skierowanie na badania lekarskie" layout and stores it on the server filesystem.

**Acceptance Criteria:**
- [ ] `dompdf/dompdf` installed; a Twig template (`referral_pdf.html.twig`) reproduces the official form layout: employer designation + place/date header, "SKIEROWANIE NA BADANIA LEKARSKIE (wstępne/okresowe/kontrolne)" title with the selected type indicated, employee name + PESEL + address, job position and description, sections "I. Czynniki fizyczne" through "V. Inne czynniki, w tym niebezpieczne" each listing the selected factors with their exposure details, total count of factors, and a signature line
- [ ] `ReferralPdfGeneratorService::generate(Referral $referral): string` renders the template and writes the PDF to a configurable storage path (e.g. `var/referrals/{id}.pdf`), returning the relative path
- [ ] `POST /api/referrals/{id}/generate-pdf` (custom API Platform operation or controller delegating entirely to the service) generates the PDF, sets `pdfPath` and `pdfGeneratedAt` on the Referral, and returns the updated resource
- [ ] Regenerating overwrites the existing file and updates `pdfGeneratedAt`
- [ ] PHPUnit test generates a PDF for a sample referral and asserts the file exists and is non-empty

#### US-021: Referral list with PDF download (frontend)
**Description:** As a user, I want to see all referrals in a list and generate/download a PDF for any of them.

**Acceptance Criteria:**
- [ ] `/referrals` page shows the creation form (US-019) at the top and a table below listing: Pracownik, Typ badania, Stanowisko, Data wystawienia, Status PDF (Wygenerowano / Nie wygenerowano)
- [ ] Each row has a "Generuj PDF" button calling `POST /api/referrals/{id}/generate-pdf`; on success the button becomes/shows a "Pobierz PDF" download link
- [ ] "Pobierz PDF" opens/downloads the file via an authenticated `GET /api/referrals/{id}/pdf` endpoint that streams the stored file
- [ ] List supports pagination matching the API Platform default page size
- [ ] Verify in browser using the playwright-cli skill: from the referral created in US-019, click "Generuj PDF", then download the resulting PDF and confirm a file is retrieved

### Faza 6 — Navigation & Dashboard

#### US-022: App shell, navigation, and route guards
**Description:** As a user, I want a consistent layout with navigation to all panels, showing only the sections my role allows.

**Acceptance Criteria:**
- [ ] Sidebar links: Dashboard, Użytkownicy (admin only), Firmy, Pracownicy, Czynniki narażeń, Skierowania
- [ ] "Użytkownicy" link only renders for users whose roles include `ROLE_ADMIN`
- [ ] Top bar shows the logged-in user's name/email and a "Wyloguj" button
- [ ] All panel routes are wrapped in an authentication guard redirecting to `/login` if no valid token is present
- [ ] Verify in browser using the playwright-cli skill: log in as a non-admin user (create one via fixtures or admin panel) and confirm "Użytkownicy" is not visible/accessible

#### US-023: Dashboard landing page
**Description:** As a user, I want a simple dashboard after login summarizing key counts.

**Acceptance Criteria:**
- [ ] `/dashboard` shows counts: total Companies, total Employees, total Referrals
- [ ] Counts are fetched from existing list endpoints (e.g. using API Platform's `totalItems` from collection responses) — no new backend endpoint required
- [ ] Page renders within 1 second on local dev data volumes (seed data only)
- [ ] Verify in browser using the playwright-cli skill: dashboard loads after login and shows non-zero counts after seed data is loaded

## 4. Functional Requirements

**Authentication & Users**
1. The system must provide `POST /api/login` accepting email and password, returning a JWT on success and `401` on failure.
2. The system must reject login for users with `isActive = false`.
3. All API endpoints except login and API documentation must require a valid JWT.
4. Roles must be stored as database records (`code`, `name`, `description`), not hardcoded enums, so new roles can be added without a code change.
5. Every user automatically receives `ROLE_USER` in addition to any explicitly assigned roles.
6. Only users with `ROLE_ADMIN` may create, update, deactivate/delete Users, and create new Roles or assign Roles to Users.
7. An Admin cannot deactivate or delete their own account.
8. The seeded `ROLE_ADMIN` role cannot be deleted via the API.
9. Passwords must be stored using Symfony's password hasher (no plaintext, no reversible encryption).

**Employees**
10. Any authenticated user may create, view, update, and delete Employees.
11. Each Employee must have: Imię (first name), Nazwisko (last name), PESEL (11 digits), Telefon, E-mail, Adres, and a Company.
12. `POST`/`PATCH` for Employees must validate PESEL format (11 digits) and email format, returning `422` with field errors on failure.
13. The system must record which User created each Employee (`createdBy`), set automatically server-side.
14. The Employee list must support search by first/last name and filtering by Company.

**Companies**
15. Any authenticated user may create, view, update, and delete Companies.
16. Each Company must have: Nazwa, NIP (10 digits), and Adres (Ulica, Miasto, Kod pocztowy).
17. The system must reject deletion of a Company that has one or more linked Employees, returning `409 Conflict` with a Polish error message.

**Czynniki narażeń**
18. The system must provide exactly 5 fixed exposure-factor categories matching Annex 3 of the 1996 Ministry of Health regulation: I. Czynniki fizyczne, II. Pyły, III. Czynniki chemiczne, IV. Czynniki biologiczne, V. Inne czynniki, w tym niebezpieczne.
19. Categories must be seeded via fixtures and must not be creatable, editable, or deletable via the API.
20. Each category must be seeded with the example factors listed in US-015.
21. Any authenticated user may add a new Exposure Factor to any category, and remove an existing one.
22. The system must reject deletion of an Exposure Factor that is referenced by any existing Referral, returning `409 Conflict`.

**Referrals**
23. Any authenticated user may create a Referral for an Employee, specifying: examination type (wstępne/okresowe/kontrolne), job position, job description, issue place, issue date, and a set of selected exposure factors each with free-text exposure details.
24. The system must record which User created each Referral.
25. The system must allow generating a PDF for a Referral via `POST /api/referrals/{id}/generate-pdf`, which renders the official Polish referral layout (header, employee data including PESEL, job position/description, the 5 numbered factor sections with selected factors and exposure details, total factor count, signature line) and stores the file on the server.
26. The generated PDF file path must be persisted on the Referral (`pdfPath`, `pdfGeneratedAt`).
27. The system must provide `GET /api/referrals/{id}/pdf` to download the stored PDF for an authenticated user.
28. Regenerating a Referral's PDF must overwrite the previous file and update `pdfGeneratedAt`.
29. The Referral list must be paginated and ordered by issue date (most recent first).

**General / Architecture**
30. Symfony controllers must only handle request/response concerns (input deserialization handled by API Platform, output serialization, HTTP status codes); all business logic, validation orchestration, and persistence side-effects must live in Service classes.
31. Authorization decisions (e.g., admin-only User/Role management) must be implemented via Symfony Security Voters, not inline `if` checks scattered across controllers.
32. All entity input must be validated using Symfony Validator constraints, with API Platform returning `422` and field-level error messages on violations.
33. All user-facing text in the React frontend must be in Polish.

## 5. Non-Goals (Out of Scope)

- Self-service password reset via email (Admins manage credentials manually for this version).
- Public user registration — only Admins create Users.
- Multi-tenant data isolation — all Companies, Employees, Exposure Factors, and Referrals are shared across all logged-in users (single shared HR dataset).
- Email notifications or reminders (e.g., referral expiry, periodic exam due dates).
- Audit logs / change history beyond `createdBy`/`createdAt` timestamps.
- Electronic signatures or integration with external medical examination centers.
- Editing or deleting the 5 fixed exposure-factor categories.
- Mobile app or offline support.
- Internationalization — UI is Polish-only.
- Versioning of generated referral PDFs (regeneration overwrites the existing file).

## 6. Design Considerations

- Layout: persistent left sidebar navigation + top bar (user info, logout), content area per panel — typical admin-dashboard pattern, built with Tailwind utility classes.
- Tables/lists should support basic pagination (matching API Platform's default Hydra pagination) and, where specified, search/filter inputs.
- Forms should show inline validation errors mapped from API Platform's `422` violation responses.
- The Referral creation form is long (mirroring the official multi-section paper form); group it into clear visual sections: Dane pracownika i badania, Stanowisko i opis warunków pracy, and the 5 Czynniki narażeń categories (collapsible sections recommended for readability).
- Destructive actions (remove User, Company, Employee, Exposure Factor, Referral) require a confirmation dialog.

## 7. Technical Considerations

- **Backend**: Symfony 6.4 (LTS), PHP 8.5, API Platform 3.x, Doctrine ORM, PostgreSQL 16 (assumed default — see Open Questions).
- **Auth**: `lexik/jwt-authentication-bundle` for stateless JWT auth; `nelmio/cors-bundle` for CORS with the frontend dev/build origin.
- **PDF**: `dompdf/dompdf` rendering a Twig template; output stored under `var/referrals/` (or a configurable mounted volume) and served via an authenticated download endpoint — never directly exposed as static files.
- **Fixtures**: `doctrine/doctrine-fixtures-bundle` for seeding Roles, the default Admin user, the 5 Exposure Categories, and their Exposure Factors.
- **Architecture pattern**: thin controllers (or pure API Platform resource operations) delegating to Service classes (`UserService`, `CompanyService`, `EmployeeService`, `ExposureFactorService`, `ReferralService`, `ReferralPdfGeneratorService`); API Platform custom State Processors used where create/update needs side effects (password hashing, setting `createdBy`, PDF generation trigger).
- **Authorization**: Symfony Security Voters encapsulate all role-based checks, keeping the door open for new roles with finer-grained permissions later without touching controllers.
- **Frontend**: React 18 + Vite + TypeScript, Tailwind CSS, React Router, a lightweight data-fetching layer (e.g. TanStack Query or simple fetch wrapper) with a centralized API client that attaches the JWT and handles 401s (redirect to `/login`).
- **Docker**: all services defined in `docker-compose.yml` at the repo root; backend and frontend each in their own directory (`backend/`, `frontend/`).

## 8. Success Metrics

- A new developer can run `docker compose up`, load fixtures, and log in as the seeded Admin within 10 minutes using only the README.
- An Admin can create a non-admin User, assign it a role, and that user can log in and access only the panels their role permits.
- A user can create an Employee under a Company, create a Referral for that Employee selecting factors from all 5 categories, generate a PDF, and download a non-empty PDF file containing the employee's name, PESEL, job position, and the selected factors grouped under the correct Roman-numeral sections.
- All Functional Requirements (FR-1 through FR-33) have corresponding passing automated tests or manual verification steps.

## 9. Open Questions

- **Database engine**: PostgreSQL was assumed as the default for the Docker stack since it wasn't specified; confirm before US-001/US-002, or switch to MySQL/MariaDB if preferred.
- **User deletion vs. deactivation**: should `DELETE /api/users/{id}` hard-delete the row, or always soft-deactivate (`isActive = false`) to preserve `createdBy` references on Employees/Referrals/Companies created by that user? Recommend soft-deactivate; needs confirmation.
- **Employee address structure**: spec says "Address" as a single field — confirmed as free text here, but should it instead mirror Company's structured Ulica/Miasto/Kod pocztowy for consistency and future filtering?
- **PESEL field**: added to Employee because it's required by the official referral form, even though it wasn't in the original Employee field list — confirm this addition is acceptable.
- **Referral "Łączna liczba czynników" (total factor count) and signature**: PDF will compute the total automatically and print the issuing user's name as the signatory line — confirm no separate digital-signature requirement exists.
- **Roles beyond Admin/User**: no specific additional roles were requested beyond "Administrator"; only `ROLE_ADMIN` and `ROLE_USER` are seeded initially. Future roles (e.g., "Kadrowa", "Kierownik") can be added by an Admin via the Roles panel once US-009/US-010 are built, but no specific permissions are pre-wired for them beyond the Admin/non-admin split.
