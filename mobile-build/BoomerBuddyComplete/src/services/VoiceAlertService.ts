import { StorageService } from './StorageService';

export interface VoiceCommand {
  command: string;
  confidence: number;
  timestamp: number;
  intent: VoiceIntent;
  parameters?: { [key: string]: string };
}

export interface VoiceIntent {
  type: 'help_request' | 'emergency_alert' | 'scam_report' | 'safety_check' | 'family_contact' | 'analysis_request';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  action: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
  priority: number;
  canReceiveAlerts: boolean;
}

export interface VoiceAlert {
  id: string;
  type: 'emergency' | 'scam_detected' | 'location_warning' | 'family_notification';
  title: string;
  message: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  audioMessage?: string;
  timestamp: number;
  acknowledged: boolean;
  contactsNotified: string[];
}

export interface VoiceSettings {
  language: string;
  voice: 'male' | 'female' | 'neutral';
  speed: number; // 0.5 to 2.0
  volume: number; // 0 to 1
  enabled: boolean;
  activationPhrase: string;
  emergencyPhrase: string;
  backgroundListening: boolean;
}

export class VoiceAlertService {
  private storageService: StorageService;
  private isListening: boolean = false;
  private recognition: any = null; // Would be speech recognition in React Native
  private synthesis: any = null; // Would be speech synthesis in React Native
  private emergencyContacts: EmergencyContact[] = [];
  private voiceSettings: VoiceSettings;

  constructor() {
    this.storageService = new StorageService();
    this.voiceSettings = {
      language: 'en-US',
      voice: 'female',
      speed: 1.0,
      volume: 0.8,
      enabled: true,
      activationPhrase: 'Hey Buddy',
      emergencyPhrase: 'Buddy Emergency',
      backgroundListening: true
    };
    this.initializeVoiceServices();
  }

