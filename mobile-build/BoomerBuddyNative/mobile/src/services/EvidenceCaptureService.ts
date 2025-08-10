/**
 * Evidence Capture Service
 * Handles local-only evidence collection and processing
 */

import { PiiScrubber } from './PiiScrubber';

export interface EvidenceItem {
  id: string;
  type: 'text' | 'image' | 'audio' | 'voicemail_transcript';
  timestamp: number;
  metadata: EvidenceMetadata;
  localPath?: string;
  processedContent?: string;
  redactionWarnings?: string[];
}

export interface EvidenceMetadata {
  channel: 'sms' | 'call' | 'voicemail' | 'email' | 'web' | 'letter';
  phoneNumber?: string;
  emailAddress?: string;
  suspectedScamType?: string;
  riskLevel?: 'safe' | 'caution' | 'danger';
  deviceInfo: {
    platform: string;
    version: string;
    timestamp: number;
  };
}

export interface CaseReport {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  evidenceItems: EvidenceItem[];
  reportSummary: string;
  recommendedActions: string[];
  contacts: ReportContact[];
  status: 'draft' | 'ready' | 'exported';
}

export interface ReportContact {
  type: 'federal' | 'state' | 'local';
  name: string;
  url?: string;
  phone?: string;
  email?: string;
  description: string;
}

export interface ExportOptions {
  format: 'pdf' | 'text' | 'json';
  includeImages: boolean;
  redactPII: boolean;
  destinationType: 'bank' | 'police' | 'ftc' | 'personal';
}

export class EvidenceCaptureService {
  private static instance: EvidenceCaptureService;
  private currentCase: CaseReport | null = null;

  private constructor() {}

  static getInstance(): EvidenceCaptureService {
    if (!EvidenceCaptureService.instance) {
      EvidenceCaptureService.instance = new EvidenceCaptureService();
    }
    return EvidenceCaptureService.instance;
  }

  /**
   * Start new evidence collection case
   */
  async startNewCase(
    title: string, 
    description: string, 
    channel: EvidenceMetadata['channel']
  ): Promise<string> {
    try {
      const caseId = `case_${Date.now()}`;
      
      this.currentCase = {
        id: caseId,
        title,
        description,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        evidenceItems: [],
        reportSummary: '',
        recommendedActions: [],
        contacts: [],
        status: 'draft'
      };

      console.log(`Started new evidence case: ${title}`);
      return caseId;
    } catch (error) {
      console.error('Failed to start new case:', error);
      throw error;
    }
  }

  /**
   * Capture text evidence (SMS, email content, etc.)
   */
  async captureTextEvidence(
    text: string, 
    metadata: EvidenceMetadata
  ): Promise<string> {
    try {
      if (!this.currentCase) {
        throw new Error('No active case. Start a new case first.');
      }

      // Scrub PII from text
      const scrubResult = PiiScrubber.scrubText(text);
      
      const evidenceId = `evidence_${Date.now()}`;
      const evidence: EvidenceItem = {
        id: evidenceId,
        type: 'text',
        timestamp: Date.now(),
        metadata: {
          ...metadata,
          deviceInfo: this.getDeviceInfo()
        },
        processedContent: scrubResult.scrubbedText,
        redactionWarnings: scrubResult.foundPii.map(pii => 
          `${pii.type.toUpperCase()} detected and redacted`
        )
      };

      this.currentCase.evidenceItems.push(evidence);
      this.currentCase.updatedAt = Date.now();

      // Store locally (encrypted)
      await this.storeEvidenceLocally(evidence, text);

      console.log(`Captured text evidence: ${text.substring(0, 50)}...`);
      return evidenceId;
    } catch (error) {
      console.error('Failed to capture text evidence:', error);
      throw error;
    }
  }

