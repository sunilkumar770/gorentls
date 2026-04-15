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
import { useAuth } from "@/contexts/AuthContext";
import UpgradeOwnerCard from "@/components/UpgradeOwnerCard";
import AddressPicker, { AddressUpdate } from "@/components/maps/AddressPicker";
import { uploadFile } from "@/services/storage";

// ─── HELPERS OUTSIDE THE PAGE COMPONENT ─────────────────────────────────────
// NEVER define component functions inside CreateListingWizard.
// React treats inner functions as new component types on every re-render,
// which unmounts and remounts inputs — causing the focus/typing bug.

function StepIcon({ stepId, current }: { stepId: number; current: number }) {
  if (current > stepId) return <CheckCircle2 className="w-5 h-5 text-white" />;
  return (
    <span className={`text-sm font-bold ${current === stepId ? "text-white" : "text-[#6b7280]"}`}>
      {stepId}
    </span>
  );
}

const getCatIcon = (val: string) =>
  CATEGORIES.find((c) => c.value === val)?.icon ?? "📦";

// ─── TYPES ───────────────────────────────────────────────────────────────────

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

// ─── PAGE ─────────────────────────────────────────────────────────────────────

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

  // Single centralized updater — use for all field changes
  const updateForm = (updates: Partial<FormData>) =>
    setForm((prev) => ({ ...prev, ...updates }));

  // Typed alias for AddressPicker
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
        console.error('Failed to upload image:', file.name, err);
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    return urls;
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
        isPublished:     isKycApproved, // Use KYC gate
      });

      if (!isKycApproved) {
        toast.success("Listing created as draft. Complete KYC to publish.");
      } else {
        toast.success("Listing published successfully!");
      }
      router.push(`/item/${res.data.id}`);
    } catch (err) {
      toast.error("Failed to create listing. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const canPublish =
    !!form.title.trim() &&
    !!form.pricePerDay &&
    Number(form.pricePerDay) > 0 &&
    !!form.category &&
    !!form.city.trim();

  const isKycApproved = user?.kycStatus === 'VERIFIED';

  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col">
      {!isKycApproved && (
        <div className="bg-amber-50 border-b border-amber-200 py-3 px-4">
          <div className="max-w-4xl mx-auto flex items-center gap-3 text-amber-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              Your KYC is pending verification. You can list items, but your listings won&apos;t be visible to renters until KYC is approved.
            </p>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="bg-white border-b border-[#e5e7eb] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-sm font-medium text-[#6b7280] hover:text-[#111827] transition-colors"
          >
            Exit
          </button>
          <span className="text-sm font-bold text-[#111827]">List an item</span>
          <span className="text-sm font-medium text-[#6b7280]">
            Step {step} of {TOTAL}
          </span>
        </div>
        <div className="w-full bg-[#f3f4f6] h-1">
          <div
            className="bg-[#16a34a] h-1 transition-all duration-500 ease-out"
            style={{ width: `${(step / TOTAL) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">

        {/* Step indicator nodes */}
        <div className="hidden sm:flex items-center justify-between mb-12 relative px-4">
          <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-[#e5e7eb] -z-10" />
          <div
            className="absolute top-1/2 left-8 h-0.5 bg-[#16a34a] -z-10 transition-all duration-500"
            style={{ width: `calc(${((step - 1) / (TOTAL - 1)) * 100}% - 4rem)` }}
          />
          {STEPS.map(({ id, label }) => {
            const done = step > id;
            const cur  = step === id;
            return (
              <div key={id} className="flex flex-col items-center gap-3 bg-[#f9fafb] px-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${done || cur ? "bg-[#16a34a] border-[#16a34a]" : "bg-white border-[#e5e7eb]"}`}>
                  <StepIcon stepId={id} current={step} />
                </div>
                <span className={`text-xs font-semibold ${done || cur ? "text-[#111827]" : "text-[#9ca3af]"}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step content card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-6 md:p-10 min-h-[400px]">

          {/* STEP 1 — Details */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-[#111827] mb-2">What are you listing?</h2>
              <p className="text-[#6b7280] mb-8">
                Provide clear, accurate details to attract the right renters.
              </p>
              <div className="space-y-6">

                <div>
                  <label className="block text-sm font-semibold text-[#374151] mb-1.5">
                    Item title *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => updateForm({ title: e.target.value })}
                    className="w-full px-4 py-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-[#16a34a] transition-all text-[#111827]"
                    placeholder="e.g. Sony A7IV Mirrorless Camera Body"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#374151] mb-1.5">
                    Category *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {CATEGORIES.map((cat) => {
                      const selected = form.category === cat.value;
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => updateForm({ category: cat.value as string })}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            selected
                              ? "border-[#16a34a] bg-[#f0fdf4] ring-1 ring-[#16a34a]/30"
                              : "border-[#e5e7eb] hover:border-[#d1d5db] bg-white"
                          }`}
                        >
                          <div className="text-lg mb-1">{getCatIcon(cat.value as string)}</div>
                          <div className={`text-sm font-medium ${selected ? "text-[#15803d]" : "text-[#4b5563]"}`}>
                            {cat.label}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#374151] mb-1.5">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={form.description}
                    onChange={(e) => updateForm({ description: e.target.value })}
                    className="w-full px-4 py-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-[#16a34a] transition-all text-[#111827] resize-none"
                    placeholder="Describe the condition, what's included, and any usage rules."
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Location */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-[#111827] mb-2">
                Where is the item located?
              </h2>
              <p className="text-[#6b7280] mb-8">
                Add a pickup location so renters can find you.
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
              <h2 className="text-2xl font-bold text-[#111827] mb-2">Add clear photos</h2>
              <p className="text-[#6b7280] mb-8">
                Good lighting and multiple angles increase rental chances.
              </p>

              <div className="border-2 border-dashed border-[#d1d5db] bg-[#f9fafb] hover:bg-[#f0fdf4] hover:border-[#16a34a]/50 transition-colors rounded-2xl p-10 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  id="listing-images"
                  onChange={handleImageChange}
                />
                <label htmlFor="listing-images" className="cursor-pointer flex flex-col items-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-[#e5e7eb]">
                    <ImagePlus className="w-8 h-8 text-[#16a34a]" />
                  </div>
                  <span className="text-lg font-bold text-[#111827] mb-1">Click to upload</span>
                  <span className="text-sm font-medium text-[#6b7280]">
                    Up to 5 images · PNG, JPG
                  </span>
                </label>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                  {images.map((img, i) => (
                    <div
                      key={i}
                      className="relative aspect-video rounded-xl overflow-hidden bg-[#f3f4f6] ring-1 ring-[#e5e7eb] shadow-sm group"
                    >
                      <img
                        src={URL.createObjectURL(img)}
                        alt={`Preview ${i + 1}`}
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute inset-0 bg-gray-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          aria-label={`Remove image ${i + 1}`}
                          className="w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-[#111827] shadow-sm hover:bg-red-50 hover:text-red-600 transition-colors"
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
              <h2 className="text-2xl font-bold text-[#111827] mb-2">Set your pricing</h2>
              <p className="text-[#6b7280] mb-8">
                Competitive rates mean more frequent bookings.
              </p>
              <div className="space-y-6 max-w-lg">

                <div>
                  <label className="block text-sm font-semibold text-[#374151] mb-1.5">
                    Daily Rental Rate (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7280] font-medium">₹</span>
                    <input
                      type="number"
                      required
                      min="1"
                      value={form.pricePerDay}
                      onChange={(e) => updateForm({ pricePerDay: e.target.value })}
                      className="w-full pl-8 pr-4 py-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-[#16a34a] transition-all text-[#111827] text-lg font-bold"
                      placeholder="500"
                    />
                  </div>
                  <p className="text-xs text-[#6b7280] mt-2">
                    The amount you earn per 24-hour period.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#374151] mb-1.5">
                    Security Deposit (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7280] font-medium">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={form.securityDeposit}
                      onChange={(e) => updateForm({ securityDeposit: e.target.value })}
                      className="w-full pl-8 pr-4 py-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-[#16a34a] transition-all text-[#111827] text-lg font-bold"
                      placeholder="5000"
                    />
                  </div>
                  <p className="text-xs text-[#6b7280] mt-2">
                    Returned if the item is undamaged.
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
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-colors ${
              step === 1
                ? "opacity-0 pointer-events-none"
                : "text-[#374151] hover:bg-[#f3f4f6]"
            }`}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {step < TOTAL ? (
            <button
              onClick={() => setStep((s) => Math.min(s + 1, TOTAL))}
              className="flex items-center gap-2 bg-[#111827] hover:bg-[#374151] text-white px-8 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !canPublish}
              className="flex items-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white px-8 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <CheckCircle2 className="w-4 h-4" />}
              {loading ? "Publishing…" : "Publish Listing"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
