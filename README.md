# Fragments Web UI

A lightweight front‑end for the Fragments API that runs in the browser and talks to the deployed fragments microservice. It was built for the *Cloud Computing for Programmers* course to exercise OAuth2 authentication with Amazon Cognito, call the API from a client app, and manually test all core fragment operations.

## Overview

The app is a single‑page JavaScript UI served as static files (`index.html` plus bundled scripts). It uses:

- `auth.js` to integrate with Cognito Hosted UI and manage login/logout and access tokens.
- `api.js` as a thin client around the Fragments HTTP API (listing, creating, updating, deleting, and converting fragments).
- `app.js` to wire everything together, handle DOM events, and drive the user workflow in the browser.
- `index.html` as a simple layout containing login buttons, forms, and areas for displaying fragment metadata and content.

The goal is functionality and testability rather than heavy design: every important API call can be driven from the UI so the backend can be verified end‑to‑end.

## Features

- **Cognito‑based Authentication**
  - Redirects the user to Amazon Cognito Hosted UI for sign‑in and handles the OAuth2 redirect back.
  - Stores the resulting tokens in memory and attaches them as `Authorization` headers for all API calls.

- **Fragment Management**
  - After login, fetches and displays the authenticated user’s fragment list and metadata.
  - Lets users create new fragments by choosing a type (text, JSON, image) and supplying content through the UI.
  - Supports viewing, updating, and deleting existing fragments using buttons or links bound in `app.js`.
  - Triggers conversion endpoints (for example Markdown → HTML, PNG → JPEG) and renders the converted result in the browser where appropriate.

- **Environment‑Aware API Client**
  - `api.js` reads a configurable base URL (for example via environment variables during build or a config section in `app.js`) so the same UI can talk to:
    - A local fragments server on `localhost`.
    - A server running on EC2.
    - The final production server running on ECS behind a load balancer.

## Technology Stack

- Plain JavaScript (no heavy framework) for maximum transparency.
- Simple HTML/CSS layout in `index.html` for forms and output areas.
- Fetch API (or similar) inside `api.js` for REST calls to `/v1/fragments` and related routes.
- NPM scripts defined in `package.json` for development and building static assets.

## Local Development

Typical workflow:

Install dependencies
npm install

Start a local dev server (for example via a script in package.json)
npm run dev


Then:

1. Ensure your Fragments API server is running and accessible (locally, on EC2, or via ECS).  
2. Configure the UI to point to that API base URL and your Cognito app client details (user pool, client ID, redirect URI).  
3. Open the dev URL in a browser and click **Sign In** to go through the Cognito Hosted UI.  
4. Use the UI to create, view, update, delete, and convert fragments, verifying responses via the on‑screen output and the browser’s Network tab.

## NPM Scripts

From `package.json`:

- `npm run dev` – run the app in development mode (for example with a local HTTP server and live reload).  
- `npm run build` – produce a production‑ready bundle if a bundler is configured.  

These scripts support building and serving the static assets either locally or via a container image (for example Nginx) as used in the Docker‑based workflows described in the course assignments.

## What This UI Demonstrates

- Authenticating a browser client with Amazon Cognito and using the resulting tokens to protect API calls.  
- Manually testing all key Fragments API routes from a real front‑end (create, list, read, update, delete, convert).  
- Connecting a simple static web app to a microservice that is deployed on AWS using EC2/ECS, Docker, and CI/CD pipelines.
