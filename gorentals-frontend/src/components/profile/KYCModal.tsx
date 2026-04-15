'use client';

import { useState } from 'react';
import { X, Shield, CheckCircle, AlertCircle, Upload, Loader2, CreditCard, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { submitKYC } from '@/services/user';
import { uploadFile } from '@/services/storage';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface KYCModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KYCModal({ isOpen, onClose }: KYCModalProps) {
  const { updateUser } = useAuth();
  const [docType, setDocType] = useState<'aadhaar' | 'pan' | 'passport'>('aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idNumber.trim()) {
      toast.error('Please enter your ID number.');
      return;
    }
    if (!file) {
      toast.error('Please upload an ID document.');
      return;
    }

    setIsSubmitting(true);
    try {
      const fileName = `${docType}-${Date.now()}-${file.name}`;
      const documentUrl = await uploadFile(file, 'kyc-documents', fileName);

      const updated = await submitKYC({
        documentType: docType.toUpperCase(),
        idNumber: idNumber,
        documentUrl: documentUrl,
      });
      updateUser(updated);
      setStep(2);
      toast.success('KYC documents submitted successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit KYC. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#251913]/90 backdrop-blur-md">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden ring-1 ring-[#f97316]/10">
        {step === 1 ? (
          <div className="p-8">
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-[#8c7164]" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#ecfdf5] rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#10b981]" />
              </div>
              <h2 className="text-2xl font-display font-black text-[#251913]">Trust & Verification</h2>
            </div>

            <p className="text-[#8c7164] font-medium mb-8">
              Verify your identity to unlock higher rental limits and premium listings. Your data is encrypted and secure.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'aadhaar', label: 'Aadhaar', icon: CreditCard },
                  { id: 'pan',     label: 'PAN',     icon: User },
                  { id: 'passport', label: 'Passport', icon: FileText },
                ].map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setDocType(doc.id as any)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      docType === doc.id 
                        ? 'border-[#f97316] bg-[#f97316]/5' 
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <doc.icon className={`w-6 h-6 ${docType === doc.id ? 'text-[#f97316]' : 'text-[#8c7164]'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-wider ${
                      docType === doc.id ? 'text-[#f97316]' : 'text-[#8c7164]'
                    }`}>
                      {doc.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-[#251913] uppercase tracking-wider ml-1">
                  {docType.charAt(0).toUpperCase() + docType.slice(1)} Number
                </label>
                <Input
                  required
                  placeholder={`Enter 12-digit number`}
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="rounded-2xl"
                />
              </div>

              <div className="relative p-6 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center gap-2 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                  accept=".pdf,image/*"
                />
                <Upload className="w-6 h-6 text-[#8c7164]" />
                <span className="text-sm font-bold text-[#8c7164]">
                  {file ? file.name : 'Upload ID Document'}
                </span>
                <span className="text-[10px] text-gray-400 font-medium">(PDF, Jpg or Png up to 5MB)</span>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-[#f97316] hover:bg-[#ea580c] py-4 rounded-2xl text-white font-black uppercase tracking-widest shadow-lg shadow-[#f97316]/20 transition-all hover:-translate-y-1"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Submit for Verification'
                )}
              </Button>
            </form>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-[#ecfdf5] rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm shadow-[#10b981]/20">
              <CheckCircle className="w-10 h-10 text-[#10b981]" />
            </div>
            <h2 className="text-3xl font-display font-black text-[#251913] mb-4">Submission Success!</h2>
            <p className="text-[#8c7164] font-medium mb-8 leading-relaxed">
              Your identity documents have been submitted. Our safety team will review them within 24 hours. You'll be notified via email once approved.
            </p>
            <Button 
              onClick={onClose}
              className="w-full border-2 border-[#251913] text-[#251913] hover:bg-[#251913] hover:text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all"
            >
              Back to Profile
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
