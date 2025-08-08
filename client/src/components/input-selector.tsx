import { Camera, Keyboard, Phone } from "lucide-react";

interface InputSelectorProps {
  onSelectType: (type: string) => void;
}

export default function InputSelector({ onSelectType }: InputSelectorProps) {
  return (
    <section className="mb-12">
      <div className="grid md:grid-cols-3 gap-6">
        <div 
          className="bg-white rounded-xl shadow-md border-2 border-gray-200 hover:border-blue-700 transition-colors cursor-pointer"
          onClick={() => onSelectType('upload')}
        >
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="text-blue-700 w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Upload Screenshot</h3>
            <p className="text-gray-600 text-lg">Upload an image of a suspicious message or email</p>
          </div>
        </div>

        <div 
          className="bg-white rounded-xl shadow-md border-2 border-gray-200 hover:border-blue-700 transition-colors cursor-pointer"
          onClick={() => onSelectType('text')}
        >
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Keyboard className="text-green-600 w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Paste Text</h3>
            <p className="text-gray-600 text-lg">Copy and paste suspicious text or emails</p>
          </div>
        </div>

        <div 
          className="bg-white rounded-xl shadow-md border-2 border-gray-200 hover:border-blue-700 transition-colors cursor-pointer"
          onClick={() => onSelectType('transcript')}
        >
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="text-amber-600 w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Phone Transcript</h3>
            <p className="text-gray-600 text-lg">Share what was said in a suspicious phone call</p>
          </div>
        </div>
      </div>
    </section>
  );
}
