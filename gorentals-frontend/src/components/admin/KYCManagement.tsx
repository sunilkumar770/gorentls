'use client';

import { useState, useEffect } from 'react';
import { adminService, AdminUser } from '@/services/admin';
import { CheckCircle2, XCircle, Eye, User, FileText, BadgeCheck, AlertCircle, Shield } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function KYCManagement() {
  const [submissions, setSubmissions] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers();
      // Filter for submitted KYC entries
      const pending = data.content.filter(u => u.kycStatus === 'SUBMITTED');
      setSubmissions(pending);
    } catch (error) {
      if (process.env.NODE_ENV === "development") console.error('Failed to fetch KYC submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setProcessing(userId);
    try {
      await adminService.verifyUserKYC(userId);
      setSubmissions(prev => prev.filter(s => s.id !== userId));
    } catch (error) {
      if (process.env.NODE_ENV === "development") console.error('Failed to approve KYC:', error);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--primary)]"></div>
        <p className="text-[var(--text-muted)] font-medium">Scanning identity registry...</p>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="bg-[var(--bg-card)] p-16 rounded-[var(--r-xl)] shadow-card text-center border-2 border-dashed border-[var(--primary-muted)]">
        <div className="p-4 bg-[var(--primary-light)] rounded-full w-fit mx-auto mb-6">
          <BadgeCheck className="h-10 w-10 text-[var(--primary)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text)]">All Clear</h2>
        <p className="text-[var(--text-muted)] font-medium mt-2 max-w-sm mx-auto">
          No pending KYC submissions are awaiting review. Great work!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-[var(--primary)]" />
          <h2 className="text-xl font-bold text-[var(--text)]">Pending Verification ({submissions.length})</h2>
        </div>
        <Button variant="ghost" onClick={fetchSubmissions} className="text-xs font-bold uppercase text-[var(--primary)]">
          Refresh List
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {submissions.map((user) => (
          <Card key={user.id} className="p-8 bg-[var(--bg-card)] border-none shadow-card rounded-[var(--r-lg)] flex flex-col md:flex-row md:items-center justify-between gap-8 group transition-all hover:shadow-card-hover">

            <div className="flex items-center gap-6">
              <div className="h-16 w-16 rounded-[var(--r-md)] bg-[var(--bg-subtle)] flex items-center justify-center ring-1 ring-[var(--border)] text-[var(--text)]">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt="" className="h-full w-full object-cover rounded-[var(--r-md)]" />
                ) : (
                  <User className="h-6 w-6" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[var(--primary)] uppercase tracking-widest mb-1">{user.fullName || 'Anonymous User'}</span>
                <span className="text-xs font-bold text-[var(--text-muted)] mb-2">{user.email}</span>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5 opacity-60">
                    <FileText className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-tight">{user.kycDocumentType || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-60">
                    <Shield className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-tight">ID: {user.kycDocumentId || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                className="font-bold text-xs"
                onClick={() => window.open(user.kycDocumentUrl || '#', '_blank')}
                disabled={!user.kycDocumentUrl}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Document
              </Button>

              <Button
                className="bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-md font-display font-black text-xs p-5"
                onClick={() => handleApprove(user.id)}
                loading={processing === user.id}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve Verification
              </Button>

              <Button
                variant="ghost"
                className="text-red-500 hover:bg-red-50 rounded-xl font-bold text-xs p-5"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>

          </Card>
        ))}
      </div>
    </div>
  );
}
