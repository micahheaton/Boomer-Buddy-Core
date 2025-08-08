import { Copy, Phone, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Contact {
  name: string;
  contact: string;
  type?: string;
  state?: string;
}

interface Contacts {
  law_enforcement: Contact[];
  financial: Contact[];
  state_local: Contact[];
}

interface ContactListProps {
  contacts: Contacts;
}

export default function ContactList({ contacts }: ContactListProps) {
  const { toast } = useToast();

  const handleCopyContact = (contact: string) => {
    navigator.clipboard.writeText(contact).then(() => {
      toast({
        title: "Contact copied",
        description: "Contact information has been copied to your clipboard.",
      });
    }).catch(() => {
      toast({
        title: "Copy failed",
        description: "Failed to copy contact information.",
        variant: "destructive",
      });
    });
  };

  const isPhone = (contact: string) => {
    return contact.includes("(") || contact.includes("-") || contact.match(/^\d/);
  };

  const isUrl = (contact: string) => {
    return contact.includes(".") && !isPhone(contact);
  };

  const formatPhoneForCall = (phone: string) => {
    return `tel:${phone.replace(/[^\d]/g, '')}`;
  };

  const ContactCard = ({ contact }: { contact: Contact }) => (
    <div className="border border-gray-300 rounded-lg p-4 mb-3">
      <div className="font-medium text-lg">{contact.name}</div>
      {contact.type && (
        <div className="text-gray-600 mb-2 capitalize">{contact.type}</div>
      )}
      {contact.state && (
        <div className="text-gray-600 mb-2">{contact.state}</div>
      )}
      <div className="flex items-center space-x-2">
        {isPhone(contact.contact) ? (
          <a 
            href={formatPhoneForCall(contact.contact)}
            className="text-blue-700 hover:underline flex items-center"
          >
            <Phone className="w-4 h-4 mr-1" />
            {contact.contact}
          </a>
        ) : isUrl(contact.contact) ? (
          <a 
            href={contact.contact.startsWith('http') ? contact.contact : `https://${contact.contact}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 hover:underline flex items-center"
          >
            <Globe className="w-4 h-4 mr-1" />
            {contact.contact}
          </a>
        ) : (
          <span className="text-blue-700">{contact.contact}</span>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleCopyContact(contact.contact)}
          className="px-3 py-1 h-auto"
        >
          <Copy className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-md p-8 mb-8">
      <h3 className="text-2xl font-semibold mb-6 flex items-center">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
          <Phone className="text-green-600 w-5 h-5" />
        </div>
        Important Contact Numbers
      </h3>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Federal Agencies */}
        <div>
          <h4 className="text-lg font-semibold mb-4 text-blue-700">Federal Agencies</h4>
          {contacts.law_enforcement.map((contact, index) => (
            <ContactCard key={index} contact={contact} />
          ))}
        </div>

        {/* Financial Institutions */}
        <div>
          <h4 className="text-lg font-semibold mb-4 text-green-600">Financial</h4>
          {contacts.financial.map((contact, index) => (
            <ContactCard key={index} contact={contact} />
          ))}
        </div>

        {/* State & Local */}
        <div>
          <h4 className="text-lg font-semibold mb-4 text-amber-600">State & Local</h4>
          {contacts.state_local.map((contact, index) => (
            <ContactCard key={index} contact={contact} />
          ))}
        </div>
      </div>
    </div>
  );
}
