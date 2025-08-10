# Overview

**Boomer Buddy** is a comprehensive anti-scam platform consisting of a web application and companion mobile app. The platform features a live intelligence system with verified RSS data collection from trusted government sources including FTC, FBI, BBB, AARP, and Social Security Administration. The web app allows users to upload screenshots, paste text, or input phone call transcripts for AI-powered scam analysis enhanced with ML pattern recognition. The system provides real-time scam trend monitoring, verified news consolidation, and mobile push notifications for critical alerts. Advanced features include live call transcription with PII filtering, secure evidence collection, and multilingual voice guidance. Both platforms integrate with PostgreSQL database storage for verified scam trends and news items with mobile app synchronization for live updates.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The platform consists of two frontend applications:

### Web Application
Built with React, TypeScript, and Vite, utilizing a modern component-based architecture. The UI framework is based on shadcn/ui components with Radix UI primitives and Tailwind CSS for styling. The application uses Wouter for client-side routing and TanStack Query for state management and API communication. The design follows a single-page application pattern with modular components for different input types (upload, text, transcript) and result display.

### Mobile Application  
Built with Expo and React Native for cross-platform iOS and Android support. Features include:
- Live call transcription with one-button activation
- Screenshot capture and analysis functionality
- User profiles with "Boomer Buddy Score" tracking
- PII filtering system that strips sensitive data client-side before transmission
- Integration with the same backend API as the web app
- Facebook group access and community features

Both interfaces feature Boomer Buddy branding with a shield logo and color scheme of navy blue (#17948E), teal (#1F748C), and orange (#E3400B) to create a senior-friendly, trustworthy appearance.

## Backend Architecture
The backend is an Express.js server written in TypeScript that provides RESTful API endpoints. The main analysis endpoint accepts multipart form data for image uploads or JSON for text-based submissions. The server integrates with OpenAI's API for scam analysis using structured prompts and JSON schema validation. OCR functionality is implemented using Tesseract.js for extracting text from uploaded images. The application follows a layered architecture with separate modules for database operations, external API calls, and business logic.

## Data Storage
The application uses PostgreSQL as the primary database with Drizzle ORM for database operations and migrations. The schema includes:
- Users table with OAuth authentication and safety scoring
- Analyses table for scam detection results and metadata
- ScamTrends table for verified government RSS data with automatic collection
- NewsItems table for verified news from trusted sources with reliability scoring
- DataSources table for RSS feed monitoring and status tracking
- WebSocket integration for real-time mobile notifications and live updates
- File uploads stored locally in uploads directory with secure access controls

## Authentication and Authorization
The application implements optional magic link authentication via email, allowing both authenticated and anonymous usage. User sessions are managed through standard HTTP mechanisms. The system is designed to work primarily without authentication for the MVP, with user accounts being optional for saving and sharing reports.

## External Service Integrations
The platform integrates with verified RSS feeds from trusted government sources for real-time scam intelligence:

**Live RSS Data Sources:**
- Federal Trade Commission (FTC) Consumer Alerts RSS Feed
- FBI Internet Crime Complaint Center (IC3) Press Releases RSS
- Better Business Bureau Scam Tracker RSS Feed
- AARP Fraud Watch Network RSS Feed  
- Social Security Administration Blog RSS Feed
- Automated collection every 6 hours with database storage and mobile notifications

**AI and ML Services:**
- OpenAI GPT-4o for scam analysis with structured JSON responses
- Custom ML pattern recognition system with 50+ algorithms
- Real-time trend matching and threat correlation
- Automatic PII detection and filtering

**Data Processing:**
- Automated daily trend archiving with weekly/monthly summaries
- Live news aggregation from verified sources with reliability scoring
- Cross-platform evidence collection with legal-grade timestamps
- Multi-language voice synthesis for accessibility

The system maintains 24/7 monitoring of data sources with automatic updates every 6 hours and daily archival processes. All sources include reliability scores and direct citation links for maximum transparency.

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