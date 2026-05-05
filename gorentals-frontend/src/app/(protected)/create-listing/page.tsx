"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { CATEGORIES } from "@/constants";
import api from "@/lib/axios";
import {
  Camera, ImagePlus, Loader2, MapPin,
  CheckCircle2, Package, Tag, ArrowRight, ArrowLeft, AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import UpgradeOwnerCard from "@/components/UpgradeOwnerCard";
import AddressPicker, { AddressUpdate } from "@/components/maps/AddressPicker";
import { uploadFile } from "@/services/storage";

// ─── HELPERS OUTSIDE THE PAGE COMPONENT ─────────────────────────────────────
function StepIcon({ stepId, current }: { stepId: number; current: number }) {
  if (current > stepId) return <CheckCircle2 className="w-5 h-5 text-[var(--primary)]" />;
  return (
    <span className={`text-sm font-bold ${current === stepId ? "text-white" : "text-[var(--text-faint)]"}`}>
      {stepId}
    </span>
  );
}

const getCatIcon = (val: string) =>
  CATEGORIES.find((c) => c.value === val)?.icon ?? "📦";

type FormData = {
  title: string;
  description: string;
  category: string;
  type: string;
  pricePerDay: string;
  securityDeposit: string;
  location: string;
  city: string;
  state: string;
};

const INITIAL_FORM: FormData = {
  title: "",
  description: "",
  category: CATEGORIES[0].value as string,
  type: "",
  pricePerDay: "",
  securityDeposit: "",
  location: "",
  city: "",
  state: "",
};

const STEPS = [
  { id: 1, label: "Details",  Icon: Package },
  { id: 2, label: "Location", Icon: MapPin  },
  { id: 3, label: "Photos",   Icon: Camera  },
  { id: 4, label: "Pricing",  Icon: Tag     },
] as const;

const TOTAL = STEPS.length;

export default function CreateListingWizard() {
  const { user }  = useAuth();
  const router    = useRouter();
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [images, setImages]   = useState<File[]>([]);
  const [form, setForm]       = useState<FormData>(INITIAL_FORM);

  const isOwner = user?.userType === "OWNER" || user?.userType === "ADMIN";

  if (!isOwner) {
    return (
      <div className="container mx-auto px-4 py-16">
        <UpgradeOwnerCard />
      </div>
    );
  }

  const updateForm = (updates: Partial<FormData>) =>
    setForm((prev) => ({ ...prev, ...updates }));

  const updateAddress = (updates: AddressUpdate) => updateForm(updates);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const picked = Array.from(e.target.files).slice(0, 5 - images.length);
    setImages((prev) => [...prev, ...picked]);
  };

  const removeImage = (i: number) =>
    setImages((prev) => prev.filter((_, idx) => idx !== i));

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of images) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Image ${file.name} exceeds 5MB limit.`);
        continue;
      }
      try {
        const fileName = `listing-${Date.now()}-${file.name}`;
        const url = await uploadFile(file, 'listing-images', fileName);
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
      if (!form.title.trim()) {
        toast.error("Asset nomenclature is required");
        return;
      }
      if (!form.description.trim()) {
        toast.error("Technical specifications are required");
        return;
      }
    } else if (step === 2) {
      if (!form.location.trim() || !form.city.trim() || !form.state.trim()) {
        toast.error("Complete deployment location is required");
        return;
      }
    } else if (step === 3) {
      if (images.length === 0) {
        toast.error("Please upload at least one image of the asset");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, TOTAL));
  };

  const handleSubmit = async () => {
    if (images.length > 5) {
      toast.error("You can upload a maximum of 5 images.");
      return;
    }
    setLoading(true);
    try {
      const imageUrls = await uploadImages();
      const res = await api.post("/listings", {
        title:           form.title,
        description:     form.description,
        category:        form.category,
        type:            form.type || form.category,
        pricePerDay:     Number(form.pricePerDay),
        securityDeposit: form.securityDeposit ? Number(form.securityDeposit) : 0,
        location:        form.location,
        city:            form.city,
        state:           form.state,
        images:          imageUrls,
        isAvailable:     true,
        isPublished:     isKycApproved, 
      });

      if (!isKycApproved) {
        toast.success("Listing created as draft. Complete KYC to publish.");
      } else {
        toast.success("Listing published successfully!");
      }
      router.push(`/item/${res.data.id}`);
    } catch (err) {
      toast.error("Failed to create listing. Please try again.");
      if (process.env.NODE_ENV === "development") console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const canPublish =
    !!form.title.trim() &&
    !!form.description.trim() &&
    !!form.pricePerDay &&
    Number(form.pricePerDay) > 0 &&
    !!form.category &&
    !!form.location.trim() &&
    !!form.city.trim() &&
    !!form.state.trim() &&
    images.length > 0;

  const isKycApproved = user?.kycStatus === 'APPROVED';

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      {!isKycApproved && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 py-3 px-4">
          <div className="max-w-4xl mx-auto flex items-center gap-3 text-amber-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              Your KYC is pending verification. You can list items, but your listings won&apos;t be visible to renters until KYC is approved.
            </p>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="bg-[var(--bg-card)] border-b border-[var(--border)] sticky top-0 z-10 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            Exit
          </button>
          <span className="text-sm font-bold text-[var(--text)]">Deploy Asset</span>
          <span className="text-sm font-medium text-[var(--text-muted)]">
            Step {step} of {TOTAL}
          </span>
        </div>
        <div className="w-full bg-[var(--border-strong)] h-1">
          <div
            className="gradient-teal h-1 transition-all duration-500 ease-out"
            style={{ width: `${(step / TOTAL) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">

        {/* Step indicator nodes */}
        <div className="hidden sm:flex items-center justify-between mb-12 relative px-4">
          <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-[var(--border)] -z-10" />
          <div
            className="absolute top-1/2 left-8 h-0.5 gradient-teal -z-10 transition-all duration-500"
            style={{ width: `calc(${((step - 1) / (TOTAL - 1)) * 100}% - 4rem)` }}
          />
          {STEPS.map(({ id, label }) => {
            const done = step > id;
            const cur  = step === id;
            return (
              <div key={id} className="flex flex-col items-center gap-3 bg-[var(--bg)] px-4">
                <div className={`w-10 h-10 rounded-[var(--r-md)] flex items-center justify-center transition-all duration-300 ${cur ? "gradient-teal shadow-sm border-transparent" : done ? "bg-[var(--primary-light)] border-transparent" : "bg-[var(--bg-card)] border border-[var(--border-strong)]"}`}>
                  <StepIcon stepId={id} current={step} />
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider ${done || cur ? "text-[var(--text)]" : "text-[var(--text-faint)]"}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step content card */}
        <div className="bg-[var(--bg-card)] rounded-[var(--r-xl)] shadow-card border border-[var(--border)] p-6 md:p-10 min-h-[400px]">

          {/* STEP 1 — Details */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-display font-bold text-[var(--text)] mb-2">Configure asset identity</h2>
              <p className="text-[var(--text-muted)] text-sm mb-8">
                Provide clear, accurate details to attract the right professional renters.
              </p>
              <div className="space-y-6">

                <div>
                  <label className="block text-sm font-semibold text-[var(--text)] mb-1.5">
                    Asset Nomenclature *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => updateForm({ title: e.target.value })}
                    className="w-full px-4 py-3.5 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-md)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all text-[var(--text)] shadow-sm text-sm"
                    placeholder="e.g. Sony A7IV Mirrorless Camera Body"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--text)] mb-1.5">
                    Classification *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {CATEGORIES.map((cat) => {
                      const selected = form.category === cat.value;
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => updateForm({ category: cat.value as string })}
                          className={`p-3 rounded-[var(--r-md)] border text-left transition-all ${
                            selected
                              ? "border-[var(--primary)] bg-[var(--primary-light)] ring-1 ring-[var(--primary)] shadow-sm"
                              : "border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--bg)]"
                          }`}
                        >
                          <div className="text-lg mb-1.5 opacity-80">{getCatIcon(cat.value as string)}</div>
                          <div className={`text-xs font-bold uppercase tracking-wider ${selected ? "text-[var(--primary)]" : "text-[var(--text-muted)]"}`}>
                            {cat.label}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--text)] mb-1.5">
                    Technical Specifications & Condition *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={form.description}
                    onChange={(e) => updateForm({ description: e.target.value })}
                    className="w-full px-4 py-3.5 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-md)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all text-[var(--text)] resize-none shadow-sm text-sm"
                    placeholder="Describe the condition, what's included, and any strict usage rules."
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Location */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-display font-bold text-[var(--text)] mb-2">
                Deployment Location
              </h2>
              <p className="text-[var(--text-muted)] text-sm mb-8">
                Define the primary pickup zone for this asset.
              </p>
              <AddressPicker
                location={form.location}
                city={form.city}
                state={form.state}
                onAddressChange={updateAddress}
              />
            </div>
          )}

          {/* STEP 3 — Photos */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-display font-bold text-[var(--text)] mb-2">Asset Media</h2>
              <p className="text-[var(--text-muted)] text-sm mb-8">
                Upload clear, professional-grade imagery to increase booking confidence.
              </p>

              <div className="border-2 border-dashed border-[var(--border-strong)] bg-[var(--bg)] hover:bg-[var(--primary-light)] hover:border-[var(--primary)]/50 transition-colors rounded-[var(--r-lg)] p-10 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  id="listing-images"
                  onChange={handleImageChange}
                />
                <label htmlFor="listing-images" className="cursor-pointer flex flex-col items-center">
                  <div className="w-14 h-14 bg-[var(--bg-card)] rounded-full flex items-center justify-center shadow-sm mb-4 border border-[var(--border)]">
                    <ImagePlus className="w-6 h-6 text-[var(--primary)]" />
                  </div>
                  <span className="text-sm font-bold text-[var(--text)] mb-1">Select media files</span>
                  <span className="text-xs font-semibold text-[var(--text-faint)]">
                    Max 5 images · PNG, JPG
                  </span>
                </label>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                  {images.map((img, i) => (
                    <div
                      key={i}
                      className="relative aspect-video rounded-[var(--r-md)] overflow-hidden bg-[var(--bg)] ring-1 ring-[var(--border)] shadow-sm group"
                    >
                      <img
                        src={URL.createObjectURL(img)}
                        alt={`Preview ${i + 1}`}
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          aria-label={`Remove image ${i + 1}`}
                          className="w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors shadow-sm"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 4 — Pricing */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-display font-bold text-[var(--text)] mb-2">Financials</h2>
              <p className="text-[var(--text-muted)] text-sm mb-8">
                Set competitive rates to optimize your asset utilization.
              </p>
              <div className="space-y-6 max-w-lg">

                <div>
                  <label className="block text-sm font-semibold text-[var(--text)] mb-1.5">
                    Daily Base Rate (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)] font-bold">₹</span>
                    <input
                      type="number"
                      required
                      min="1"
                      value={form.pricePerDay}
                      onChange={(e) => updateForm({ pricePerDay: e.target.value })}
                      className="w-full pl-8 pr-4 py-3.5 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-md)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all text-[var(--text)] text-lg font-bold shadow-sm"
                      placeholder="500"
                    />
                  </div>
                  <p className="text-xs font-medium text-[var(--text-muted)] mt-2">
                    The gross yield per 24-hour cycle.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--text)] mb-1.5">
                    Escrow Security Deposit (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)] font-bold">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={form.securityDeposit}
                      onChange={(e) => updateForm({ securityDeposit: e.target.value })}
                      className="w-full pl-8 pr-4 py-3.5 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-md)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all text-[var(--text)] text-lg font-bold shadow-sm"
                      placeholder="5000"
                    />
                  </div>
                  <p className="text-xs font-medium text-[var(--text-muted)] mt-2">
                    Held temporarily to cover catastrophic damage or loss.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(s - 1, 1))}
            className={`flex items-center gap-2 px-5 py-3.5 rounded-[var(--r-md)] font-bold text-sm transition-colors ${
              step === 1
                ? "opacity-0 pointer-events-none"
                : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-card)] border border-transparent hover:border-[var(--border)]"
            }`}
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>

          {step < TOTAL ? (
            <button
              onClick={handleNextStep}
              disabled={
                (step === 1 && (!form.title?.trim() || !form.description?.trim())) ||
                (step === 2 && (!form.location?.trim() || !form.city?.trim() || !form.state?.trim())) ||
                (step === 3 && images.length === 0)
              }
              className="flex items-center gap-2 bg-[var(--text)] hover:bg-black text-[var(--bg)] px-8 py-3.5 rounded-[var(--r-md)] font-bold text-sm transition-all shadow-card active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
               onClick={handleSubmit}
               disabled={loading || !canPublish}
               className="flex items-center gap-2 gradient-teal hover:shadow-card-hover text-white px-8 py-3.5 rounded-[var(--r-md)] font-bold text-sm transition-all shadow-card active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed border border-transparent"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <CheckCircle2 className="w-4 h-4" />}
              {loading ? "Initializing..." : "Publish Asset"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