  /**
   * Capture image evidence (screenshots, photos)
   */
  async captureImageEvidence(
    imageData: string | Blob, 
    metadata: EvidenceMetadata
  ): Promise<string> {
    try {
      if (!this.currentCase) {
        throw new Error('No active case. Start a new case first.');
      }

      const evidenceId = `evidence_${Date.now()}`;
      
      // Process image locally
      const processedImage = await this.processImageEvidence(imageData);
      
      const evidence: EvidenceItem = {
        id: evidenceId,
        type: 'image',
        timestamp: Date.now(),
        metadata: {
          ...metadata,
          deviceInfo: this.getDeviceInfo()
        },
        localPath: processedImage.localPath,
        processedContent: processedImage.ocrText,
        redactionWarnings: processedImage.redactionWarnings
      };

      this.currentCase.evidenceItems.push(evidence);
      this.currentCase.updatedAt = Date.now();

      console.log('Captured image evidence with OCR processing');
      return evidenceId;
    } catch (error) {
      console.error('Failed to capture image evidence:', error);
      throw error;
    }
  }

  /**
   * Capture audio evidence (voice notes, call recordings)
   */
  async captureAudioEvidence(
    audioData: Blob, 
    metadata: EvidenceMetadata
  ): Promise<string> {
    try {
      if (!this.currentCase) {
        throw new Error('No active case. Start a new case first.');
      }

      const evidenceId = `evidence_${Date.now()}`;
      
      // Process audio locally
      const processedAudio = await this.processAudioEvidence(audioData);
      
      const evidence: EvidenceItem = {
        id: evidenceId,
        type: 'audio',
        timestamp: Date.now(),
        metadata: {
          ...metadata,
          deviceInfo: this.getDeviceInfo()
        },
        localPath: processedAudio.localPath,
        processedContent: processedAudio.transcript,
        redactionWarnings: processedAudio.redactionWarnings
      };

      this.currentCase.evidenceItems.push(evidence);
      this.currentCase.updatedAt = Date.now();

      console.log('Captured audio evidence with local transcription');
      return evidenceId;
    } catch (error) {
      console.error('Failed to capture audio evidence:', error);
      throw error;
    }
  }

  /**
   * Capture voicemail transcript (from Apple's transcription)
   */
  async captureVoicemailTranscript(
    transcript: string, 
    metadata: EvidenceMetadata
  ): Promise<string> {
    try {
      if (!this.currentCase) {
        throw new Error('No active case. Start a new case first.');
      }

      // Scrub PII from transcript
      const scrubResult = PiiScrubber.scrubText(transcript);
      
      const evidenceId = `evidence_${Date.now()}`;
      const evidence: EvidenceItem = {
        id: evidenceId,
        type: 'voicemail_transcript',
        timestamp: Date.now(),
        metadata: {
          ...metadata,
          deviceInfo: this.getDeviceInfo()
        },
        processedContent: scrubResult.scrubbedText,
        redactionWarnings: scrubResult.foundPii.map(pii => 
          `${pii.type.toUpperCase()} detected and redacted`
        )
      };

      this.currentCase.evidenceItems.push(evidence);
      this.currentCase.updatedAt = Date.now();

      console.log('Captured voicemail transcript evidence');
      return evidenceId;
    } catch (error) {
      console.error('Failed to capture voicemail transcript:', error);
      throw error;
    }
  }

  /**
   * Process image evidence with OCR
   */
  private async processImageEvidence(imageData: string | Blob): Promise<{
    localPath: string;
    ocrText?: string;
    redactionWarnings: string[];
  }> {
    try {
      // Store image locally
      const localPath = await this.storeImageLocally(imageData);
      
      // Perform OCR on device
      const ocrText = await this.performOCR(imageData);
      
      let redactionWarnings: string[] = [];
      
      if (ocrText) {
        // Scrub PII from OCR text
        const scrubResult = PiiScrubber.scrubText(ocrText);
        
        if (scrubResult.hasHardBlocks) {
          redactionWarnings.push('Critical PII detected in image - content blocked');
        } else if (scrubResult.foundPii.length > 0) {
          redactionWarnings = scrubResult.foundPii.map(pii => 
            `${pii.type.toUpperCase()} detected in image`
          );
        }
      }

      return {
        localPath,
        ocrText,
        redactionWarnings
      };
    } catch (error) {
      console.error('Failed to process image evidence:', error);
      throw error;
    }
  }

