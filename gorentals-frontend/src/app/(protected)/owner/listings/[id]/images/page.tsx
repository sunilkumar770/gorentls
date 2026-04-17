'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import {
  uploadListingImages, deleteListingImage, setPrimaryImage,
} from '@/services/listings';
import { ArrowLeft, Upload, Trash2, Star, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Listing } from '@/types';

export default function ManageImagesPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [listing,   setListing]   = useState<Listing | null>(null);
  const [images,    setImages]    = useState<Array<{id: string; image_url: string; is_primary?: boolean}>>([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busy,      setBusy]      = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    try {
      const res = await api.get<Listing>(`/listings/${id}`);
      setListing(res.data);
      setImages(res.data.listing_images ?? []);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const valid = files.filter(f => {
      if (!f.type.startsWith('image/')) { toast.error(`${f.name}: not an image`); return false; }
      if (f.size > 5 * 1024 * 1024)     { toast.error(`${f.name}: max 5 MB`);     return false; }
      return true;
    });
    if (!valid.length) return;
    if (images.length + valid.length > 8) {
      toast.error('Maximum 8 images per listing.'); return;
    }
    setUploading(true);
    try {
      await uploadListingImages(id, valid);
      await refresh();
      toast.success(`${valid.length} photo${valid.length > 1 ? 's' : ''} added!`);
    } catch {
      toast.error('Upload failed — please retry.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleSetPrimary(imageId: string) {
    setBusy(p => new Set(p).add(imageId));
    try {
      await setPrimaryImage(id, imageId);
      await refresh();
      toast.success('Cover photo updated.');
    } catch {
      toast.error('Failed to update cover photo.');
    } finally {
      setBusy(p => { const s = new Set(p); s.delete(imageId); return s; });
    }
  }

  async function handleDelete(imageId: string) {
    if (images.length === 1) {
      toast('Keep at least one photo.', { icon: '⚠️' }); return;
    }
    setBusy(p => new Set(p).add(imageId));
    try {
      await deleteListingImage(id, imageId);
      setImages(p => p.filter(i => i.id !== imageId));
      toast.success('Photo removed.');
    } catch {
      toast.error('Failed to remove photo.');
    } finally {
      setBusy(p => { const s = new Set(p); s.delete(imageId); return s; });
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-9 h-9 rounded-full border-4 border-[#16a34a]/20 border-t-[#16a34a] animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => router.back()}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900
                           mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Manage Photos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {listing?.title} · {images.length}/8 photos
          </p>
        </div>

        {/* Upload zone */}
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 mb-6 text-center">
          <label className="cursor-pointer flex flex-col items-center gap-2 group">
            {uploading ? (
              <Loader2 className="w-8 h-8 text-[#16a34a] animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-gray-300 group-hover:text-[#16a34a] transition-colors" />
            )}
            <p className="text-sm font-medium text-gray-600 group-hover:text-[#16a34a] transition-colors">
              {uploading ? 'Uploading…' : 'Click to add photos'}
            </p>
            <p className="text-xs text-gray-400">JPG, PNG, WebP · Max 5 MB each · Up to 8 total</p>
            <input type="file" accept="image/jpeg,image/png,image/webp"
                   multiple className="sr-only" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>

        {/* Image grid */}
        {images.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-400 text-sm">No photos yet. Add at least one to make your listing visible.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map(img => (
              <div key={img.id} className="relative group rounded-2xl overflow-hidden bg-gray-100 aspect-square">
                <img src={img.image_url} alt=""
                     loading="lazy"
                     className="w-full h-full object-cover" />

                {/* Primary badge */}
                {img.is_primary && (
                  <div className="absolute top-2 left-2 flex items-center gap-1
                                  bg-[#16a34a] text-white text-[10px] font-bold
                                  px-2 py-0.5 rounded-full shadow-sm">
                    <Star className="w-2.5 h-2.5" />Cover
                  </div>
                )}

                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100
                                transition-opacity flex items-center justify-center gap-2">
                  {!img.is_primary && (
                    <button
                      onClick={() => handleSetPrimary(img.id)}
                      disabled={busy.has(img.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white/90 text-gray-800
                                 text-xs font-semibold rounded-xl hover:bg-white transition-colors
                                 disabled:opacity-50"
                    >
                      {busy.has(img.id)
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Star className="w-3 h-3 text-[#16a34a]" />}
                      Set cover
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(img.id)}
                    disabled={busy.has(img.id) || images.length === 1}
                    className="p-1.5 bg-red-500/90 text-white rounded-xl hover:bg-red-600
                               transition-colors disabled:opacity-40"
                  >
                    {busy.has(img.id)
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
