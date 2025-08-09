# Overview

**Boomer Buddy** is a senior-friendly web application designed to help users analyze suspicious messages, emails, phone calls, and screenshots for potential scam patterns. The application uses OpenAI's API to provide AI-powered scam detection with confidence scoring and actionable recommendations. Users can upload images, paste text, or describe phone call transcripts, and receive detailed analysis with specific next steps and relevant contact information. The branding features a friendly shield logo with two people representing protection and assistance, using a navy blue, teal, and orange color scheme to create a trustworthy and approachable interface.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built with React, TypeScript, and Vite, utilizing a modern component-based architecture. The UI framework is based on shadcn/ui components with Radix UI primitives and Tailwind CSS for styling. The application uses Wouter for client-side routing and TanStack Query for state management and API communication. The design follows a single-page application pattern with modular components for different input types (upload, text, transcript) and result display. The interface features Boomer Buddy branding with a custom SVG logo component and a color scheme of navy blue (#17948E), teal (#1F748C), and orange (#E3400B) to create a senior-friendly, trustworthy appearance.

## Backend Architecture
The backend is an Express.js server written in TypeScript that provides RESTful API endpoints. The main analysis endpoint accepts multipart form data for image uploads or JSON for text-based submissions. The server integrates with OpenAI's API for scam analysis using structured prompts and JSON schema validation. OCR functionality is implemented using Tesseract.js for extracting text from uploaded images. The application follows a layered architecture with separate modules for database operations, external API calls, and business logic.

## Data Storage
The application uses PostgreSQL as the primary database with Drizzle ORM for database operations and migrations. The schema includes tables for users (with email-based identification) and analyses (storing input data, metadata, and JSON results). File uploads are stored locally in an uploads directory during development. The database design supports optional user authentication while allowing anonymous analysis submissions.

## Authentication and Authorization
The application implements optional magic link authentication via email, allowing both authenticated and anonymous usage. User sessions are managed through standard HTTP mechanisms. The system is designed to work primarily without authentication for the MVP, with user accounts being optional for saving and sharing reports.

## External Service Integrations
The primary external integration is with OpenAI's GPT-4o model for scam analysis. The application uses structured prompts with a scoring rubric to evaluate content and return standardized JSON responses. A knowledge base of federal, state, and financial institution contacts is stored as static JSON files and integrated into the analysis results. The system is designed to avoid additional paid services beyond OpenAI for the MVP phase.

# External Dependencies

- **OpenAI API**: Core AI analysis engine using GPT-4o model for scam detection and scoring
- **PostgreSQL Database**: Primary data storage via Neon serverless database
- **Tesseract.js**: OCR processing for extracting text from uploaded images
- **shadcn/ui Components**: UI component library built on Radix UI primitives
- **TanStack Query**: Data fetching and state management for API communications
- **Drizzle ORM**: Type-safe database operations and schema management
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Vite**: Build tool and development server for the React frontend
- **Express.js**: Web server framework for the Node.js backend
- **Multer**: File upload handling middleware for image processing