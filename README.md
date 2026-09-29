# Loan Eligibility & Lead Management System

An enterprise-grade, production-ready **Loan Eligibility & Lead Management System** built for Banks and NBFCs using **Clean Architecture**, **Next.js 15 (App Router)**, **Django REST Framework**, dynamic database-driven **Business Rule Engine (BRE)**, Credit Bureau Abstraction, and **Docker Compose** containerization.

---

## Technical Stack & Clean Architecture

### Frontend
- **Framework**: Next.js 15 (App Router, Server & Client Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Glassmorphism UI + Custom Dark/Light Modes
- **Forms & Validation**: React Hook Form + Zod (Strict schema validation)
- **State & Data Fetching**: TanStack Query v5 + Axios with JWT interceptors
- **Data Visualization**: Recharts (Interactive Line, Bar, Pie & Donut charts)
- **Animations**: Framer Motion step transitions

### Backend
- **Framework**: Django 5.0 + Django REST Framework (DRF)
- **Database**: PostgreSQL (Production) / SQLite (Zero-config local dev)
- **Caching & Async Tasks**: Redis + Celery
- **Authentication**: JWT (SimpleJWT) with Access/Refresh token rotation & RBAC
- **API Documentation**: drf-spectacular (OpenAPI 3.0 / Swagger UI)
- **Testing**: Pytest & Django Test Framework (Pass rate: 100%)

### Deployment & Orchestration
- **Containers**: Docker, Docker Compose
- **Reverse Proxy**: Nginx
- **CI/CD**: GitHub Actions

---

## System Key Features

1. **Customer Loan Application (Multi-Step Wizard)**:
   - Step 1: Personal Details (Indian 10-digit mobile validation, age 21–60 validation, email, location).
   - Step 2: Financial Details (Loan Type: Home Loan / LAP, Employment Type, Income, Loan Amount, Property Value).
   - Step 3: Mandatory Consent Checkbox for Data Sharing.
   - Instant dynamic eligibility evaluation popup on submission.

2. **Credit Score Integration (Bureau Abstraction)**:
   - Abstract `BaseCreditService` interface with `MockCibilCreditService` provider.
   - Deterministic hashing mechanism generating realistic credit bureau scores (300–850) with color indicators (Green for Excellent, Blue for Good, Yellow for Fair, Red for Poor).
   - Built-in fallback handling for bureau API timeouts and network failures.

3. **Dynamic Database Business Rule Engine (BRE)**:
   - **Zero Code Changes Needed**: All rules stored in the `BRERule` database table (`rule_name`, `field`, `operator`, `value`, `error_message`, `priority`, `is_active`).
   - Supported Operators: `>`, `<`, `>=`, `<=`, `==`, `!=`, `BETWEEN`, `IN`.
   - Admin UI allows creating, updating, toggling status, changing priorities, and testing payload in a real-time **Sandbox Playground**.

4. **Duplicate Lead Validation**:
   - Submitting an application with an already registered mobile number blocks duplicate record creation and returns:
     ```json
     {
       "status": "error",
       "message": "Lead already exists"
     }
     ```

5. **Executive Analytics Dashboard**:
   - Metrics: Total Leads, Eligible Leads, Rejected Leads, Pending Leads, Average Credit Score, Average Loan Amount, Approval Rate (%).
   - Interactive Recharts visualizations: Monthly lead trends, Loan distribution, BRE status pie chart, Credit score brackets, City-wise leads.
   - One-click export to CSV, Excel, and PDF.

6. **Lead Management Workspace**:
   - Advanced data table with search, multi-filters (BRE status, loan type, city), column sorting, pagination, bulk selection, bulk soft delete, and exports.
   - Lead detail page featuring financial breakdown, BRE evaluation audit breakdown, timeline, and internal staff notes.

7. **Role-Based Access Control (RBAC)**:
   - Roles: Super Admin, Admin, Loan Manager, Sales Executive, Read Only.

---

## Quick Start Guide

### Option 1: Single Command Setup with Docker Compose (Recommended)

Run the entire multi-container architecture (Postgres, Redis, Django, Celery, Next.js, Nginx) with one command:

```bash
docker compose up --build
```

Access the services:
- **Application Frontend**: [http://localhost](http://localhost) (or [http://localhost:3000](http://localhost:3000))
- **Swagger API Docs**: [http://localhost:8000/api/schema/swagger-ui/](http://localhost:8000/api/schema/swagger-ui/)
- **Django Admin**: [http://localhost:8000/admin/](http://localhost:8000/admin/)

---

### Option 2: Local Development Setup

#### 1. Backend Setup (Django)

```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate

pip install -r requirements.txt
python manage.py migrate
python manage.py seed_bre_rules
python manage.py runserver
```

Default Admin Credentials created by `seed_bre_rules`:
- **Username**: `admin`
- **Password**: `admin123`

#### 2. Frontend Setup (Next.js 15)

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Running Backend Unit Tests

Run the test suite using `pytest`:

```bash
cd backend
pytest
```

---

## REST API Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login/` | User Login (Returns JWT Access & Refresh tokens) | No |
| `POST` | `/api/auth/refresh/` | Refresh JWT Token | No |
| `POST` | `/api/leads/` | Submit Loan Application & Run Dynamic BRE | No |
| `GET` | `/api/leads/` | List Leads (Search, Filter, Sort, Pagination) | Yes |
| `GET` | `/api/leads/{id}/` | Get Lead Details | Yes |
| `DELETE` | `/api/leads/{id}/` | Soft Delete Lead | Yes |
| `GET` | `/api/dashboard/` | Executive Analytics & Metrics API | Yes |
| `GET` | `/api/bre-rules/` | List DB BRE Rules | Yes |
| `POST` | `/api/bre-rules/` | Create New BRE Rule | Yes |
| `PUT` | `/api/bre-rules/{id}/` | Update BRE Rule | Yes |
| `POST` | `/api/bre-rules/test/` | Test Payload in BRE Sandbox Playground | Yes |
| `GET` | `/api/export/leads/` | Export leads (CSV, Excel, PDF) | Yes |

---

## Documentation Deliverables

- **ER Diagram**: [docs/ER_DIAGRAM.md](file:///c:/Users/Lenovo/OneDrive/Desktop/assesment/docs/ER_DIAGRAM.md)
- **API Flow Sequence**: [docs/API_FLOW.md](file:///c:/Users/Lenovo/OneDrive/Desktop/assesment/docs/API_FLOW.md)
- **Postman Collection**: [docs/Postman_Collection.json](file:///c:/Users/Lenovo/OneDrive/Desktop/assesment/docs/Postman_Collection.json)
