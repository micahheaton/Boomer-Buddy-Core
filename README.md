# Boomer Buddy - Mobile Companion Apps

A comprehensive digital safety ecosystem protecting seniors from online and offline scams through advanced AI-powered threat detection, personalized protection, and zero-PII architecture.

## 🛡️ Privacy-First Architecture

**Zero-PII Guarantee**: No personally identifiable information ever leaves your device.

- ✅ **No PII Stored**: No names, emails, phone numbers, addresses, SSNs, financial data
- ✅ **On-Device Processing**: All sensitive analysis performed locally
- ✅ **Hard Blocks**: SSN/PAN detection prevents any transmission
- ✅ **Feature Vectors Only**: Only anonymized metadata sent to cloud (optional)
- ✅ **Local Storage**: All evidence encrypted on your device
- ✅ **US-Only Distribution**: Designed for US seniors and regulations

## 📱 Platform Capabilities

### Android Features
- **Real-Time Call Screening**: `CallScreeningService` intercepts and blocks scam calls
- **SMS Protection**: Default SMS app integration or notification-based warnings
- **On-Device ML**: TensorFlow Lite models for instant threat detection
- **Heads-Up Notifications**: Warning overlays during suspicious calls

### iOS Features  
- **Call Directory Extension**: System-level call identification and blocking
- **SMS Filter Extension**: Unknown sender classification and filtering
- **Voicemail Analysis**: Processes Apple's voicemail transcriptions
- **Core ML Integration**: On-device machine learning for privacy

## 🧠 On-Device Risk Engine

**Dual-Layer Protection**:
1. **Machine Learning Models**: TensorFlow Lite (Android) / Core ML (iOS)
2. **Rules Engine**: Government agency validation, keyword detection, timing analysis

**Signals Detected**:
- Payment scams (gift cards, crypto, wire transfers)
- Government impersonation (IRS, SSA, Medicare)
- Urgency tactics and threat language
- Brand spoofing and phishing attempts
- Callback number mismatches
- Off-hours agency claims

## 🎓 Personalized Training System

**30-Second Micro-Drills** with spaced repetition learning:

- **Import from Web Quiz**: JWT/PASETO token or 10-character code
- **Adaptive Scheduling**: Based on your preferences and risk profile
- **Multiple Question Types**: MCQ, audio tips, spot-the-red-flag, ordering
- **Training Packs**: SMS Essentials, Gift Card Basics, Medicare Protection
- **Smart Reminders**: Daily/weekly notifications based on your needs

## 📋 Evidence Capture System

**Legal-Grade Documentation** (all processed locally):

- **Text Evidence**: SMS, emails, voicemail transcripts
- **Image Evidence**: Screenshots with OCR processing
- **Voice Notes**: Local speech-to-text transcription
- **PII Redaction**: Automatic removal of sensitive information
- **Export Options**: PDF/Text/JSON for banks, police, FTC

## 🔧 Technical Architecture

### Monorepo Structure
```
boomer-buddy/
├── apps/
│   ├── mobile/                 # React Native (TypeScript)
│   ├── ios-extensions/         # Call Directory + SMS Filter
│   └── android-services/       # Call Screening + SMS handlers
├── services/
│   ├── api/                    # Stateless, logless backend
│   └── feeds/                  # Government data aggregation
├── shared/
│   ├── models/                 # TFLite/Core ML bundles
│   ├── contracts/              # OpenAPI specifications
│   └── ui/                     # Design tokens and assets
└── mobile/src/
    ├── services/               # Core business logic
    │   ├── PiiScrubber.ts     # Client-side PII protection
    │   ├── RiskEngine.ts      # On-device threat analysis
    │   ├── TrainingService.ts # Personalized education
    │   └── EvidenceCaptureService.ts # Local evidence management
    └── native/                # Platform-specific integrations
        ├── CallScreeningService.android.ts
        ├── CallDirectoryExtension.ios.ts
        └── SMSFilterExtension.ios.ts
```

### Backend API (Stateless & Logless)

**Privacy-Compliant Endpoints**:
- `GET /v1/model` - Model metadata and signed download URLs
- `GET /v1/feeds.json` - Daily government/org alerts aggregation  
- `GET /v1/numberlist` - Known scam numbers for call blocking
- `POST /v1/analyze` - Feature vector analysis (NO persistence)

**Security Features**:
- No access logs, no request body logging
- Memory-only processing (no disk persistence)
- IP header stripping, strict HTTPS
- Differential privacy metrics (optional)

## 🏛️ Government Data Sources

**Automated Daily Collection** from 15+ verified sources:

