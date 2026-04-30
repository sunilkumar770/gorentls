"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  ShieldCheck, ShieldAlert, Clock, Eye, Check, X,
  Search, Filter, ExternalLink, Loader2, User, Mail,
  FileText, Calendar, AlertCircle, ChevronRight,
  MoreVertical, Download, ZoomIn
} from "lucide-react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/Button";

interface KYCUser {
  id: string;
  fullName: string;
  email: string;
  kycStatus: string;
  kycDocumentType: string;
  kycDocumentId: string;
  kycDocumentUrl: string;
  createdAt: string;
}

export default function AdminKYCPage() {
  const [users, setUsers] = useState<KYCUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<KYCUser | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPendingKYC = async () => {
    setLoading(true);
    try {
      const resp = await api.get("/admin/users/pending-kyc");
      setUsers(resp.data.content);
    } catch (err) {
      toast.error("Failed to load pending KYC requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingKYC();
  }, []);

  const handleApprove = async (userId: string) => {
    setProcessing(userId);
    try {
      await api.patch(`/admin/users/${userId}/verify`);
      toast.success("User verified successfully");
      setUsers(prev => prev.filter(u => u.id !== userId));
      if (selectedUser?.id === userId) setSelectedUser(null);
    } catch (err) {
      toast.error("Approval failed");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!selectedUser || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setProcessing(selectedUser.id);
    try {
      await api.patch(`/admin/users/${selectedUser.id}/reject-kyc`, {
        reason: rejectionReason
      });
      toast.success("KYC rejected with feedback");
      setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      setSelectedUser(null);
      setShowRejectModal(false);
      setRejectionReason("");
    } catch (err) {
      toast.error("Rejection failed");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-display font-bold text-[var(--text)] flex items-center gap-3">
              Trust & Safety
              <ShieldCheck className="w-8 h-8 text-[var(--primary)]" />
            </h1>
            <p className="text-[var(--text-muted)] mt-1">Manage and verify owner identities.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white border border-[var(--border)] rounded-[var(--r-md)] px-4 py-2 flex items-center gap-2 shadow-sm focus-within:ring-2 focus-within:ring-[var(--primary)] transition-all">
              <Search className="w-4 h-4 text-[var(--text-faint)]" />
              <input 
                placeholder="Search users..." 
                className="bg-transparent border-none outline-none text-sm w-48 md:w-64"
              />
            </div>
            <Button variant="ghost" size="md" className="gap-2">
              <Filter className="w-4 h-4" /> Filter
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* List View */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            <div className="bg-white rounded-[var(--r-xl)] border border-[var(--border)] shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-faint)] flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-faint)]">Pending Verifications</h3>
                <span className="px-2.5 py-0.5 bg-[var(--primary-light)] text-[var(--primary)] rounded-full text-xs font-bold">
                  {users.length} Requests
                </span>
              </div>

              {loading ? (
                <div className="p-20 flex flex-col items-center justify-center gap-4 text-[var(--text-faint)]">
                  <Loader2 className="w-10 h-10 animate-spin text-[var(--primary)]" />
                  <span className="font-medium">Fetching pending requests...</span>
                </div>
              ) : users.length === 0 ? (
                <div className="p-20 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Check className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text)]">All Caught Up!</h3>
                  <p className="text-[var(--text-muted)] max-w-xs mx-auto">No pending KYC verifications at the moment.</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {users.map((user) => (
                    <div 
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`p-5 flex items-center justify-between hover:bg-[var(--primary-light)]/30 cursor-pointer transition-colors ${selectedUser?.id === user.id ? 'bg-[var(--primary-light)]/50 border-l-4 border-l-[var(--primary)]' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white border border-[var(--border)] rounded-full flex items-center justify-center font-bold text-[var(--primary)] shadow-sm">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-[var(--text)]">{user.fullName}</div>
                          <div className="text-xs text-[var(--text-muted)] flex items-center gap-2">
                            <Mail className="w-3 h-3" /> {user.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="hidden md:block text-right">
                          <div className="text-xs font-bold text-[var(--text-faint)] uppercase tracking-tight">Document</div>
                          <div className="text-xs font-medium text-[var(--text-muted)]">{user.kycDocumentType}</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[var(--text-faint)]" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Review Panel */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="sticky top-6">
              {selectedUser ? (
                <div className="bg-white rounded-[var(--r-xl)] border border-[var(--border)] shadow-md overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                  {/* User Profile Header */}
                  <div className="p-6 border-b border-[var(--border)]">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-16 h-16 bg-[var(--primary-light)] text-[var(--primary)] rounded-2xl flex items-center justify-center font-bold text-2xl shadow-inner">
                        {selectedUser.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <h2 className="text-xl font-bold text-[var(--text)]">{selectedUser.fullName}</h2>
                    <p className="text-sm text-[var(--text-muted)] mb-4">{selectedUser.email}</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[var(--bg-faint)] p-3 rounded-[var(--r-md)] border border-[var(--border)]">
                        <div className="text-[10px] font-bold text-[var(--text-faint)] uppercase mb-1">Doc Type</div>
                        <div className="text-xs font-bold text-[var(--text)]">{selectedUser.kycDocumentType}</div>
                      </div>
                      <div className="bg-[var(--bg-faint)] p-3 rounded-[var(--r-md)] border border-[var(--border)]">
                        <div className="text-[10px] font-bold text-[var(--text-faint)] uppercase mb-1">ID Number</div>
                        <div className="text-xs font-bold text-[var(--text)]">{selectedUser.kycDocumentId}</div>
                      </div>
                    </div>
                  </div>

                  {/* Document Preview */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[var(--primary)]" />
                        Verification Document
                      </h3>
                      <a 
                        href={selectedUser.kycDocumentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-[var(--primary)] flex items-center gap-1 hover:underline"
                      >
                        Open Full <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="relative group rounded-[var(--r-lg)] border border-[var(--border)] overflow-hidden aspect-[4/3] bg-gray-100">
                      <img 
                        src={selectedUser.kycDocumentUrl} 
                        alt="KYC Document" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button className="bg-white p-2 rounded-full shadow-lg transform hover:scale-110 transition-transform">
                          <ZoomIn className="w-5 h-5 text-[var(--text)]" />
                        </button>
                        <a 
                          href={selectedUser.kycDocumentUrl} 
                          download 
                          className="bg-white p-2 rounded-full shadow-lg transform hover:scale-110 transition-transform"
                        >
                          <Download className="w-5 h-5 text-[var(--text)]" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-6 bg-[var(--bg-faint)] border-t border-[var(--border)] grid grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="w-full text-red-600 border-red-200 hover:bg-red-50 gap-2"
                      onClick={() => setShowRejectModal(true)}
                      disabled={processing === selectedUser.id}
                    >
                      <X className="w-4 h-4" /> Reject
                    </Button>
                    <Button 
                      variant="primary" 
                      className="w-full gradient-teal gap-2"
                      onClick={() => handleApprove(selectedUser.id)}
                      loading={processing === selectedUser.id}
                    >
                      <Check className="w-4 h-4" /> Approve
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-[var(--bg-card)] rounded-[var(--r-xl)] border-2 border-dashed border-[var(--border)] p-12 text-center text-[var(--text-faint)]">
                  <User className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="font-medium">Select a request to review the documents and verification details.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[var(--r-xl)] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-red-50/50">
              <h3 className="text-lg font-bold text-red-700 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> Reject Verification
              </h3>
              <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-[var(--text-muted)] text-sm mb-6">
                Please provide a clear reason why this verification is being rejected. This will be visible to the user.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Document image is blurry, expired ID, or mismatching information."
                className="w-full h-32 p-4 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-lg)] focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none text-sm"
              />
              <div className="mt-8 flex gap-3">
                <Button 
                  variant="ghost" 
                  className="flex-1"
                  onClick={() => setShowRejectModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={handleReject}
                  loading={processing === selectedUser?.id}
                >
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