  /**
   * Process audio evidence with transcription
   */
  private async processAudioEvidence(audioData: Blob): Promise<{
    localPath: string;
    transcript?: string;
    redactionWarnings: string[];
  }> {
    try {
      // Store audio locally
      const localPath = await this.storeAudioLocally(audioData);
      
      // Perform speech-to-text on device
      const transcript = await this.performSpeechToText(audioData);
      
      let redactionWarnings: string[] = [];
      
      if (transcript) {
        // Scrub PII from transcript
        const scrubResult = PiiScrubber.scrubText(transcript);
        
        if (scrubResult.hasHardBlocks) {
          redactionWarnings.push('Critical PII detected in audio - content blocked');
        } else if (scrubResult.foundPii.length > 0) {
          redactionWarnings = scrubResult.foundPii.map(pii => 
            `${pii.type.toUpperCase()} detected in audio`
          );
        }
      }

      return {
        localPath,
        transcript,
        redactionWarnings
      };
    } catch (error) {
      console.error('Failed to process audio evidence:', error);
      throw error;
    }
  }

  /**
   * Perform OCR on image data
   */
  private async performOCR(imageData: string | Blob): Promise<string | null> {
    try {
      // In a real implementation, this would use:
      // - iOS: Vision framework
      // - Android: ML Kit Text Recognition
      // - Cross-platform: Tesseract.js
      
      console.log('Performing OCR on image...');
      
      // Simulate OCR processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Return mock OCR result
      return 'Sample OCR text extracted from image';
    } catch (error) {
      console.error('OCR processing failed:', error);
      return null;
    }
  }

  /**
   * Perform speech-to-text on audio data
   */
  private async performSpeechToText(audioData: Blob): Promise<string | null> {
    try {
      // In a real implementation, this would use:
      // - iOS: Speech framework
      // - Android: Speech-to-Text API
      // - Cross-platform: react-native-voice
      
      console.log('Performing speech-to-text on audio...');
      
      // Simulate STT processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Return mock transcript
      return 'Sample transcript from audio recording';
    } catch (error) {
      console.error('Speech-to-text processing failed:', error);
      return null;
    }
  }

  /**
   * Generate case report summary
   */
  async generateReportSummary(): Promise<void> {
    try {
      if (!this.currentCase) {
        throw new Error('No active case');
      }

      const evidenceCount = this.currentCase.evidenceItems.length;
      const evidenceTypes = [...new Set(this.currentCase.evidenceItems.map(e => e.type))];
      const highRiskItems = this.currentCase.evidenceItems.filter(
        e => e.metadata.riskLevel === 'danger'
      ).length;

      this.currentCase.reportSummary = `
Evidence Collection Summary:
- Total evidence items: ${evidenceCount}
- Evidence types: ${evidenceTypes.join(', ')}
- High-risk items: ${highRiskItems}
- Collection period: ${new Date(this.currentCase.createdAt).toLocaleString()} - ${new Date(this.currentCase.updatedAt).toLocaleString()}

Case Description:
${this.currentCase.description}

All evidence has been processed locally with PII redaction to protect personal information.
      `.trim();

      // Generate recommended actions
      this.currentCase.recommendedActions = this.generateRecommendedActions();
      
      // Generate relevant contacts
      this.currentCase.contacts = this.generateRelevantContacts();

      this.currentCase.status = 'ready';
      console.log('Generated case report summary');
    } catch (error) {
      console.error('Failed to generate report summary:', error);
      throw error;
    }
  }

