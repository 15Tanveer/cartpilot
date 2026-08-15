# CartPilot

CartPilot is a React + TypeScript application for managing abandoned-cart recovery workflows and customer checkout recovery.

The application separates the internal cart-management experience from the public recovery checkout flow, with route-level code splitting and an Ant Design based interface.

## What it includes

- Abandoned-cart listing and management flows
- Public checkout route for customers returning from recovery communication
- Route-based lazy loading for application pages
- Redux Toolkit state management
- API integration with Axios
- Ant Design component system and theming
- EmailJS integration
- Google Generative AI integration
- DOM sanitisation with DOMPurify
- TypeScript, ESLint, Prettier, Husky and spell-check tooling

## Tech stack

- React 19
- TypeScript
- React Router
- Redux Toolkit
- Ant Design
- Axios
- Sass
- EmailJS
- Google Generative AI SDK

## Project structure

```text
src/
├── api/          # API layer
├── components/   # Shared UI components
├── config/       # Routes and application configuration
├── constants/    # Shared constants
├── hooks/        # Reusable hooks
├── interfaces/   # TypeScript interfaces
├── layouts/      # Application layouts
├── pages/        # Route-level screens
└── store/        # Application state
```

## Getting started

```bash
npm install
npm start
```

The development server runs on `http://localhost:3000` by default.

## Available scripts

```bash
npm start       # Start the development server
npm run build   # Create a production build
npm test        # Run the test suite
npm run lint    # Run ESLint
```

## Engineering notes

The application keeps customer-facing checkout separate from the authenticated management layout and lazy-loads route-level screens to reduce the initial application bundle. Supporting project documentation, including colour-management guidance, lives alongside the source.

## Status

Active development / portfolio project.
