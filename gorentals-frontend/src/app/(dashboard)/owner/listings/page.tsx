'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, MoreVertical, Edit2, Eye, Trash2, Loader2, Package } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { getOwnerListings, deleteListing } from '@/services/listings';
import type { Listing } from '@/types';
import { toast } from 'react-hot-toast';

export default function OwnerListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchListings();
  }, []);

  async function fetchListings() {
    setIsLoading(true);
    try {
      const data = await getOwnerListings();
      setListings(data);
    } catch (error) {
      console.error('[OwnerListings] Failed to fetch:', error);
      toast.error('Failed to load listings');
    } finally {
      setIsLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    
    try {
      await deleteListing(id);
      toast.success('Listing deleted');
      setListings(prev => prev.filter(l => l.id !== id));
    } catch (error) {
      toast.error('Failed to delete listing');
    }
  };

  const filtered = listings.filter(l => 
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-normal">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Typography variant="h2">My Listings</Typography>
          <Typography variant="body-sm" className="text-muted-foreground mt-1">
            Manage your rental inventory and track performance.
          </Typography>
        </div>
        <Button asChild variant="primary">
          <Link href="/create-listing" className="flex items-center gap-2">
            <Plus size={18} />
            Add New Listing
          </Link>
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search listings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
        <Button variant="secondary" className="flex items-center gap-2">
          <Filter size={18} />
          Filters
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
          <Typography variant="body-sm" className="text-muted-foreground">Loading your listings...</Typography>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🏷️"
          title={searchQuery ? "No matches found" : "No active listings"}
          description={searchQuery ? "Try a different search term." : "Start earning by adding your first item to the marketplace."}
          action={!searchQuery && (
            <Button asChild variant="primary">
              <Link href="/create-listing">Create Listing</Link>
            </Button>
          )}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((item) => (
            <ListingRow 
              key={item.id} 
              item={item} 
              onDelete={() => handleDelete(item.id)} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ListingRow({ item, onDelete }: { item: Listing; onDelete: () => void }) {
  return (
    <Card className="p-4 hover:shadow-md transition-all group border-border">
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        {/* Image */}
        <div className="w-full sm:w-24 h-24 rounded-lg overflow-hidden bg-muted shrink-0">
          {item.listingImages?.[0]?.image_url ? (
            <img 
              src={item.listingImages[0].image_url} 
              alt={item.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Package size={24} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 w-full text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mb-1">
            <Typography variant="body-md" className="font-bold truncate max-w-[300px]">
              {item.title}
            </Typography>
            <Badge variant={item.isPublished ? 'success' : 'neutral'} size="sm">
              {item.isPublished ? 'Active' : 'Draft'}
            </Badge>
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-3 text-sm text-muted-foreground">
            <span className="capitalize">{item.category}</span>
            <span>•</span>
            <span className="font-bold text-foreground">₹{item.pricePerDay.toLocaleString('en-IN')}/day</span>
          </div>
        </div>

        {/* Stats (Hidden on mobile) */}
        <div className="hidden lg:flex items-center gap-8 px-8 border-x border-border">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Views</p>
            <p className="text-lg font-bold">124</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bookings</p>
            <p className="text-lg font-bold">8</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
          <Button variant="secondary" size="sm" asChild className="flex-1 sm:flex-none">
            <Link href={`/listings/${item.id}`} target="_blank">
              <Eye size={16} className="mr-2" />
              View
            </Link>
          </Button>
          <Button variant="secondary" size="sm" asChild className="flex-1 sm:flex-none">
            <Link href={`/owner/listings/${item.id}/edit`}>
              <Edit2 size={16} className="mr-2" />
              Edit
            </Link>
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={onDelete}
            className="text-destructive hover:bg-destructive/10 border-destructive/20"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
}

