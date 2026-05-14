"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { CATEGORIES } from "@/constants";
import api from "@/lib/axios";
import {
  Camera, ImagePlus, Loader2, MapPin, CheckCircle2,
  Package, Tag, ArrowRight, ArrowLeft, AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import UpgradeOwnerCard from "@/components/UpgradeOwnerCard";
import AddressPicker, { AddressUpdate } from "@/components/maps/AddressPicker";
import { uploadFile } from "@/services/storage";

// ─── STEP INDICATOR ────────────────────────────────────────────
function StepIcon({ stepId, current }: { stepId: number; current: number }) {
  if (current > stepId) return <CheckCircle2 className="w-5 h-5 text-[var(--primary)]" />;
  return (
    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
      ${current === stepId ? "bg-[var(--primary)] text-white" : "bg-[var(--border)] text-[var(--text-muted)]"}`}>
      {stepId}
    </span>
  );
}

// ─── MEMORY-SAFE IMAGE PREVIEW ─────────────────────────────────
// FIX: replaces inline URL.createObjectURL which leaked blob URLs on every render
function ImagePreview({ file, index, onRemove }: { file: File; index: number; onRemove: (i: number) => void }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl); // cleanup on unmount
  }, [file]);
  return (
    <div className="relative aspect-video rounded-[var(--r-md)] overflow-hidden bg-[var(--bg)] ring-1 ring-[var(--border)] shadow-sm group">
      {url && <img src={url} alt={`Preview ${index + 1}`} className="object-cover w-full h-full" />}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
        <button type="button" onClick={() => onRemove(index)}
          aria-label={`Remove image ${index + 1}`}
          className="w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors shadow-sm">
          ×
        </button>
      </div>
    </div>
  );
}

// ─── HELPERS ───────────────────────────────────────────────────
const getCatIcon = (val: string) => CATEGORIES.find((c) => c.value === val)?.icon ?? "📦";

type FormData = {
  title: string; description: string; category: string; type: string;
  pricePerDay: string; securityDeposit: string; location: string; city: string; state: string;
};

const INITIAL_FORM: FormData = {
  title: "", description: "", category: CATEGORIES[0].value as string, type: "",
  pricePerDay: "", securityDeposit: "", location: "", city: "", state: "",
};

const STEPS = [
  { id: 1, label: "Details", Icon: Package },
  { id: 2, label: "Location", Icon: MapPin },
  { id: 3, label: "Photos", Icon: Camera },
  { id: 4, label: "Pricing", Icon: Tag },
] as const;

const TOTAL = STEPS.length;

// ─── MAIN COMPONENT ────────────────────────────────────────────
export default function CreateListingWizard() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);

  // ✅ FIX P0: isKycApproved declared BEFORE handleSubmit — eliminates Temporal Dead Zone crash
  const isOwner = user?.userType === "OWNER" || user?.userType === "ADMIN";
  const isKycApproved = user?.kycStatus === "APPROVED";

  if (!isOwner) return <UpgradeOwnerCard />;

  const updateForm = (updates: Partial<FormData>) => setForm((prev) => ({ ...prev, ...updates }));
  const updateAddress = (updates: AddressUpdate) => updateForm(updates);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const picked = Array.from(e.target.files).slice(0, 5 - images.length);
    setImages((prev) => [...prev, ...picked]);
  };

  const removeImage = (i: number) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of images) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Image ${file.name} exceeds 5MB limit.`);
        continue;
      }
      try {
        const fileName = `listing-${Date.now()}-${file.name}`;
        const url = await uploadFile(file, "listing-images", fileName);
        urls.push(url);
      } catch (err) {
        if (process.env.NODE_ENV === "development") console.error('Failed to upload image:', file.name, err);
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    return urls;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!form.title.trim()) { toast.error("Item name is required"); return; }
      if (!form.description.trim()) { toast.error("Description is required"); return; }
    } else if (step === 2) {
      if (!form.location.trim() || !form.city.trim() || !form.state.trim()) {
        toast.error("Please enter your location"); return;
      }
    } else if (step === 3) {
      if (images.length === 0) { toast.error("Please upload at least one image"); return; }
    }
    setStep((s) => Math.min(s + 1, TOTAL));
  };

  const handleSubmit = async () => {
    if (images.length > 5) { toast.error("Maximum 5 images allowed."); return; }
    setLoading(true);
    try {
      const imageUrls = await uploadImages();
      const res = await api.post("/listings", {
        title: form.title,
        description: form.description,
        category: form.category,
        type: form.type || form.category,
        pricePerDay: Number(form.pricePerDay),
        securityDeposit: form.securityDeposit ? Number(form.securityDeposit) : 0,
        location: form.location,
        city: form.city,
        state: form.state,
        images: imageUrls,
        isAvailable: true,
        isPublished: isKycApproved, // ✅ safe — declared above
      });
      if (!isKycApproved) {
        toast.success("Listing saved as draft. Complete KYC to publish.");
      } else {
        toast.success("Listing published successfully!");
      }
      router.push(`/listings/${res.data.id}`);
    } catch (err) {
      toast.error("Failed to create listing. Please try again.");
      if (process.env.NODE_ENV === "development") console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const canPublish =
    !!form.title.trim() && !!form.description.trim() &&
    !!form.pricePerDay && Number(form.pricePerDay) > 0 &&
    !!form.category && !!form.location.trim() &&
    !!form.city.trim() && !!form.state.trim() && images.length > 0;

  return (
    <div className="min-h-screen bg-[var(--bg-subtle)] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* KYC Warning Banner */}
        {!isKycApproved && (
          <div className="flex flex-col sm:flex-row items-start gap-3 p-4 rounded-[var(--r-md)] bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 mb-6">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                KYC pending — listing will be saved as a draft until your verification is approved.
              </p>
            </div>
            <a href="/dashboard/profile#kyc" className="text-sm text-amber-700 dark:text-amber-400 underline font-bold whitespace-nowrap mt-2 sm:mt-0">
              Complete KYC →
            </a>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.back()} className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
            ← Exit
          </button>
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
            List Your Item — Step {step} of {TOTAL}
          </span>
        </div>

        {/* Step Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map(({ id, label }) => {
            const done = step > id;
            const cur = step === id;
            return (
              <div key={id} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center gap-2 ${cur ? "opacity-100" : done ? "opacity-80" : "opacity-40"}`}>
                  <StepIcon stepId={id} current={step} />
                  <span className={`text-xs font-bold hidden sm:block ${cur ? "text-[var(--text)]" : "text-[var(--text-muted)]"}`}>{label}</span>
                </div>
                {id < TOTAL && <div className={`flex-1 h-px ${done ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`} />}
              </div>
            );
          })}
        </div>

        {/* Step Content Card */}
        <div className="bg-[var(--bg-card)] rounded-[var(--r-xl)] shadow-card border border-[var(--border)] p-6 sm:p-8">

          {/* STEP 1 — Details */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-display font-bold text-[var(--text)] mb-2">Item Details</h2>
              <p className="text-[var(--text-muted)] text-sm mb-8">Provide clear, accurate details to attract the right renters.</p>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text)] mb-1.5">Item Name *</label>
                  <input type="text" required value={form.title}
                    onChange={(e) => updateForm({ title: e.target.value })}
                    className="w-full px-4 py-3.5 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-md)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all text-[var(--text)] text-sm shadow-sm"
                    placeholder="e.g. Sony A7IV Mirrorless Camera Body" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text)] mb-2">Category *</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {CATEGORIES.map((cat) => {
                      const selected = form.category === cat.value;
                      return (
                        <button key={cat.value as string} type="button"
                          onClick={() => updateForm({ category: cat.value as string })}
                          className={`p-3 rounded-[var(--r-md)] border text-left transition-all ${selected
                            ? "border-[var(--primary)] bg-[var(--primary-light)] ring-1 ring-[var(--primary)]"
                            : "border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--bg)]"}`}>
                          <div className="text-xl mb-1">{getCatIcon(cat.value as string)}</div>
                          <div className="text-xs font-semibold text-[var(--text)] truncate">{cat.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text)] mb-1.5">Specifications & Condition *</label>
                  <textarea required rows={4} value={form.description}
                    onChange={(e) => updateForm({ description: e.target.value })}
                    className="w-full px-4 py-3.5 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-md)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all text-[var(--text)] resize-none text-sm shadow-sm"
                    placeholder="Describe condition, accessories included, and usage rules." />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Location */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-display font-bold text-[var(--text)] mb-2">Pickup Location</h2>
              <p className="text-[var(--text-muted)] text-sm mb-8">Define where renters will collect this asset.</p>
              <AddressPicker location={form.location} city={form.city} state={form.state} onAddressChange={updateAddress} />
            </div>
          )}

          {/* STEP 3 — Photos (memory-safe ImagePreview component) */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-display font-bold text-[var(--text)] mb-2">Photos</h2>
              <p className="text-[var(--text-muted)] text-sm mb-8">Upload clear images to boost booking confidence.</p>
              <div className="border-2 border-dashed border-[var(--border-strong)] bg-[var(--bg)] hover:bg-[var(--primary-light)] hover:border-[var(--primary)]/50 transition-colors rounded-[var(--r-lg)] p-10 text-center">
                <input type="file" multiple accept="image/*" className="hidden" id="listing-images" onChange={handleImageChange} />
                <label htmlFor="listing-images" className="cursor-pointer flex flex-col items-center">
                  <div className="w-14 h-14 bg-[var(--bg-card)] rounded-full flex items-center justify-center shadow-sm mb-4 border border-[var(--border)]">
                    <ImagePlus className="w-6 h-6 text-[var(--primary)]" />
                  </div>
                  <span className="text-sm font-bold text-[var(--text)] mb-1">Select images</span>
                  <span className="text-xs font-semibold text-[var(--text-faint)]">Max 5 · PNG, JPG · 5MB each</span>
                </label>
              </div>
              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                  {/* ✅ FIX P0: ImagePreview handles blob lifecycle — no more leak */}
                  {images.map((img, i) => (
                    <ImagePreview key={`${img.name}-${img.lastModified}`} file={img} index={i} onRemove={removeImage} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 4 — Pricing */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-display font-bold text-[var(--text)] mb-2">Pricing</h2>
              <p className="text-[var(--text-muted)] text-sm mb-8">Set competitive rates to maximize bookings.</p>
              <div className="space-y-6 max-w-lg">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text)] mb-1.5">Daily Rate (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)] font-bold">₹</span>
                    <input type="number" required min="1" value={form.pricePerDay}
                      onChange={(e) => updateForm({ pricePerDay: e.target.value })}
                      className="w-full pl-8 pr-4 py-3.5 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-md)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all text-[var(--text)] text-lg font-bold shadow-sm"
                      placeholder="500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text)] mb-1.5">Security Deposit (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)] font-bold">₹</span>
                    <input type="number" min="0" value={form.securityDeposit}
                      onChange={(e) => updateForm({ securityDeposit: e.target.value })}
                      className="w-full pl-8 pr-4 py-3.5 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-md)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all text-[var(--text)] text-lg font-bold shadow-sm"
                      placeholder="5000" />
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-2">Held in escrow; refunded on safe return.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <button onClick={() => setStep((s) => Math.max(s - 1, 1))}
            className={`flex items-center gap-2 px-5 py-3.5 rounded-[var(--r-md)] font-bold text-sm transition-colors ${
              step === 1 ? "opacity-0 pointer-events-none" : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-card)] border border-transparent hover:border-[var(--border)]"
            }`}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {step < TOTAL ? (
            <button onClick={handleNextStep}
              disabled={
                (step === 1 && (!form.title?.trim() || !form.description?.trim())) ||
                (step === 2 && (!form.location?.trim() || !form.city?.trim() || !form.state?.trim())) ||
                (step === 3 && images.length === 0)
              }
              className="flex items-center gap-2 bg-[var(--text)] hover:bg-black text-[var(--bg)] px-8 py-3.5 rounded-[var(--r-md)] font-bold text-sm transition-all shadow-card active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading || !canPublish}
              className="flex items-center gap-2 gradient-teal hover:shadow-card-hover text-white px-8 py-3.5 rounded-[var(--r-md)] font-bold text-sm transition-all shadow-card active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {loading ? "Publishing..." : isKycApproved ? "Publish Listing" : "Save as Draft"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

