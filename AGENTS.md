# AGENTS.md

## Repository Scope

This repository mixes three execution contexts:

- `BackEnd/`: Spring Boot API in Java 17
- `FrontEnd/`: static HTML/CSS/JavaScript pages
- root Python scripts: face-recognition utilities and live camera workflow

Agents should treat these parts as loosely coupled but related.

## Existing Agent Rules

No repository-local agent rule files were found:

- no `.cursorrules`
- no `.cursor/rules/`
- no `.github/copilot-instructions.md`

Use this file as the default project instruction source.

## Main Project Structure

- `BackEnd/pom.xml`: Maven build definition
- `BackEnd/src/main/java/ma/dream/case_backend/`: backend source
- `BackEnd/src/main/resources/application.yml`: default H2 config
- `BackEnd/src/main/resources/application-postgres.yml`: PostgreSQL config
- `BackEnd/src/test/java/`: backend tests
- `FrontEnd/*.html`: page entrypoints
- `FrontEnd/*.js`: browser logic
- `FrontEnd/*.css`: styling
- `main.py`: live face attendance UI and recognition loop
- `EncodeGenerator.py`: image sync and face encoding generator
- `python_app/`: Python backend/API helpers

## Default Runtime Assumptions

- Backend runs on `http://localhost:8080`
- Frontend is served statically, usually on `http://localhost:5500`
- Default backend database is local H2 file storage
- Python scripts should now use backend HTTP endpoints, not direct PostgreSQL access

## Build Commands

### Backend

Run from `BackEnd/`.

- Start backend:
  - `./mvnw.cmd spring-boot:run`
- Clean compile:
  - `./mvnw.cmd clean compile`
- Package:
  - `./mvnw.cmd clean package`

Useful local URLs after startup:

- Swagger UI: `http://localhost:8080/swagger-ui/index.html`
- H2 console: `http://localhost:8080/h2-console`

### Frontend

There is no Node toolchain or bundler.

- Serve static files from `FrontEnd/`:
  - `python -m http.server 5500`

Then open:

- `http://localhost:5500/index.html`

### Python

Run from repository root.

- Generate encodings and sync photos to backend:
  - `python EncodeGenerator.py`
- Start live recognition UI:
  - `python main.py`

## Test Commands

### Backend tests

Run all tests:

- `./mvnw.cmd test`

Run one test class:

- `./mvnw.cmd -Dtest=DreamCaseBackendApiApplicationTests test`

Run one test method:

- `./mvnw.cmd -Dtest=DreamCaseBackendApiApplicationTests#contextLoads test`

### Python syntax check

- `python -m py_compile "main.py" "EncodeGenerator.py" "python_app\config.py" "python_app\backend_client.py"`

### Frontend validation

No automated test suite is configured.

Minimal validation:

- load the affected page in the browser
- verify console has no runtime error
- verify network requests return success

## Lint / Formatter Status

No dedicated lint or formatter config was found for:

- Java
- JavaScript
- Python

Do not introduce new tooling unless the user asks.

## Java Style Guidelines

- Use Java 17 compatible code
- Keep package structure under `ma.dream.case_backend`
- Use 4 spaces indentation
- Prefer one public class per file
- Keep classes small and responsibility-focused

### Java naming

- classes: `PascalCase`
- methods/fields/params: `camelCase`
- constants: `UPPER_SNAKE_CASE`
- DTO classes end with `Dto`
- services end with `Service`
- repositories end with `Repository`
- controllers end with `Controller`
- mappers end with `Mapper`

### Java architecture

- controllers stay thin
- services hold business logic
- repositories handle persistence access
- mappers convert entity <-> DTO
- reuse existing `ResponseEntity` patterns

### Java annotations and libraries

- Lombok is heavily used
- MapStruct is used for DTO/entity conversion
- JPA/Hibernate is the persistence model
- Spring MVC + Spring Data are the standard patterns

### Java imports

- remove unused imports
- avoid wildcard imports
- keep import groups readable and stable

### Java error handling

- use existing exception patterns such as `TechnicalException`
- do not swallow exceptions silently
- log operational failures that help debugging
- avoid exposing internal details in API responses

### Java persistence guidance

- keep H2/PostgreSQL compatibility in mind
- prefer repository or JPA criteria logic over raw SQL
- preserve enum string storage with `@Enumerated(EnumType.STRING)`
- update DTOs, mappers, services, and controllers together when entity fields change

## Frontend Style Guidelines

- Plain browser JavaScript only
- No bundler-specific syntax
- Keep code compatible with direct `<script>` loading
- Prefer small helper functions over deeply nested logic
- Use 4 spaces indentation

### Frontend naming

- JS variables/functions: `camelCase`
- CSS classes: kebab-case
- DOM IDs/classes should match existing HTML usage

### Frontend API usage

- use `fetch`
- always check `response.ok`
- handle empty states and failure states explicitly
- keep API base URLs centralized per file when possible
- do not invent endpoints; verify backend support first

### Frontend UX guidance

- preserve existing page structure unless the task calls for redesign
- favor graceful fallbacks when a backend field is missing
- avoid relying on `localStorage` for core business data when an API exists

## Python Style Guidelines

- Use `snake_case` for functions and variables
- Keep scripts executable from repository root
- Prefer pure helper functions for API/config logic
- Keep camera/UI logic separate from backend HTTP logic when possible

### Python imports

- standard library first
- third-party next
- local modules last
- remove unused imports

### Python integration guidance

- prefer backend HTTP API over direct DB access
- keep backend URL configurable with environment variables
- do not hardcode credentials
- handle backend unavailability cleanly

### Python error handling

- fail fast on missing files or camera startup failures
- print actionable error messages
- guard against invalid images and missing face encodings
- keep employee IDs aligned with generated encodings

## Environment Files

Detected local config files:

- `.env.example`
- `BackEnd/src/main/resources/application.yml`
- `BackEnd/src/main/resources/application-postgres.yml`

Agents should prefer environment-driven changes over hardcoded secrets.

## Verification Checklist

For backend changes:

- run `./mvnw.cmd test`
- smoke test the touched endpoint

For frontend changes:

- serve `FrontEnd/`
- open the changed page
- verify browser console and network calls

For Python changes:

- run `python -m py_compile ...`
- run the relevant script
- confirm the backend endpoint used by the script is reachable

## Known Constraints

- frontend has no automated tests
- backend test coverage is minimal
- Python face-recognition dependencies may be difficult on Windows
- some repository files are prototypes or demo-oriented
- the git worktree may already contain unrelated user changes

## Agent Priorities

When making changes, optimize for:

1. correctness
2. compatibility with the existing stack
3. small, targeted edits
4. clear verification steps
5. no secret leakage