**Federal Agencies**:
- FTC Consumer Alerts
- FBI IC3 Public Service Announcements  
- Social Security Administration Blog
- HHS Office of Inspector General
- CISA Cybersecurity Advisories
- SEC Investor Alerts
- CFPB Consumer Financial Protection
- FCC Consumer Guides

**State Attorney Generals**:
- Washington, California, New York, Texas, Florida consumer protection feeds

**Authorized Nonprofits**:
- AARP Fraud Watch Network
- Better Business Bureau Scam Tracker

## 💳 Subscription & Billing

**Privacy-Optimized Billing**:
- **Best Option**: Direct StoreKit 2 (iOS) + Google Play Billing (Android)
- **Alternative**: RevenueCat with anonymous App User ID only
- **Pricing**: $15/month or ~$10/month annual
- **Essential Features**: Basic call protection remains free

## 🚀 Development Setup

### Prerequisites
- Node.js 18+ with React Native environment
- Xcode 15+ for iOS development
- Android Studio with API 31+ for Android
- PostgreSQL for development database

### Quick Start
```bash
# Clone and install dependencies
git clone [repository]
cd boomer-buddy
npm install

# Start backend services
cd services/api && npm run dev
cd services/feeds && npm run collect

# Start mobile development
cd apps/mobile && npx react-native run-ios
# or
npx react-native run-android
```

### Environment Variables
```bash
# Server
MODEL_CDN_BASE=https://cdn.boomerbuddy.net/models/
MODEL_SIGN_KEY=your_signing_key
FEEDS_OUTPUT_BUCKET=s3://feeds-bucket

# Client - none required for privacy
```

## 🧪 Testing Strategy

**Comprehensive Testing**:
- **Unit Tests**: PII scrubber, risk engine, training algorithms
- **Integration Tests**: Native extension bridges, cross-platform flows  
- **E2E Tests**: Submit report → guidance, subscription flows, token import
- **Accessibility**: WCAG 2.1 AA compliance, large fonts, voice-over support

## 📦 Store Submission

**Review Package Ready**:
- Architecture diagram showing zero-PII flow
- "No PII Stored" compliance statement
- Permission justifications for call/SMS access
- Privacy policy for US-only distribution
- Extension descriptions for App Store review

**Privacy Labels**: Target "Data Not Collected" across all categories

## 🔒 Security & Compliance

**Privacy Posture**:
- Zero data collection by design
- Local-only evidence storage with user-controlled backup
- Optional stateless cloud analysis (feature vectors only)
- Hard blocks prevent sensitive data transmission
- Encrypted local storage with user-managed keys

**Compliance Ready**:
- CCPA compliance (California)
- SOC 2 Type II architecture
- Senior-specific protection standards
- US federal privacy guidelines

## 📞 Core Product Features

### Real-Time Protection
- Incoming call risk assessment and blocking
- SMS filtering for unknown senders  
- Live voicemail transcript analysis
- Immediate threat notifications

### Evidence Collection
- One-tap incident reporting
- Multi-modal evidence capture (text, image, audio)
- Local case management with export
- Family sharing of critical incidents (zero-knowledge)

### Education & Training  
- Personalized daily micro-drills
- Risk-based learning adaptation
- Progress tracking and achievements
- Community feed of local threats

### Account & History
- Local encrypted timeline
- Export options for authorities
- Subscription management
- Privacy settings and data controls

## 🎯 Target Outcomes

**For Seniors**:
- Real-time warnings prevent financial loss
- Evidence collection supports law enforcement reporting
- Training builds confidence and awareness
- Family connections provide support network

**For Families**:
- Peace of mind through protection alerts
- Evidence sharing for serious incidents  
- Progress visibility for loved ones
- Professional-grade documentation for authorities

**For Law Enforcement**:
- Higher quality fraud reports with evidence
- Standardized documentation format
- Trend analysis from aggregated data
- Better prosecution support materials

---

## 🤝 Contributing

This project implements a comprehensive specification for senior digital protection. The architecture prioritizes privacy, accessibility, and effectiveness above all other concerns.

**Key Principles**:
1. **Privacy by Design**: Zero-PII architecture is non-negotiable
2. **Senior-First UX**: 30-second interactions, simple language, large fonts
3. **Real-World Impact**: Focus on preventing actual financial harm
4. **Family Integration**: Support networks without compromising independence
5. **Evidence Quality**: Legal-grade documentation for authorities

For technical questions or implementation details, refer to the specification documents in `/docs` or the OpenAPI contract in `/shared/contracts/`.

**License**: MIT  
**Support**: support@boomerbuddy.net  
**Privacy Policy**: https://boomerbuddy.net/privacy