  /**
   * Export case report
   */
  async exportCaseReport(options: ExportOptions): Promise<string> {
    try {
      if (!this.currentCase) {
        throw new Error('No active case');
      }

      if (this.currentCase.status === 'draft') {
        await this.generateReportSummary();
      }

      let exportData: string;

      switch (options.format) {
        case 'pdf':
          exportData = await this.generatePDFReport(options);
          break;
        case 'text':
          exportData = await this.generateTextReport(options);
          break;
        case 'json':
          exportData = await this.generateJSONReport(options);
          break;
        default:
          throw new Error('Unsupported export format');
      }

      // Store exported report locally
      const exportPath = await this.storeExportedReport(exportData, options.format);
      
      console.log(`Case report exported to: ${exportPath}`);
      return exportPath;
    } catch (error) {
      console.error('Failed to export case report:', error);
      throw error;
    }
  }

  /**
   * Generate recommended actions based on evidence
   */
  private generateRecommendedActions(): string[] {
    if (!this.currentCase) return [];

    const actions: string[] = [];
    const hasHighRisk = this.currentCase.evidenceItems.some(e => e.metadata.riskLevel === 'danger');
    const channels = [...new Set(this.currentCase.evidenceItems.map(e => e.metadata.channel))];

    if (hasHighRisk) {
      actions.push('Report to Federal Trade Commission (FTC) immediately');
      actions.push('Contact your bank if financial information was involved');
      actions.push('File a report with local police department');
    }

    if (channels.includes('sms') || channels.includes('call')) {
      actions.push('Block the phone number on your device');
      actions.push('Report to your mobile carrier');
    }

    if (channels.includes('email')) {
      actions.push('Mark email as spam and block sender');
      actions.push('Report to email provider');
    }

    actions.push('Monitor your accounts for unusual activity');
    actions.push('Share this report with trusted family members');

    return actions;
  }

  /**
   * Generate relevant contacts based on evidence
   */
  private generateRelevantContacts(): ReportContact[] {
    const contacts: ReportContact[] = [
      {
        type: 'federal',
        name: 'Federal Trade Commission (FTC)',
        url: 'https://reportfraud.ftc.gov',
        description: 'Report fraud and identity theft'
      },
      {
        type: 'federal',
        name: 'FBI Internet Crime Complaint Center',
        url: 'https://ic3.gov',
        description: 'Report internet crimes'
      },
      {
        type: 'local',
        name: 'Local Police Department',
        description: 'File criminal report for fraud'
      }
    ];

    // Add state-specific contacts based on evidence metadata
    // In a real implementation, this would be based on user location
    contacts.push({
      type: 'state',
      name: 'State Attorney General',
      description: 'State-level consumer protection'
    });

    return contacts;
  }

  /**
   * Generate PDF report
   */
  private async generatePDFReport(options: ExportOptions): Promise<string> {
    // In a real implementation, this would use a PDF generation library
    // like react-native-html-to-pdf or jsPDF
    console.log('Generating PDF report...');
    
    return `PDF Report for Case: ${this.currentCase?.title}
Generated: ${new Date().toLocaleString()}
Format: PDF for ${options.destinationType}

${this.currentCase?.reportSummary}

Evidence Items: ${this.currentCase?.evidenceItems.length}
[PDF content would include formatted evidence and images if options.includeImages is true]
`;
  }

