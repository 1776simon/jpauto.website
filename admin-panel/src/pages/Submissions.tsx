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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
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
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
      setShowDeleteConfirm(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete: ${error.message}`);
      setShowDeleteConfirm(false);
    },
  });

  // Filter submissions by search query
  const filteredSubmissions =
    data?.submissions?.filter((submission: Submission) => {
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

  const openGallery = (images: string[], startIndex: number = 0) => {
    setGalleryImages(images);
    setCurrentImageIndex(startIndex);
    setGalleryOpen(true);
  };

  const closeGallery = () => {
    setGalleryOpen(false);
    setGalleryImages([]);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  // Keyboard navigation for gallery
  useEffect(() => {
    if (!galleryOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextImage();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevImage();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeGallery();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [galleryOpen, galleryImages.length]);

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
                        onClick={() => openGallery(submission.images, 0)}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
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
                              (submission.submissionStatus || submission.status) === "pending"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : (submission.submissionStatus || submission.status) === "approved"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                          >
                            {submission.submissionStatus || submission.status}
                          </span>
                          <span className="text-sm">
                            <span className="text-muted-foreground">VIN:</span> <span className="vin-text text-foreground">{submission.vin}</span>
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
                        <span>{formatDate(submission.submittedAt)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
                      <div>
                        <span className="text-muted-foreground">Mileage:</span>
                        <p className="font-medium text-foreground">
                          {submission.mileage.toLocaleString()} mi
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
                      {(submission.submissionStatus || submission.status) === "pending" && (
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
                            onClick={() => {
                              const reason = prompt("Enter rejection reason (optional):");
                              if (reason !== null) {
                                rejectMutation.mutate({
                                  id: submission.id,
                                  reason: reason,
                                });
                              }
                            }}
                            disabled={rejectMutation.isPending}
                            className="m3-button-outlined border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-sm"
                          >
                            <X className="w-4 h-4" />
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setShowDeleteConfirm(true);
                        }}
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
      {selectedSubmission && !showDeleteConfirm && (
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
                      (selectedSubmission.submissionStatus || selectedSubmission.status) === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : (selectedSubmission.submissionStatus || selectedSubmission.status) === "approved"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedSubmission.submissionStatus || selectedSubmission.status}
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
                          onClick={() => openGallery(selectedSubmission.images, idx)}
                          className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
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
                    <p className="vin-text text-foreground text-base">
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
                    <span className="text-muted-foreground">Submitted:</span>
                    <p className="font-medium text-foreground">
                      {formatDate(selectedSubmission.submittedAt)}
                    </p>
                  </div>
                  {selectedSubmission.exteriorColor && (
                    <div>
                      <span className="text-muted-foreground">Exterior Color:</span>
                      <p className="font-medium text-foreground">
                        {selectedSubmission.exteriorColor}
                      </p>
                    </div>
                  )}
                  {selectedSubmission.interiorColor && (
                    <div>
                      <span className="text-muted-foreground">Interior Color:</span>
                      <p className="font-medium text-foreground">
                        {selectedSubmission.interiorColor}
                      </p>
                    </div>
                  )}
                  {selectedSubmission.transmission && (
                    <div>
                      <span className="text-muted-foreground">Transmission:</span>
                      <p className="font-medium text-foreground">
                        {selectedSubmission.transmission}
                      </p>
                    </div>
                  )}
                  {selectedSubmission.fuelType && (
                    <div>
                      <span className="text-muted-foreground">Fuel Type:</span>
                      <p className="font-medium text-foreground">
                        {selectedSubmission.fuelType}
                      </p>
                    </div>
                  )}
                  {selectedSubmission.titleStatus && (
                    <div>
                      <span className="text-muted-foreground">Title Status:</span>
                      <p className="font-medium text-foreground">
                        {selectedSubmission.titleStatus}
                      </p>
                    </div>
                  )}
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
              {(selectedSubmission.submissionStatus || selectedSubmission.status) === "pending" && (
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
                      const reason = prompt("Enter rejection reason (optional):");
                      if (reason !== null) {
                        rejectMutation.mutate({
                          id: selectedSubmission.id,
                          reason: reason,
                        });
                      }
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

      {/* Image Gallery Popup */}
      {galleryOpen && galleryImages.length > 0 && (
        <div
          className="fixed inset-0 bg-black/95 z-[70] flex items-center justify-center"
          onClick={closeGallery}
        >
          {/* Close button */}
          <button
            onClick={closeGallery}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Image counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
            {currentImageIndex + 1} / {galleryImages.length}
          </div>

          {/* Previous button */}
          {galleryImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 bg-black/50 rounded-full p-3 hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {/* Image */}
          <div
            className="max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={galleryImages[currentImageIndex]}
              alt={`Image ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Next button */}
          {galleryImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 bg-black/50 rounded-full p-3 hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          {/* Thumbnail strip */}
          {galleryImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] p-2 bg-black/50 rounded-lg">
              {galleryImages.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(idx);
                  }}
                  className={`w-16 h-16 object-cover rounded cursor-pointer transition-all ${
                    idx === currentImageIndex
                      ? 'ring-2 ring-white scale-110'
                      : 'opacity-50 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && selectedSubmission && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-background rounded-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Delete Submission
                </h3>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete this vehicle submission?
                </p>
                <p className="text-sm font-medium text-foreground mt-2">
                  {selectedSubmission.year} {selectedSubmission.make} {selectedSubmission.model}
                  {selectedSubmission.trim && ` ${selectedSubmission.trim}`}
                </p>
                <p className="text-sm mt-1">
                  <span className="text-muted-foreground">VIN:</span> <span className="vin-text text-foreground">{selectedSubmission.vin}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Submitted by: {selectedSubmission.customerName}
                </p>
                <p className="text-sm text-red-600 font-medium mt-3">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteMutation.isPending}
                className="flex-1 m3-button-outlined"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(selectedSubmission.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
