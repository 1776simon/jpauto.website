import { AdminLayout } from "@/components/AdminLayout";
import {
  Check,
  X,
  Trash2,
  Eye,
  Filter,
  Search,
  Calendar,
  User,
  Phone,
  Mail,
  Car,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api, { Submission } from "@/services/api";
import { toast } from "sonner";

export default function Submissions() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [page, setPage] = useState(1);

  // Fetch submissions
  const { data, isLoading } = useQuery({
    queryKey: ["submissions", statusFilter, page],
    queryFn: () => api.getSubmissions(statusFilter, page, 20),
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (id: number) => api.approveSubmission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryStats"] });
      toast.success("Submission approved successfully");
      setSelectedSubmission(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve: ${error.message}`);
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api.rejectSubmission(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryStats"] });
      toast.success("Submission rejected");
      setSelectedSubmission(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to reject: ${error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteSubmission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      toast.success("Submission deleted");
      setSelectedSubmission(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  // Filter submissions by search query
  const filteredSubmissions =
    data?.data?.filter((submission) => {
      const query = searchQuery.toLowerCase();
      return (
        submission.customerName.toLowerCase().includes(query) ||
        submission.customerEmail.toLowerCase().includes(query) ||
        submission.make.toLowerCase().includes(query) ||
        submission.model.toLowerCase().includes(query) ||
        submission.vin.toLowerCase().includes(query)
      );
    }) || [];

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  return (
    <AdminLayout
      title="Submissions"
      description="Manage and review customer vehicle submissions"
    >
      <div className="space-y-6">
        {/* Header with Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search submissions..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === "pending"
                  ? "bg-yellow-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter("approved")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === "approved"
                  ? "bg-green-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setStatusFilter("rejected")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === "rejected"
                  ? "bg-red-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Rejected
            </button>
          </div>
        </div>

        {/* Submissions List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="m3-card p-6 animate-pulse">
                <div className="h-6 bg-muted rounded w-1/3 mb-4" />
                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="m3-card p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No submissions found
            </h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search query"
                : "Customer vehicle submissions will appear here"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="m3-card p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Vehicle Image */}
                  <div className="w-full lg:w-48 h-32 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    {submission.images && submission.images.length > 0 ? (
                      <img
                        src={submission.images[0]}
                        alt={`${submission.year} ${submission.make} ${submission.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Submission Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                          {submission.year} {submission.make} {submission.model}
                          {submission.trim && ` ${submission.trim}`}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                              submission.status === "pending"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : submission.status === "approved"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                          >
                            {submission.status}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            VIN: {submission.vin}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>{submission.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">
                          {submission.customerEmail}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{submission.customerPhone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(submission.createdAt)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
                      <div>
                        <span className="text-muted-foreground">Mileage:</span>
                        <p className="font-medium text-foreground">
                          {submission.mileage.toLocaleString()} mi
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Condition:
                        </span>
                        <p className="font-medium text-foreground capitalize">
                          {submission.condition}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Images:</span>
                        <p className="font-medium text-foreground">
                          {submission.images?.length || 0} photos
                        </p>
                      </div>
                    </div>

                    {submission.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {submission.description}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedSubmission(submission)}
                        className="m3-button-outlined flex items-center gap-2 text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      {submission.status === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              approveMutation.mutate(submission.id)
                            }
                            disabled={approveMutation.isPending}
                            className="m3-button-filled bg-green-600 hover:bg-green-700 flex items-center gap-2 text-sm"
                          >
                            <Check className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              rejectMutation.mutate({
                                id: submission.id,
                                reason: "",
                              })
                            }
                            disabled={rejectMutation.isPending}
                            className="m3-button-outlined border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-sm"
                          >
                            <X className="w-4 h-4" />
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteMutation.mutate(submission.id)}
                        disabled={deleteMutation.isPending}
                        className="m3-button-text text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="m3-button-outlined disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {data.pagination.totalPages}
            </span>
            <button
              onClick={() =>
                setPage((p) => Math.min(data.pagination.totalPages, p + 1))
              }
              disabled={page === data.pagination.totalPages}
              className="m3-button-outlined disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedSubmission && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedSubmission(null)}
        >
          <div
            className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border sticky top-0 bg-background z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {selectedSubmission.year} {selectedSubmission.make}{" "}
                    {selectedSubmission.model}
                    {selectedSubmission.trim && ` ${selectedSubmission.trim}`}
                  </h2>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      selectedSubmission.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : selectedSubmission.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedSubmission.status}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Images */}
              {selectedSubmission.images &&
                selectedSubmission.images.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">
                      Photos ({selectedSubmission.images.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {selectedSubmission.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Vehicle ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}

              {/* Vehicle Details */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">
                  Vehicle Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">VIN:</span>
                    <p className="font-medium text-foreground">
                      {selectedSubmission.vin}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mileage:</span>
                    <p className="font-medium text-foreground">
                      {selectedSubmission.mileage.toLocaleString()} miles
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Condition:</span>
                    <p className="font-medium text-foreground capitalize">
                      {selectedSubmission.condition}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Submitted:</span>
                    <p className="font-medium text-foreground">
                      {formatDate(selectedSubmission.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium text-foreground">
                      {selectedSubmission.customerName}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium text-foreground">
                      {selectedSubmission.customerEmail}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <p className="font-medium text-foreground">
                      {selectedSubmission.customerPhone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedSubmission.description && (
                <div>
                  <h3 className="font-semibold text-foreground mb-3">
                    Description
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedSubmission.description}
                  </p>
                </div>
              )}

              {/* Actions */}
              {selectedSubmission.status === "pending" && (
                <div className="flex gap-3 pt-4 border-t border-border">
                  <button
                    onClick={() => {
                      approveMutation.mutate(selectedSubmission.id);
                    }}
                    disabled={approveMutation.isPending}
                    className="m3-button-filled bg-green-600 hover:bg-green-700 flex-1"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    Approve Submission
                  </button>
                  <button
                    onClick={() => {
                      rejectMutation.mutate({
                        id: selectedSubmission.id,
                        reason: "",
                      });
                    }}
                    disabled={rejectMutation.isPending}
                    className="m3-button-outlined border-red-600 text-red-600 hover:bg-red-50 flex-1"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Reject Submission
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
