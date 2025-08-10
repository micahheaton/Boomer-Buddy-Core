import { Phone, Globe, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { Contacts } from "@/types/scam-analysis";

interface ContactListProps {
  contacts: Contacts;
}

export default function ContactList({ contacts }: ContactListProps) {
  const [showAllContacts, setShowAllContacts] = useState(false);

  const hasSpecificContacts = contacts.law_enforcement.length > 0 || 
                              contacts.financial.length > 0 || 
                              contacts.state_local.length > 0;
  
  // Federal contacts that are always available
  const federalContacts = [
    {
      organization: "Federal Trade Commission (FTC)",
      phone: "1-877-382-4357",
      website: "reportfraud.ftc.gov",
      description: "Report all types of fraud and get consumer protection guidance",
      when: "for most scam reports"
    },
    {
      organization: "FBI Internet Crime Complaint Center",
      phone: "1-855-292-3937",
      website: "ic3.gov",
      description: "Report internet and cyber crimes",
      when: "for online scams and cyber crimes"
    },
    {
      organization: "Social Security Administration Fraud Hotline",
      phone: "1-800-269-0271",
      website: "oig.ssa.gov",
      description: "Report Social Security-related fraud",
      when: "for Social Security impersonation scams"
    },
    {
      organization: "IRS Tax Fraud Hotline",
      phone: "1-800-908-4490",
      website: "irs.gov/individuals/how-do-you-report-suspected-tax-fraud-activity",
      description: "Report tax-related scams and fraud",
      when: "for IRS or tax-related scams"
    },
    {
      organization: "Medicare Fraud Hotline",
      phone: "1-800-447-8477",
      website: "medicare.gov",
      description: "Report Medicare-related fraud",
      when: "for Medicare or health insurance scams"
    }
  ];

  if (!hasSpecificContacts) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 mb-8">
        <h3 className="text-2xl font-semibold mb-6 flex items-center">
          <Phone className="w-6 h-6 mr-3 text-boomer-teal" />
          Get Help & Report This
        </h3>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Info className="w-6 h-6 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Need immediate help?</h4>
              <p className="text-blue-800">
                Contact the Federal Trade Commission first - they handle all types of scam reports and can provide guidance on next steps.
              </p>
            </div>
          </div>
        </div>

        <ContactCard
          contact={federalContacts[0]}
          isPrimary={true}
        />

        <div className="mt-6">
          <Button
            onClick={() => setShowAllContacts(!showAllContacts)}
            variant="outline"
            className="w-full border-boomer-teal text-boomer-navy hover:bg-boomer-light-teal"
          >
            {showAllContacts ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Show Fewer Options
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Show All Federal Resources
              </>
            )}
          </Button>
          
          {showAllContacts && (
            <div className="mt-4 space-y-4">
              <div className="text-sm text-gray-600 mb-3">
                <strong>When to use each resource:</strong>
              </div>
              {federalContacts.slice(1).map((contact, index) => (
                <ContactCard key={index} contact={contact} isPrimary={false} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-8 mb-8">
      <h3 className="text-2xl font-semibold mb-6 flex items-center">
        <Phone className="w-6 h-6 mr-3 text-boomer-teal" />
        Get Help & Report This
      </h3>

      {/* Financial institutions */}
      {contacts.financial.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-4 text-boomer-navy">Financial Institutions:</h4>
          <div className="space-y-4">
            {contacts.financial.map((contact, index) => (
              <BackendContactCard key={index} contact={contact} isPrimary={true} />
            ))}
          </div>
        </div>
      )}

      {/* Law enforcement - most relevant */}
      {contacts.law_enforcement.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-4 text-boomer-navy">Recommended Reporting:</h4>
          <div className="space-y-4">
            {contacts.law_enforcement.map((contact, index) => (
              <BackendContactCard key={index} contact={contact} isPrimary={true} />
            ))}
          </div>
        </div>
      )}

      {/* State and local contacts */}
      {contacts.state_local.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-4 text-boomer-navy">Local Resources:</h4>
          <div className="space-y-4">
            {contacts.state_local.map((contact, index) => (
              <BackendContactCard key={index} contact={contact} isPrimary={false} />
            ))}
          </div>
        </div>
      )}

      {/* Expandable federal resources */}
      <div className="mt-6">
        <Button
          onClick={() => setShowAllContacts(!showAllContacts)}
          variant="outline"
          className="w-full border-boomer-teal text-boomer-navy hover:bg-boomer-light-teal"
        >
          {showAllContacts ? (
            <>
              <ChevronUp className="w-4 h-4 mr-2" />
              Hide Federal Resources
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-2" />
              Show All Federal Resources
            </>
          )}
        </Button>
        
        {showAllContacts && (
          <div className="mt-4 space-y-4">
            <div className="text-sm text-gray-600 mb-3">
              <strong>Choose the right federal agency for your situation:</strong>
            </div>
            {federalContacts.map((contact, index) => (
              <ContactCard key={index} contact={contact} isPrimary={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ContactCard({ contact, isPrimary }: { contact: any; isPrimary: boolean }) {
  return (
    <div className={`border rounded-lg p-4 ${isPrimary ? 'border-boomer-teal bg-boomer-light-teal' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex justify-between items-start mb-2">
        <h5 className={`font-semibold ${isPrimary ? 'text-boomer-navy' : 'text-gray-900'}`}>
          {contact.organization}
        </h5>
        {isPrimary && (
          <span className="bg-boomer-teal text-white text-xs px-2 py-1 rounded-full">
            RECOMMENDED
          </span>
        )}
      </div>
      
      <p className="text-gray-700 mb-3 text-sm">{contact.description}</p>
      
      <div className="space-y-2">
        {contact.phone && (
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4 text-boomer-teal" />
            <a 
              href={`tel:${contact.phone}`}
              className="text-boomer-navy hover:text-boomer-teal font-medium"
            >
              {contact.phone}
            </a>
          </div>
        )}
        
        {contact.website && (
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-boomer-teal" />
            <a 
              href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-boomer-navy hover:text-boomer-teal font-medium"
            >
              {contact.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
      </div>
      
      {contact.when && (
        <div className="mt-2 text-xs text-gray-600">
          <strong>When to use:</strong> {contact.when}
        </div>
      )}
    </div>
  );
}

function BackendContactCard({ contact, isPrimary }: { contact: { name: string; contact: string; type?: string; state?: string }; isPrimary: boolean }) {
  const isPhone = /^\d{1}-\d{3}-\d{3}-\d{4}$/.test(contact.contact) || /^\(\d{3}\)\s\d{3}-\d{4}$/.test(contact.contact);
  const isWebsite = contact.contact.includes('.') && !contact.contact.includes('@');
  
  return (
    <div className={`border rounded-lg p-4 ${isPrimary ? 'border-boomer-teal bg-boomer-light-teal' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex justify-between items-start mb-2">
        <h5 className={`font-semibold ${isPrimary ? 'text-boomer-navy' : 'text-gray-900'}`}>
          {contact.name}
        </h5>
        {isPrimary && (
          <span className="bg-boomer-teal text-white text-xs px-2 py-1 rounded-full">
            RECOMMENDED
          </span>
        )}
      </div>
      
      {contact.type && (
        <p className="text-gray-600 mb-2 text-sm capitalize">{contact.type}</p>
      )}
      
      <div className="space-y-2">
        {isPhone ? (
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4 text-boomer-teal" />
            <a 
              href={`tel:${contact.contact}`}
              className="text-boomer-navy hover:text-boomer-teal font-medium"
            >
              {contact.contact}
            </a>
          </div>
        ) : isWebsite ? (
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-boomer-teal" />
            <a 
              href={contact.contact.startsWith('http') ? contact.contact : `https://${contact.contact}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-boomer-navy hover:text-boomer-teal font-medium"
            >
              {contact.contact.replace(/^https?:\/\//, '')}
            </a>
          </div>
        ) : (
          <p className="text-gray-700">{contact.contact}</p>
        )}
      </div>
      
      {contact.state && (
        <div className="mt-2 text-xs text-gray-600">
          <strong>State:</strong> {contact.state}
        </div>
      )}
    </div>
  );
}