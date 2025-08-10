# Boomer Buddy Mobile Implementation Plan

## Phase 1: Foundation Infrastructure (Week 1)
### Backend API Extensions
- [ ] Create `/api/mobile/v1/model` endpoint for ML model metadata
- [ ] Create `/api/mobile/v1/feeds` endpoint (mobile-optimized from existing cache)
- [ ] Create `/api/mobile/v1/analyze` stateless analysis endpoint
- [ ] Add mobile schema to existing database (training packs, model versions)

### Mobile App Foundation
- [ ] Initialize React Native project in `mobile/` directory
- [ ] Set up TypeScript, React Query, and state management
- [ ] Create basic navigation structure
- [ ] Implement authentication-optional flow
- [ ] Add core UI components and design system

### Native Extensions Stubs
- [ ] iOS Call Directory Extension (basic structure)
- [ ] iOS SMS Filter Extension (returns .allow for now)
- [ ] Android CallScreeningService (basic warning notifications)
- [ ] Android SMS monitoring setup

## Phase 2: Core Risk Detection (Week 2)
### On-Device Processing
- [ ] Implement PII scrubber with regex patterns
- [ ] Create feature vector extraction system
- [ ] Add local rule engine (keyword/pattern matching)
- [ ] Implement basic ML model runner (placeholder weights initially)

### Risk Warnings
- [ ] Call warning notifications (Android heads-up, iOS labels)
- [ ] SMS warning system
- [ ] Risk scoring and threshold logic
- [ ] Integration with system phone/messaging apps

### Evidence Capture
- [ ] Local case history storage
- [ ] Screenshot/photo capture with OCR
- [ ] Voice note recording and transcription
- [ ] Report submission to backend analysis

## Phase 3: Training & Intelligence (Week 3)
### Training System
- [ ] Quiz profile import via deeplink/code
- [ ] Local training pack storage and management
- [ ] Spaced repetition algorithm (SM-2 lite)
- [ ] 30-second micro-drill UI components
- [ ] Personalized reminder scheduling

### Data Integration
- [ ] Government feed integration from existing backend
- [ ] Real-time alert notifications
- [ ] Local community feed display
- [ ] Integration with existing UnifiedTrendsHeatmap data

### Caregiver Features
- [ ] Anonymous case sharing via expiring tokens
- [ ] Redacted summary generation
- [ ] Emergency contact integration

## Phase 4: Polish & Deployment (Week 4)
### Store Readiness
- [ ] Privacy policy and app store compliance
- [ ] Accessibility improvements (VoiceOver, large fonts)
- [ ] US-only distribution setup
- [ ] Reviewer documentation packet

### Subscriptions
- [ ] StoreKit2/Google Play Billing integration
- [ ] Feature gating for subscription tiers
- [ ] Local receipt validation

### Testing & QA
- [ ] Unit tests for risk engine and PII scrubber
- [ ] Integration tests for native extensions
- [ ] End-to-end testing for report submission flow
- [ ] Performance optimization

## Technical Integration Strategy

### Leveraging Existing Backend
1. **Data Sources**: Use our 61 government sources for mobile feed generation
2. **Cache System**: Extend current cache manager for mobile-optimized responses
3. **Archive System**: Mobile can access historical data through existing archive APIs
4. **Content Validation**: Leverage existing LLM validation for mobile-submitted content

### New Mobile-Specific Components
1. **Stateless Analysis API**: New endpoint that accepts feature vectors only
2. **Training Pack Management**: New database tables for educational content
3. **Mobile Feed Formatter**: Transform existing cached data for mobile consumption
4. **Model Distribution**: CDN-based ML model updates with signature verification

### Privacy-First Architecture
1. **Zero Backend PII**: All sensitive data stays on device
2. **Feature Vector Only**: Cloud analysis uses anonymized signals
3. **Local Storage**: Encrypted SQLite for user data
4. **No Logging**: Stateless server with no access logs

## Success Metrics
- [ ] Call warnings display correctly on both platforms
- [ ] SMS filtering works for unknown senders (iOS) and all messages (Android)
- [ ] Report submission generates accurate risk scores
- [ ] Training system personalizes based on user vulnerabilities
- [ ] Integration with existing web platform data sources
- [ ] App store approval with "Data Not Collected" privacy label

## Risk Mitigation
- Start with stub implementations to prove integration
- Use existing backend data to avoid building separate intelligence systems
- Focus on platform-specific best practices for native integrations
- Maintain strict privacy boundaries to ensure app store approval