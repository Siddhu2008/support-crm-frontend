# Support CRM Frontend

The frontend is a responsive support ticket dashboard built with React and Vite. It gives support teams a single workspace for creating tickets, reviewing ticket status, searching records, managing notes, and monitoring support activity.

## Project Overview

This application is the client-side portion of a full-stack Support CRM assignment. It communicates with the Express backend through REST APIs and uses MongoDB-backed ticket data.

The interface includes:

- Responsive dashboard for desktop, tablet, and mobile screens
- Ticket summary cards for total, open, in-progress, and closed tickets
- In-page new-ticket modal form
- Ticket search by ID, customer, email, subject, or description
- Status filtering and one-click filter shortcuts
- Ticket detail pages with status updates and internal notes
- Customer directory generated from ticket records
- Reports view with resolution rate and status distribution
- Loading, empty, validation, error, and success states
- Responsive card-based ticket layout

## Technology Stack

- React 19
- Vite
- React Router
- JavaScript ES modules
- CSS with responsive media queries
- Fetch API for backend communication
## Application Structure

```text
frontend/
├── src/
│   ├── App.jsx       # Routes, dashboard, forms, ticket details, and UI state
│   ├── App.css       # Application layout, components, cards, modal, and responsive styles
│   ├── index.css     # Global page styles and background treatment
│   └── main.jsx      # React entry point
├── package.json
└── README.md
```
## Prerequisites

- Node.js 18 or newer
- npm
## Installation

From this directory, install the frontend dependencies:

```bash
npm install
```

The frontend uses this API URL by default:

```text
http://localhost:5000
```

To use another backend URL, create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

## Running the Frontend

Start the Vite development server:

```bash
npm run dev
```

Open the URL shown by Vite, normally `http://localhost:5173`.

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```
## Main User Flows

### Dashboard

The dashboard loads tickets from `GET /api/tickets`, calculates summary counts, and displays recent tickets as responsive cards.
### Create Ticket

Click `+ New Ticket` to open the form without leaving the dashboard. The form validates customer information, subject, and description before sending the request to the backend.
### Search and Filter

Search and status filters are sent to the backend. Summary cards also act as quick filters for Open, In Progress, and Closed tickets.
### Ticket Details

Selecting a ticket opens its detail page. Users can change the status and add internal notes through the update form.
### Customers and Reports

The Customers view groups loaded tickets by customer email. The Reports view presents resolution rate, unresolved ticket count, and status distribution.
## API Dependency

The frontend expects the backend to provide:

```text
GET    /api/health
GET    /api/tickets
POST   /api/tickets
GET    /api/tickets/:ticketId
PUT    /api/tickets/:ticketId
```

See [../backend/README.md](../backend/README.md) for request and response details.
## Validation

Run the frontend diagnostics and production build before submission:

```bash
npm run build
```

The production build confirms that the React application can be compiled for deployment.