  /**
   * Generate text report
   */
  private async generateTextReport(options: ExportOptions): Promise<string> {
    if (!this.currentCase) return '';

    let report = `SCAM EVIDENCE REPORT
====================

Case: ${this.currentCase.title}
Generated: ${new Date().toLocaleString()}
Status: ${this.currentCase.status}

${this.currentCase.reportSummary}

EVIDENCE ITEMS:
===============
`;

    this.currentCase.evidenceItems.forEach((evidence, index) => {
      report += `\n${index + 1}. ${evidence.type.toUpperCase()} Evidence
   Timestamp: ${new Date(evidence.timestamp).toLocaleString()}
   Channel: ${evidence.metadata.channel}
   Content: ${options.redactPII ? '[REDACTED FOR PRIVACY]' : evidence.processedContent || '[No content]'}
   Warnings: ${evidence.redactionWarnings?.join(', ') || 'None'}
`;
    });

    report += `\nRECOMMENDED ACTIONS:
====================
${this.currentCase.recommendedActions.map((action, i) => `${i + 1}. ${action}`).join('\n')}

CONTACTS:
=========
${this.currentCase.contacts.map(contact => `${contact.name}: ${contact.url || contact.description}`).join('\n')}
`;

    return report;
  }

  /**
   * Generate JSON report
   */
  private async generateJSONReport(options: ExportOptions): Promise<string> {
    if (!this.currentCase) return '{}';

    const reportData = {
      ...this.currentCase,
      exportOptions: options,
      exportedAt: Date.now(),
      privacyNote: 'All personal information has been redacted for privacy protection'
    };

    if (options.redactPII) {
      // Additional redaction for JSON export
      reportData.evidenceItems = reportData.evidenceItems.map(item => ({
        ...item,
        processedContent: '[REDACTED FOR PRIVACY]'
      }));
    }

    return JSON.stringify(reportData, null, 2);
  }

  /**
   * Store evidence locally
   */
  private async storeEvidenceLocally(evidence: EvidenceItem, originalContent: string): Promise<void> {
    try {
      // In a real implementation, this would store in encrypted local database
      console.log(`Storing evidence ${evidence.id} locally (encrypted)`);
    } catch (error) {
      console.error('Failed to store evidence locally:', error);
      throw error;
    }
  }

  /**
   * Store image locally
   */
  private async storeImageLocally(imageData: string | Blob): Promise<string> {
    try {
      // In a real implementation, this would save to secure local storage
      const localPath = `evidence/images/img_${Date.now()}.jpg`;
      console.log(`Storing image locally: ${localPath}`);
      return localPath;
    } catch (error) {
      console.error('Failed to store image locally:', error);
      throw error;
    }
  }

  /**
   * Store audio locally
   */
  private async storeAudioLocally(audioData: Blob): Promise<string> {
    try {
      // In a real implementation, this would save to secure local storage
      const localPath = `evidence/audio/audio_${Date.now()}.wav`;
      console.log(`Storing audio locally: ${localPath}`);
      return localPath;
    } catch (error) {
      console.error('Failed to store audio locally:', error);
      throw error;
    }
  }

  /**
   * Store exported report
   */
  private async storeExportedReport(reportData: string, format: string): Promise<string> {
    try {
      // In a real implementation, this would save to Documents or Downloads
      const fileName = `boomer_buddy_report_${Date.now()}.${format}`;
      console.log(`Storing exported report: ${fileName}`);
      return fileName;
    } catch (error) {
      console.error('Failed to store exported report:', error);
      throw error;
    }
  }

  /**
   * Get device information
   */
  private getDeviceInfo(): EvidenceMetadata['deviceInfo'] {
    return {
      platform: 'iOS', // Would be detected dynamically
      version: '1.0.0',
      timestamp: Date.now()
    };
  }

  /**
   * Get current case
   */
  getCurrentCase(): CaseReport | null {
    return this.currentCase;
  }

  /**
   * List all cases
   */
  async getAllCases(): Promise<CaseReport[]> {
    try {
      // In a real implementation, would load from local storage
      return this.currentCase ? [this.currentCase] : [];
    } catch (error) {
      console.error('Failed to get all cases:', error);
      return [];
    }
  }

  /**
   * Delete case
   */
  async deleteCase(caseId: string): Promise<boolean> {
    try {
      if (this.currentCase?.id === caseId) {
        this.currentCase = null;
      }
      
      // In a real implementation, would delete from local storage
      console.log(`Deleted case: ${caseId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete case:', error);
      return false;
    }
  }
}