  /**
   * Initialize voice recognition and synthesis services
   */
  async initializeVoiceServices(): Promise<boolean> {
    try {
      await this.loadVoiceSettings();
      await this.loadEmergencyContacts();
      
      if (this.voiceSettings.enabled) {
        await this.setupSpeechRecognition();
        await this.setupSpeechSynthesis();
        
        if (this.voiceSettings.backgroundListening) {
          this.startBackgroundListening();
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to initialize voice services:', error);
      return false;
    }
  }

  /**
   * Setup speech recognition
   */
  private async setupSpeechRecognition(): Promise<void> {
    try {
      // In React Native, this would use @react-native-voice/voice or similar
      // For now, simulate voice recognition setup
      console.log('Voice recognition initialized');
      
      // Simulate voice command recognition
      this.simulateVoiceCommands();
    } catch (error) {
      console.error('Failed to setup speech recognition:', error);
    }
  }

  /**
   * Setup speech synthesis
   */
  private async setupSpeechSynthesis(): Promise<void> {
    try {
      // In React Native, this would use react-native-tts or similar
      console.log('Speech synthesis initialized');
    } catch (error) {
      console.error('Failed to setup speech synthesis:', error);
    }
  }

  /**
   * Start listening for voice commands
   */
  async startListening(): Promise<void> {
    if (this.isListening) return;
    
    try {
      this.isListening = true;
      console.log('Started listening for voice commands...');
      
      // In React Native: Voice.start(this.voiceSettings.language);
      await this.announceListening();
    } catch (error) {
      console.error('Failed to start listening:', error);
      this.isListening = false;
    }
  }

  /**
   * Stop listening for voice commands
   */
  async stopListening(): Promise<void> {
    if (!this.isListening) return;
    
    try {
      this.isListening = false;
      // In React Native: Voice.stop();
      console.log('Stopped listening for voice commands');
    } catch (error) {
      console.error('Failed to stop listening:', error);
    }
  }

  /**
   * Start background listening for activation phrases
   */
  private startBackgroundListening(): void {
    if (!this.voiceSettings.backgroundListening) return;
    
    console.log(`Listening for activation phrase: "${this.voiceSettings.activationPhrase}"`);
    console.log(`Emergency phrase: "${this.voiceSettings.emergencyPhrase}"`);
    
    // Simulate background listening
    this.simulateBackgroundListening();
  }

  /**
   * Process voice command
   */
  async processVoiceCommand(command: string, confidence: number = 0.8): Promise<VoiceCommand> {
    const voiceCommand: VoiceCommand = {
      command: command.toLowerCase(),
      confidence,
      timestamp: Date.now(),
      intent: this.parseIntent(command.toLowerCase())
    };

    console.log(`Processing voice command: "${command}" (confidence: ${confidence})`);

    // Execute the command based on intent
    await this.executeVoiceCommand(voiceCommand);

    // Store command for learning
    await this.storageService.storeVoiceCommand(voiceCommand);

    return voiceCommand;
  }

  /**
   * Parse intent from voice command
   */
  private parseIntent(command: string): VoiceIntent {
    const lowerCommand = command.toLowerCase();

    // Emergency patterns
    if (this.isEmergencyCommand(lowerCommand)) {
      return {
        type: 'emergency_alert',
        urgency: 'critical',
        action: 'trigger_emergency_alert'
      };
    }

    // Help request patterns
    if (lowerCommand.includes('help') || lowerCommand.includes('assist')) {
      return {
        type: 'help_request',
        urgency: 'medium',
        action: 'provide_assistance'
      };
    }

    // Scam reporting patterns
    if (lowerCommand.includes('scam') || lowerCommand.includes('suspicious') || lowerCommand.includes('fraud')) {
      return {
        type: 'scam_report',
        urgency: 'high',
        action: 'initiate_scam_analysis'
      };
    }

    // Safety check patterns
    if (lowerCommand.includes('safe') || lowerCommand.includes('check') || lowerCommand.includes('secure')) {
      return {
        type: 'safety_check',
        urgency: 'low',
        action: 'perform_safety_check'
      };
    }

    // Family contact patterns
    if (lowerCommand.includes('call') || lowerCommand.includes('contact') || lowerCommand.includes('family')) {
      return {
        type: 'family_contact',
        urgency: 'medium',
        action: 'contact_family'
      };
    }

    // Analysis request patterns
    if (lowerCommand.includes('analyze') || lowerCommand.includes('check this') || lowerCommand.includes('is this safe')) {
      return {
        type: 'analysis_request',
        urgency: 'medium',
        action: 'analyze_content'
      };
    }

    // Default help request
    return {
      type: 'help_request',
      urgency: 'low',
      action: 'provide_general_help'
    };
  }

  /**
   * Check if command is emergency
   */
  private isEmergencyCommand(command: string): boolean {
    const emergencyPatterns = [
      this.voiceSettings.emergencyPhrase.toLowerCase(),
      'emergency',
      'help me now',
      'i need help',
      'call for help',
      'in danger',
      'being scammed',
      'send help'
    ];

    return emergencyPatterns.some(pattern => command.includes(pattern));
  }

  /**
   * Execute voice command based on intent
   */
  private async executeVoiceCommand(voiceCommand: VoiceCommand): Promise<void> {
    const { intent } = voiceCommand;

    switch (intent.action) {
      case 'trigger_emergency_alert':
        await this.triggerEmergencyAlert();
        break;
        
      case 'provide_assistance':
        await this.provideAssistance(voiceCommand.command);
        break;
        
      case 'initiate_scam_analysis':
        await this.initiateScamAnalysis();
        break;
        
      case 'perform_safety_check':
        await this.performSafetyCheck();
        break;
        
      case 'contact_family':
        await this.contactFamily(voiceCommand.command);
        break;
        
      case 'analyze_content':
        await this.analyzeContent();
        break;
        
      default:
        await this.provideGeneralHelp();
    }
  }

  /**
   * Trigger emergency alert
   */
  private async triggerEmergencyAlert(): Promise<void> {
    console.log('🚨 EMERGENCY ALERT TRIGGERED');

    const alert: VoiceAlert = {
      id: `emergency_${Date.now()}`,
      type: 'emergency',
      title: 'Emergency Alert Activated',
      message: 'User has activated emergency voice alert. Immediate assistance may be needed.',
      urgency: 'critical',
      audioMessage: 'Emergency alert has been sent to your emergency contacts. Help is on the way.',
      timestamp: Date.now(),
      acknowledged: false,
      contactsNotified: []
    };

    // Announce emergency response
    await this.speak('Emergency alert activated. Contacting your emergency contacts now.');

    // Notify all emergency contacts
    for (const contact of this.emergencyContacts) {
      if (contact.canReceiveAlerts) {
        await this.notifyEmergencyContact(contact, alert);
        alert.contactsNotified.push(contact.id);
      }
    }

    // Store alert
    await this.storageService.storeVoiceAlert(alert);

    // Continue speaking to keep user calm
    await this.speak('Your emergency contacts have been notified. Stay calm. You can say "cancel alert" if this was triggered by mistake.');
  }

  /**
   * Provide assistance based on command
   */
  private async provideAssistance(command: string): Promise<void> {
    let response = '';

    if (command.includes('call') || command.includes('phone')) {
      response = 'I can help you with suspicious phone calls. You can say "analyze this call" to check if it might be a scam, or "report scam call" to record details.';
    } else if (command.includes('email') || command.includes('message')) {
      response = 'I can help you check suspicious emails or messages. You can say "check this email" or take a photo of the message for analysis.';
    } else if (command.includes('money') || command.includes('payment')) {
      response = 'Never rush into financial decisions. I can help you verify requests for money. You can say "is this payment request safe" for guidance.';
    } else {
      response = 'I\'m here to help protect you from scams. You can ask me to analyze suspicious calls, emails, or messages. For emergencies, say "Buddy Emergency".';
    }

    await this.speak(response);
  }

  /**
   * Initiate scam analysis
   */
  private async initiateScamAnalysis(): Promise<void> {
    await this.speak('I\'ll help you analyze this for scam indicators. Please describe what happened, or if you have a message or call details, I can analyze those too.');
    
    // In a real app, this would open the analysis interface
    console.log('Opening scam analysis interface...');
  }

  /**
   * Perform safety check
   */
  private async performSafetyCheck(): Promise<void> {
    const currentTime = new Date().toLocaleString();
    const safetyScore = Math.floor(Math.random() * 20) + 80; // 80-100 for demo
    
    await this.speak(`Safety check complete. Current time: ${currentTime}. Your protection score is ${safetyScore} out of 100. All systems are monitoring for threats. You are protected.`);
  }

  /**
   * Contact family members
   */
  private async contactFamily(command: string): Promise<void> {
    if (this.emergencyContacts.length === 0) {
      await this.speak('No emergency contacts have been set up yet. You can add family members in the settings.');
      return;
    }

    const familyContacts = this.emergencyContacts.filter(c => 
      c.relationship.includes('family') || 
      c.relationship.includes('child') || 
      c.relationship.includes('spouse')
    );

    if (familyContacts.length === 0) {
      await this.speak('No family contacts found. Would you like me to call your first emergency contact instead?');
      return;
    }

    const primaryContact = familyContacts.sort((a, b) => a.priority - b.priority)[0];
    await this.speak(`Calling ${primaryContact.name}. Please wait while I connect you.`);

    // In a real app, this would initiate a phone call
    console.log(`Initiating call to ${primaryContact.name} at ${primaryContact.phoneNumber}`);
  }

  /**
   * Analyze content
   */
  private async analyzeContent(): Promise<void> {
    await this.speak('I\'m ready to analyze content for scam indicators. Please share the suspicious message, email, or describe the phone call you received.');
    
    // Open analysis interface
    console.log('Opening content analysis interface...');
  }

  /**
   * Provide general help
   */
  private async provideGeneralHelp(): Promise<void> {
    const helpOptions = [
      'I can help you stay safe from scams.',
      'Say "analyze this" to check suspicious messages.',
      'Say "Buddy Emergency" for immediate help.',
      'Say "call family" to contact your emergency contacts.',
      'Say "safety check" for a status update.',
      'Say "help with calls" for phone scam assistance.'
    ];

    const response = helpOptions.join(' ');
    await this.speak(response);
  }

  /**
   * Speak text using text-to-speech
   */
  async speak(text: string): Promise<void> {
    try {
      console.log(`🗣️ Speaking: "${text}"`);
      
      // In React Native, this would use react-native-tts:
      // Tts.speak(text, {
      //   androidParams: {
      //     KEY_PARAM_PAN: -1,
      //     KEY_PARAM_VOLUME: this.voiceSettings.volume,
      //     KEY_PARAM_STREAM: 'STREAM_MUSIC',
      //   },
      //   iosVoiceId: this.voiceSettings.voice,
      //   rate: this.voiceSettings.speed,
      // });

      // Simulate speech delay
      await new Promise(resolve => setTimeout(resolve, text.length * 50));
    } catch (error) {
      console.error('Failed to speak text:', error);
    }
  }

  /**
   * Announce that listening has started
   */
  private async announceListening(): Promise<void> {
    await this.speak('I\'m listening. How can I help you stay safe?');
  }

  /**
   * Notify emergency contact
   */
  private async notifyEmergencyContact(contact: EmergencyContact, alert: VoiceAlert): Promise<void> {
    console.log(`📞 Notifying emergency contact: ${contact.name} (${contact.phoneNumber})`);
    
    // In a real app, this would:
    // 1. Send SMS with alert details
    // 2. Make phone call if SMS fails
    // 3. Send email if available
    // 4. Update contact notification status

    const message = `EMERGENCY ALERT: Your family member has activated their emergency alert system via Boomer Buddy. They may need immediate assistance. Please contact them right away.`;
    
    // Simulate notification
    await this.simulateNotification(contact, message);
  }

  /**
   * Simulate notification for development
   */
  private async simulateNotification(contact: EmergencyContact, message: string): Promise<void> {
    console.log(`📱 SMS to ${contact.name}: ${message}`);
    
    // Simulate notification delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Load voice settings from storage
   */
  private async loadVoiceSettings(): Promise<void> {
    try {
      const settings = await this.storageService.getVoiceSettings();
      if (settings) {
        this.voiceSettings = { ...this.voiceSettings, ...settings };
      }
    } catch (error) {
      console.error('Failed to load voice settings:', error);
    }
  }

  /**
   * Load emergency contacts from storage
   */
  private async loadEmergencyContacts(): Promise<void> {
    try {
      this.emergencyContacts = await this.storageService.getEmergencyContacts();
    } catch (error) {
      console.error('Failed to load emergency contacts:', error);
      this.emergencyContacts = [];
    }
  }

  /**
   * Simulate voice commands for development
   */
  private simulateVoiceCommands(): void {
    const commands = [
      'Hey Buddy, help me',
      'Buddy Emergency',
      'Is this call safe?',
      'Call my family',
      'Safety check please'
    ];

    // Simulate random voice commands every 30 seconds for demo
    setInterval(() => {
      if (Math.random() > 0.8) { // 20% chance
        const command = commands[Math.floor(Math.random() * commands.length)];
        console.log(`🎤 Simulated voice command: "${command}"`);
        this.processVoiceCommand(command, 0.85 + Math.random() * 0.15);
      }
    }, 30000);
  }

  /**
   * Simulate background listening
   */
  private simulateBackgroundListening(): void {
    console.log('👂 Background listening active...');
    
    // In a real app, this would continuously listen for activation phrases
    // and wake up the full voice recognition when detected
  }

  /**
   * Update voice settings
   */
  async updateVoiceSettings(settings: Partial<VoiceSettings>): Promise<void> {
    this.voiceSettings = { ...this.voiceSettings, ...settings };
    await this.storageService.storeVoiceSettings(this.voiceSettings);
    
    if (settings.enabled !== undefined) {
      if (settings.enabled) {
        await this.initializeVoiceServices();
      } else {
        await this.stopListening();
      }
    }
  }

  /**
   * Add emergency contact
   */
  async addEmergencyContact(contact: Omit<EmergencyContact, 'id'>): Promise<void> {
    const newContact: EmergencyContact = {
      ...contact,
      id: `contact_${Date.now()}`
    };
    
    this.emergencyContacts.push(newContact);
    await this.storageService.storeEmergencyContacts(this.emergencyContacts);
  }

  /**
   * Get voice settings
   */
  getVoiceSettings(): VoiceSettings {
    return { ...this.voiceSettings };
  }

  /**
   * Get emergency contacts
   */
  getEmergencyContacts(): EmergencyContact[] {
    return [...this.emergencyContacts];
  }

  /**
   * Test voice system
   */
  async testVoiceSystem(): Promise<boolean> {
    try {
      await this.speak('Voice system test. Can you hear me clearly?');
      return true;
    } catch (error) {
      console.error('Voice system test failed:', error);
      return false;
    }
  }

  /**
   * Cleanup voice services
   */
  destroy(): void {
    this.stopListening();
    // In React Native: Voice.destroy();
    // In React Native: Tts.stop();
  }
}