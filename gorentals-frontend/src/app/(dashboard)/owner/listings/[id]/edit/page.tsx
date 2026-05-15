'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ChevronLeft, Loader2, Save, Eye, EyeOff, ImagePlus, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getListing, updateListing } from '@/services/listings';
import type { Listing } from '@/types';

const CATEGORIES = [
  'CAMERAS', 'GAMING', 'TOOLS', 'CAMPING', 'AUDIO',
  'ELECTRONICS', 'SPORTS', 'LAPTOPS', 'OTHER',
];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'];

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [isSaving, setIsSaving]     = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [form, setForm] = useState({
    title:           '',
    description:     '',
    category:        '',
    subcategory:     '',
    pricePerDay:     0,
    securityDeposit: 0,
    city:            '',
    state:           '',
    condition:       'Good',
    isAvailable:     true,
  });

  // ── Load listing ──────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await getListing(id);
        if (!data) {
          toast.error('Listing not found or access denied.');
          router.back();
          return;
        }
        setListing(data);
        setForm({
          title:           data.title           ?? '',
          description:     data.description     ?? '',
          category:        data.category        ?? '',
          subcategory:     data.subcategory      ?? '',
          pricePerDay:     data.pricePerDay      ?? 0,
          securityDeposit: data.securityDeposit  ?? 0,
          city:            data.city             ?? '',
          state:           data.state            ?? '',
          condition:       (data as any).condition ?? 'Good',
          isAvailable:     data.isAvailable      ?? true,
        });
      } catch {
        toast.error('Could not load listing. Please try again.');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id, router]);

  // ── Handlers ──────────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleToggleAvailability = () => {
    setForm(prev => ({ ...prev, isAvailable: !prev.isAvailable }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (form.pricePerDay <= 0) { toast.error('Price must be greater than ₹0'); return; }

    try {
      setIsSaving(true);
      setSaveSuccess(false);
      await updateListing(id, {
        ...form,
        description: form.description || null,
      } as Partial<Listing>);
      setSaveSuccess(true);
      toast.success('Listing updated successfully!');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to save changes';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading listing editor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="secondary" size="sm" onClick={() => router.back()}>
          <ChevronLeft size={18} />
          Back
        </Button>
        <div className="flex-1 min-w-0">
          <Typography variant="h2" className="text-foreground truncate">
            Edit Listing
          </Typography>
          {listing && (
            <Typography variant="body-xs" className="text-muted-foreground mt-0.5 truncate">
              ID: {id}
            </Typography>
          )}
        </div>
        <Badge variant={listing?.isPublished ? 'success' : 'warning'} size="sm">
          {listing?.isPublished ? 'Published' : 'Draft'}
        </Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Core Details */}
        <Card className="p-6 space-y-6">
          <Typography variant="h4" className="text-foreground border-b border-border pb-3">
            Core Details
          </Typography>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Canon EOS R5 Camera Body"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="Describe your item — condition, accessories included, any usage notes..."
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              >
                <option value="">Select category</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80">Condition</label>
              <select
                name="condition"
                value={form.condition}
                onChange={handleChange}
                className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              >
                {CONDITIONS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Pricing */}
        <Card className="p-6 space-y-6">
          <Typography variant="h4" className="text-foreground border-b border-border pb-3">
            Pricing & Deposit
          </Typography>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80">
                Price per day (₹) <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                name="pricePerDay"
                value={form.pricePerDay}
                onChange={handleChange}
                min={1}
                placeholder="500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80">
                Security deposit (₹)
              </label>
              <Input
                type="number"
                name="securityDeposit"
                value={form.securityDeposit}
                onChange={handleChange}
                min={0}
                placeholder="2000"
              />
            </div>
          </div>

          {form.pricePerDay > 0 && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Earnings estimate: </span>
              ₹{(form.pricePerDay * 0.9).toLocaleString('en-IN')}/day after 10% platform fee
            </div>
          )}
        </Card>

        {/* Location */}
        <Card className="p-6 space-y-6">
          <Typography variant="h4" className="text-foreground border-b border-border pb-3">
            Location
          </Typography>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80">City</label>
              <Input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="e.g. Mumbai"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80">State</label>
              <Input
                name="state"
                value={form.state}
                onChange={handleChange}
                placeholder="e.g. Maharashtra"
              />
            </div>
          </div>
        </Card>

        {/* Availability */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <Typography variant="h4" className="text-foreground">Availability</Typography>
              <Typography variant="body-sm" className="text-muted-foreground mt-1">
                {form.isAvailable
                  ? 'Renters can currently book this item.'
                  : 'This item is hidden from search and cannot be booked.'}
              </Typography>
            </div>
            <button
              type="button"
              onClick={handleToggleAvailability}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                form.isAvailable
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {form.isAvailable ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {form.isAvailable ? 'Available' : 'Hidden'}
            </button>
          </div>
        </Card>

        {/* Images — info panel (upload managed via separate flow) */}
        <Card className="p-6 space-y-4">
          <Typography variant="h4" className="text-foreground border-b border-border pb-3">
            Images ({listing?.images?.length ?? 0})
          </Typography>

          {listing?.images && listing.images.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {listing.images.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-muted group border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                  {i === 0 && (
                    <span className="absolute top-1 left-1 text-[9px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded uppercase tracking-wide">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-muted-foreground border-2 border-dashed border-border rounded-xl">
              <ImagePlus className="w-8 h-8" />
              <p className="text-sm font-medium">No images uploaded yet</p>
              <p className="text-xs">Upload images from the Listings dashboard</p>
            </div>
          )}
        </Card>

        {/* Save Actions */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="min-w-[140px]"
          >
            {isSaving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : saveSuccess ? (
              <><CheckCircle2 className="w-4 h-4" /> Saved!</>
            ) : (
              <><Save className="w-4 h-4" /> Save Changes</>
            )}
          </Button>
        </div>

      </form>
    </div>
  );
}
