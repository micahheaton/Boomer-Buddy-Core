# Overview

**Boomer Buddy** is a comprehensive anti-scam platform launched summer 2025 by cybersecurity leaders with 20+ years of industry experience. The platform consists of a web application and companion mobile app featuring a live intelligence system with verified RSS data collection from official government sources. The web app allows users to upload screenshots, paste text, or input phone call transcripts for AI-powered scam analysis enhanced with ML pattern recognition. The system provides real-time scam trend monitoring, verified news consolidation, comprehensive archives, advanced filtering capabilities, and mobile push notifications for critical alerts. Advanced features include live call transcription with PII filtering, secure evidence collection, and multilingual voice guidance. Historical data shows authentic fraud trends from 2023-2024 including major scams like cryptocurrency investment fraud ($4.6B losses), AI voice cloning family emergency scams, and job search platform exploitation. Both platforms integrate with PostgreSQL database storage for verified scam trends and news items with mobile app synchronization for live updates.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes
- Removed Archives page from navigation (backed up to client/src/pages/backup/archives.tsx for future use)
- Replaced Archives with About page in main navigation
- Updated all pages to reflect summer 2025 launch transparency
- **Major Enhancement**: Integrated comprehensive government RSS feeds from GPT-4 curated list
- **New System**: Created intelligent feed parser (`intelligentFeedParser.ts`) for advanced content filtering
- **Data Expansion**: Added 15+ verified government sources including FTC, FBI, DOJ, SEC, CFPB, FCC, HHS-OIG, CISA, and state AGs
- **Smart Filtering**: Implemented elder-relevance scoring and scam-type detection to filter mixed-content feeds
- **Fixed**: Resolved LiveHeatmap WebSocket errors and array handling issues for better stability
- **CRITICAL FIX**: Improved intelligent triage logic to properly distinguish between government news items (legislation, announcements) and actual scam alerts
- **Navigation Update**: Removed "Verified News" link since news is now consolidated in unified Scam Trends page
- **Enhanced Classification**: Added specific detection for "Big Beautiful Bill" and similar legislation as news rather than critical alerts
- **TRANSLATION SYSTEM COMPLETE**: Implemented comprehensive multilingual support with LibreTranslate as primary service, smooth animations, and fallback dictionary for Spanish, French, and German languages (January 2025)
- **UNIFIED LIVE INTELLIGENCE**: Created comprehensive UnifiedTrendsHeatmap page consolidating Live Heatmap WITH Scam Trends functionality
- **ENHANCED CLICKABILITY**: Fixed live alerts to be fully clickable with URLs, hover states, and external link indicators
- **COMPREHENSIVE COLLECTION**: All UI components now display data from 60+ government sources across all 50 states with real-time updates
- **INTELLIGENT CACHING SYSTEM**: Implemented sophisticated cache manager with 6-hour refresh cycles, incremental updates, and WebSocket notifications (January 2025)
- **PERFORMANCE OPTIMIZATION**: Replaced database queries on every request with fast cached data serving for sub-second page loads
- **REAL-TIME NOTIFICATIONS**: Added WebSocket integration to notify frontend clients when cache updates occur with new data
- **LLM VALIDATION SYSTEM COMPLETE**: Implemented comprehensive OpenAI GPT-4o based content validation ensuring only scam/elderly-relevant content from all 61 government sources (August 2025)
- **3-MONTH LIFECYCLE ARCHIVE**: Created automated 3-month alert lifecycle with searchable historical archive system for expired content
- **ENHANCED DATA COLLECTOR**: Built comprehensive collection system with LLM validation, automated archiving, and strict government-only content filtering
- **ARCHIVE API ENDPOINTS**: Added full archive management with search, statistics, and cleanup functionality for historical scam data research
- **MOBILE PIVOT INITIATED**: Comprehensive mobile companion app architecture planned with React Native core, iOS/Android native extensions, zero-PII processing, and integration with existing government data sources (August 2025)
- **MOBILE PHASE 1 COMPLETE**: Full React Native foundation implemented with 6 core screens (Home, Alerts, Report, Analysis, Training, Settings), zero-PII architecture with client-side data scrubbing, and 3 mobile API endpoints (/v1/model, /v1/analyze, /v1/feeds) fully functional (August 2025)

# System Architecture

## Frontend Architecture
The platform consists of two frontend applications:

### Web Application
Built with React, TypeScript, and Vite, utilizing a modern component-based architecture. The UI framework is based on shadcn/ui components with Radix UI primitives and Tailwind CSS for styling. The application uses Wouter for client-side routing and TanStack Query for state management and API communication. The design follows a single-page application pattern with modular components for different input types (upload, text, transcript) and result display.

### Mobile Application  
Built with React Native for cross-platform iOS and Android support. Phase 1 foundation complete with:
- Complete app architecture with 6 core screens (Home, Alerts, Report, Analysis, Training, Settings)
- Zero-PII data processing with client-side scrubbing (PiiScrubber service)
- On-device risk assessment engine (RiskEngine service)
- Encrypted local storage system (StorageService with encrypted SQLite)
- Government data synchronization via mobile API endpoints
- Real-time scam threat alerts from 61+ government sources
- Interactive training modules for scam detection skills
- Comprehensive privacy-first architecture ensuring no sensitive data leaves device
- Emergency reporting mode for immediate threat assessment

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
The platform integrates with official government (.gov/.us) and authorized nonprofit RSS feeds for verified scam intelligence:

**Official Government Data Sources (4x Daily Collection):**
- Federal Trade Commission (FTC) Consumer Alerts RSS
- FBI Internet Crime Complaint Center (IC3) Public Service Announcements
- Social Security Administration Blog RSS Feed
- HHS Office of Inspector General Consumer Alerts RSS
- CISA Cybersecurity Advisories RSS
- Washington State Attorney General Consumer Alerts RSS
- California Attorney General Consumer Alerts RSS

**Authorized Elder-Focused Nonprofits:**
- AARP Fraud Watch Network RSS Feed
- Better Business Bureau Scam Tracker RSS

**Data Collection Schedule:**
- Automated collection every 6 hours (6 AM, 12 PM, 6 PM, 12 AM)
- Personalized mobile notifications based on user vulnerability assessments
- Weekly mini-games/questionnaires on Sundays at 10 AM
- Daily vulnerability-based reminders at 2 PM

**AI and ML Services:**
- OpenAI GPT-4o for scam analysis with structured JSON responses (minimal usage to control costs)
- Advanced Content Moderation System filtering only official government sources
- Elder-targeted social engineering detection focused on vulnerability assessments
- Personalized notification service based on individual risk profiles
- Automatic content validation from trusted .gov/.us domains only
- Weekly mini-games tailored to user's primary vulnerabilities

**Data Processing:**
- Automated daily trend archiving with weekly/monthly summaries
- Live news aggregation from verified sources with reliability scoring
- Cross-platform evidence collection with legal-grade timestamps
- Multi-language voice synthesis for accessibility

The system maintains 24/7 monitoring with intelligent content filtering that specifically targets elder-focused social engineering attacks. Advanced moderation automatically excludes technical security content while prioritizing romance scams, tech support fraud, Social Security impersonation, Medicare fraud, and grandparent scams. Each source is continuously evaluated for quality and elder-relevance, with poor performers automatically deactivated. All approved content includes confidence scores, elder vulnerability assessments, and prevention guidance.

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