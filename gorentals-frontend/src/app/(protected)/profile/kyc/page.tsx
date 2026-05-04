"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  ShieldCheck, Upload, FileText, CheckCircle2,
  AlertCircle, ArrowRight, ArrowLeft, Loader2,
  Lock, ExternalLink, RefreshCw
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { uploadFile } from "@/services/storage";

const DOC_TYPES = [
  { id: "AADHAAR", label: "Aadhaar Card", description: "National ID card (India)" },
  { id: "PASSPORT", label: "Passport", description: "International travel document" },
  { id: "PAN", label: "PAN Card", description: "Tax identification card" },
];

export default function KYCPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // If already approved, redirect or show success
  const isApproved = user?.kycStatus === "APPROVED";
  const isSubmitted = user?.kycStatus === "SUBMITTED";
  const isRejected = user?.kycStatus === "REJECTED";

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selected = e.target.files[0];
      if (selected.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setFile(selected);
    }
  };

  const handleSubmit = async () => {
    if (!file || !selectedDocType || !idNumber) {
      toast.error("Please fill all fields and upload a document");
      return;
    }

    setLoading(true);
    try {
      const fileName = `kyc-${user?.id}-${Date.now()}-${file.name}`;
      const documentUrl = await uploadFile(file, 'kyc-documents', fileName);

      await api.post("/users/kyc", {
        documentType: selectedDocType,
        idNumber: idNumber,
        documentUrl: documentUrl
      });

      toast.success("KYC submitted successfully!");
      await refreshUser();
      setStep(3); // Success/Processing step
    } catch (err: unknown) { 
      const _err = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      console.error(err);
      toast.error(_err.response?.data?.message || "Failed to submit KYC");
    } finally {
      setLoading(false);
    }
  };

  if (isApproved) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="w-20 h-20 bg-teal-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-10 h-10 text-teal-600" />
        </div>
        <h1 className="text-3xl font-display font-bold text-[var(--text)] mb-3">Identity Verified</h1>
        <p className="text-[var(--text-muted)] mb-8">
          Your identity has been successfully verified. You now have full access to all GoRentals features.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="gradient-teal text-white px-8 py-3 rounded-[var(--r-md)] font-bold transition-all shadow-card"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (isSubmitted && step !== 3) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <RefreshCw className="w-10 h-10 text-blue-600 animate-spin-slow" />
        </div>
        <h1 className="text-3xl font-display font-bold text-[var(--text)] mb-3">Verification in Progress</h1>
        <p className="text-[var(--text-muted)] mb-8">
          Our team is currently reviewing your documents. This usually takes 24-48 hours.
          We'll notify you once the process is complete.
        </p>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--r-lg)] p-6 text-left mb-8">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-faint)] mb-4">Submission Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-[var(--text-muted)]">Document Type</span>
              <span className="text-sm font-bold text-[var(--text)]">{user?.kycDocumentType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[var(--text-muted)]">ID Number</span>
              <span className="text-sm font-bold text-[var(--text)]">
                {user?.kycDocumentId?.replace(/.(?=.{4})/g, '*')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[var(--text-muted)]">Status</span>
              <span className="text-sm font-bold text-blue-600">PENDING REVIEW</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-[var(--text-muted)] hover:text-[var(--text)] font-bold transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-[var(--text)] mb-2 flex items-center gap-3">
              Trust Verification
              <ShieldCheck className="w-8 h-8 text-[var(--primary)]" />
            </h1>
            <p className="text-[var(--text-muted)]">Complete your KYC to unlock full ownership and rental privileges.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-500/5 border border-blue-500/10 rounded-full">
            <Lock className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">AES-256 Encrypted</span>
          </div>
        </div>

        {isRejected && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-[var(--r-lg)] p-4 mb-8 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-700 font-bold text-sm">Previous Submission Rejected</h3>
              <p className="text-red-600/80 text-sm mt-1">
                Reason: {user?.kycRejectionReason || "Documents were unclear or invalid."}
              </p>
              <p className="text-red-600/60 text-xs mt-2 italic">Please re-submit clear documents to continue.</p>
            </div>
          </div>
        )}

        {/* Progress Tracker */}
        <div className="mb-12 relative flex justify-between">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-[var(--border)] -translate-y-1/2 -z-10" />
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-4 bg-[var(--bg)] ${
                step >= s ? "border-[var(--primary)] text-[var(--primary)]" : "border-[var(--border)] text-[var(--text-faint)]"
              } ${step === s ? "scale-110 shadow-lg" : ""}`}
            >
              {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
            </div>
          ))}
        </div>

        {/* Form Container */}
        <div className="bg-[var(--bg-card)] rounded-[var(--r-xl)] shadow-card border border-[var(--border)] p-8 md:p-12 overflow-hidden relative">
          {/* STEP 1: Select Doc Type */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold text-[var(--text)] mb-6">Select identification document</h2>
              <div className="grid gap-4 mb-10">
                {DOC_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedDocType(type.id)}
                    className={`flex items-center justify-between p-5 rounded-[var(--r-lg)] border-2 transition-all ${
                      selectedDocType === type.id
                        ? "border-[var(--primary)] bg-[var(--primary-light)] shadow-sm"
                        : "border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--bg)]"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-[var(--r-md)] flex items-center justify-center ${
                        selectedDocType === type.id ? "bg-white text-[var(--primary)]" : "bg-[var(--bg-card)] text-[var(--text-faint)]"
                      }`}>
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-[var(--text)]">{type.label}</div>
                        <div className="text-xs text-[var(--text-muted)]">{type.description}</div>
                      </div>
                    </div>
                    {selectedDocType === type.id && <CheckCircle2 className="w-6 h-6 text-[var(--primary)]" />}
                  </button>
                ))}
              </div>

              {selectedDocType && (
                <div className="animate-in fade-in zoom-in-95">
                  <label className="block text-sm font-bold text-[var(--text)] mb-2">
                    Enter {DOC_TYPES.find(d => d.id === selectedDocType)?.label} Number
                  </label>
                  <input
                    type="text"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. XXXX-XXXX-XXXX"
                    className="w-full px-5 py-4 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-lg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all text-lg font-mono tracking-widest"
                  />
                </div>
              )}

              <div className="mt-10 flex justify-end">
                <button
                  disabled={!selectedDocType || !idNumber}
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 gradient-teal text-white px-8 py-3.5 rounded-[var(--r-md)] font-bold transition-all shadow-card disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                >
                  Continue to Upload <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Upload File */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-xl font-bold text-[var(--text)] mb-2">Upload document scan</h2>
              <p className="text-[var(--text-muted)] text-sm mb-8">
                Ensure the document is clear, well-lit, and all text is legible.
              </p>

              {!file ? (
                <div className="border-2 border-dashed border-[var(--border-strong)] bg-[var(--bg)] hover:bg-[var(--primary-light)] hover:border-[var(--primary)]/50 transition-all rounded-[var(--r-xl)] p-12 text-center group">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    id="kyc-file"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="kyc-file" className="cursor-pointer flex flex-col items-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-6 border border-[var(--border)] group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8 text-[var(--primary)]" />
                    </div>
                    <span className="text-lg font-bold text-[var(--text)] mb-1">Click to upload document</span>
                    <span className="text-sm font-medium text-[var(--text-faint)]">
                      PDF, PNG, JPG (Max 5MB)
                    </span>
                  </label>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="relative rounded-[var(--r-xl)] overflow-hidden border border-[var(--border)] bg-black group aspect-[4/3] max-h-[300px]">
                    {file.type.startsWith('image/') ? (
                      <img src={previewUrl!} alt="Preview" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white">
                        <FileText className="w-16 h-16 mb-4 opacity-50" />
                        <span className="font-mono text-sm">{file.name}</span>
                      </div>
                    )}
                    <button
                      onClick={() => setFile(null)}
                      className="absolute top-4 right-4 bg-black/60 hover:bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
                    >
                      &times;
                    </button>
                  </div>
                  
                  <div className="bg-[var(--bg)] p-4 rounded-[var(--r-md)] border border-[var(--border)] flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-600" />
                    <div className="flex-1 overflow-hidden">
                      <div className="text-xs font-bold text-[var(--text)] truncate">{file.name}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-12 flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] font-bold px-4 py-2 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Go Back
                </button>
                <button
                  disabled={!file || loading}
                  onClick={handleSubmit}
                  className="flex items-center gap-2 gradient-teal text-white px-10 py-4 rounded-[var(--r-md)] font-bold transition-all shadow-card disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px] justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      Finish Verification <ShieldCheck className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Success */}
          {step === 3 && (
            <div className="text-center py-8 animate-in zoom-in-95 duration-700">
              <div className="w-24 h-24 bg-teal-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 className="w-12 h-12 text-teal-600" />
              </div>
              <h2 className="text-2xl font-display font-bold text-[var(--text)] mb-4">Submission Received!</h2>
              <p className="text-[var(--text-muted)] mb-10 max-w-sm mx-auto">
                Thank you for verifying your identity. Our team will review your submission and update your status within 48 hours.
              </p>
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="gradient-teal text-white px-10 py-4 rounded-[var(--r-md)] font-bold shadow-card transition-transform active:scale-95"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => router.push("/profile")}
                  className="text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                >
                  View Profile Settings
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-8 text-[var(--text-faint)]">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span className="text-xs font-semibold">End-to-End Encryption</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-semibold">Compliance Guaranteed</span>
          </div>
          <div className="flex items-center gap-2 cursor-pointer hover:text-[var(--text-muted)] transition-colors">
            <span className="text-xs font-semibold">Privacy Policy</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
