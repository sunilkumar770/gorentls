'use client';

import { useState, useEffect } from 'react';
import { adminService } from '@/services/admin';
import { Profile } from '@/types';
import { CheckCircle2, XCircle, Eye, User, FileText, BadgeCheck, AlertCircle, Shield } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function KYCManagement() {
  const [submissions, setSubmissions] = useState<any[]>([]);
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
      console.error('Failed to fetch KYC submissions:', error);
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
      console.error('Failed to approve KYC:', error);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#f97316]"></div>
        <p className="text-[#8c7164] font-medium">Scanning identity registry...</p>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="bg-white p-16 rounded-[3rem] shadow-ambient text-center border-2 border-dashed border-[#f97316]/5">
        <div className="p-4 bg-green-50 rounded-full w-fit mx-auto mb-6">
          <BadgeCheck className="h-10 w-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-black text-[#251913]">All Clear</h2>
        <p className="text-[#8c7164] font-medium mt-2 max-w-sm mx-auto">
          No pending KYC submissions are awaiting review. Great work!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-[#f97316]" />
          <h2 className="text-xl font-black text-[#251913]">Pending Verification ({submissions.length})</h2>
        </div>
        <Button variant="ghost" onClick={fetchSubmissions} className="text-xs font-black uppercase text-[#f97316]">
          Refresh List
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {submissions.map((user) => (
          <Card key={user.id} className="p-8 bg-white border-none shadow-ambient rounded-[2.5rem] flex flex-col md:flex-row md:items-center justify-between gap-8 group transition-all hover:shadow-[0_20px_48px_rgba(37,25,19,0.08)]">

            <div className="flex items-center gap-6">
              <div className="h-16 w-16 rounded-2xl bg-[#fff8f6] flex items-center justify-center ring-1 ring-[#f97316]/10 text-[#251913]">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt="" className="h-full w-full object-cover rounded-2xl" />
                ) : (
                  <User className="h-6 w-6" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black text-[#f97316] uppercase tracking-widest mb-1">{user.fullName || 'Anonymous User'}</span>
                <span className="text-xs font-bold text-[#8c7164] mb-2">{user.email}</span>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5 opacity-60">
                    <FileText className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-tight">{user.kycDocumentType || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-60">
                    <Shield className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-tight">ID: {user.kycDocumentId || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-[#251913]/5 bg-[#fff8f6] text-[#251913] hover:bg-white font-bold text-xs p-5"
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
