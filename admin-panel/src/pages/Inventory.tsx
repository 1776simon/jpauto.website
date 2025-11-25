import { AdminLayout } from "@/components/AdminLayout";
import {
  Car,
  Plus,
  Search,
  Edit,
  Trash2,
  DollarSign,
  Eye,
  Filter,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
  Upload,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import api, { InventoryItem } from "@/services/api";
import { toast } from "sonner";

export default function Inventory() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<
    "all" | "available" | "sold" | "pending"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<InventoryItem>>({});
  const [page, setPage] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [tempImages, setTempImages] = useState<string[]>([]);

  // Fetch inventory
  const { data, isLoading } = useQuery({
    queryKey: ["inventory", statusFilter, page],
    queryFn: () => {
      const filters: Record<string, any> = {
        page,
        limit: 20,
      };
      if (statusFilter !== "all") {
        filters.status = statusFilter;
      }
      return api.getInventory(filters);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteInventoryItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryStats"] });
      toast.success("Vehicle deleted from inventory");
      setSelectedItem(null);
      setShowDeleteConfirm(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete: ${error.message}`);
      setShowDeleteConfirm(false);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InventoryItem> }) =>
      api.updateInventoryItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryStats"] });
      toast.success("Vehicle updated successfully");
      setSelectedItem(null);
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  // Photo upload mutation
  const uploadPhotosMutation = useMutation({
    mutationFn: ({ id, files }: { id: number; files: File[] }) =>
      api.uploadInventoryPhotos(id, files),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      if (selectedItem) {
        setSelectedItem({ ...selectedItem, images: data.images });
        setEditFormData({ ...editFormData, images: data.images });
      }
      toast.success("Photos uploaded successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload photos: ${error.message}`);
    },
  });

  // Photo reorder mutation
  const reorderPhotosMutation = useMutation({
    mutationFn: ({ id, imageUrls }: { id: number; imageUrls: string[] }) =>
      api.reorderInventoryPhotos(id, imageUrls),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      if (selectedItem) {
        setSelectedItem({ ...selectedItem, images: data.images });
        setEditFormData({ ...editFormData, images: data.images });
      }
      toast.success("Photos reordered successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to reorder photos: ${error.message}`);
    },
  });

  // Photo delete mutation
  const deletePhotoMutation = useMutation({
    mutationFn: ({ id, imageUrl }: { id: number; imageUrl: string }) =>
      api.deleteInventoryPhoto(id, imageUrl),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      if (selectedItem) {
        setSelectedItem({ ...selectedItem, images: data.images });
        setEditFormData({ ...editFormData, images: data.images });
      }
      toast.success("Photo deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete photo: ${error.message}`);
    },
  });

  // Filter inventory by search query
  const filteredInventory =
    data?.inventory?.filter((item) => {
      const query = searchQuery.toLowerCase();
      return (
        item.make.toLowerCase().includes(query) ||
        item.model.toLowerCase().includes(query) ||
        item.vin.toLowerCase().includes(query) ||
        item.year.toString().includes(query)
      );
    }) || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };

  const handleStatusChange = (id: number, newStatus: string) => {
    updateMutation.mutate({
      id,
      data: { status: newStatus as "available" | "sold" | "pending" },
    });
  };

  const handleEditClick = (item: InventoryItem) => {
    setSelectedItem(item);
    setEditFormData({
      year: item.year,
      make: item.make,
      model: item.model,
      trim: item.trim || '',
      vin: item.vin,
      mileage: item.mileage,
      price: item.price,
      cost: item.cost || '',
      exteriorColor: item.exteriorColor || item.exterior_color || '',
      interiorColor: item.interiorColor || item.interior_color || '',
      transmission: item.transmission || '',
      titleStatus: item.titleStatus || item.title_status || '',
      description: item.description || '',
    });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!selectedItem) return;

    // Clean up the data before sending
    const cleanedData: Partial<InventoryItem> = {
      ...editFormData,
    };

    // Remove empty string values and ensure proper types
    Object.keys(cleanedData).forEach((key) => {
      const value = cleanedData[key as keyof InventoryItem];
      if (value === '' || value === null || value === undefined) {
        delete cleanedData[key as keyof InventoryItem];
      }
    });

    updateMutation.mutate({
      id: selectedItem.id as number,
      data: cleanedData,
    });
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setIsEditing(false);
    setEditFormData({});
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

  // Photo management handlers
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !selectedItem) return;

    uploadPhotosMutation.mutate({
      id: selectedItem.id as number,
      files
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const images = [...(editFormData.images || [])];
    const draggedImage = images[draggedIndex];
    images.splice(draggedIndex, 1);
    images.splice(index, 0, draggedImage);

    setTempImages(images);
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setTempImages([]);
      return;
    }

    const images = [...(editFormData.images || [])];
    const draggedImage = images[draggedIndex];
    images.splice(draggedIndex, 1);
    images.splice(index, 0, draggedImage);

    if (selectedItem) {
      reorderPhotosMutation.mutate({
        id: selectedItem.id as number,
        imageUrls: images
      });
    }

    setDraggedIndex(null);
    setTempImages([]);
  };

  const handleDeletePhoto = (imageUrl: string) => {
    if (!selectedItem) return;
    if (!confirm('Are you sure you want to delete this photo?')) return;

    deletePhotoMutation.mutate({
      id: selectedItem.id as number,
      imageUrl
    });
  };

  const displayImages = tempImages.length > 0 ? tempImages : (editFormData.images || []);

  return (
    <AdminLayout
      title="Inventory"
      description="Manage your vehicle inventory and pricing"
    >
      <div className="space-y-6">
        {/* Header with Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search inventory..."
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
              onClick={() => setStatusFilter("available")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === "available"
                  ? "bg-green-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Available
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
              onClick={() => setStatusFilter("sold")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === "sold"
                  ? "bg-red-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Sold
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="m3-card p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Vehicles</p>
            <p className="text-2xl font-bold text-foreground">
              {data?.pagination?.total ?? 0}
            </p>
          </div>
          <div className="m3-card p-4">
            <p className="text-sm text-muted-foreground mb-1">
              Average Price
            </p>
            <p className="text-2xl font-bold text-foreground">
              {data?.inventory?.length
                ? formatCurrency(
                    data.inventory.reduce((sum, item) => sum + Number(item.price), 0) /
                      data.inventory.length
                  )
                : "$0"}
            </p>
          </div>
          <div className="m3-card p-4">
            <p className="text-sm text-muted-foreground mb-1">
              Total Inventory Value
            </p>
            <p className="text-2xl font-bold text-foreground">
              {data?.inventory?.length
                ? formatCurrency(
                    data.inventory.reduce((sum, item) => sum + Number(item.price), 0)
                  )
                : "$0"}
            </p>
          </div>
        </div>

        {/* Inventory Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="m3-card overflow-hidden animate-pulse">
                <div className="h-48 bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="m3-card p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No vehicles found
            </h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search query"
                : "Your inventory vehicles will appear here"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInventory.map((item) => (
              <div
                key={item.id}
                className="m3-card overflow-hidden hover:shadow-lg transition-shadow group flex flex-col"
              >
                {/* Vehicle Image */}
                <div className="relative h-48 bg-muted overflow-hidden flex-shrink-0">
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0]}
                      alt={`${item.year} ${item.make} ${item.model}`}
                      onClick={() => openGallery(item.images, 0)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium ${
                        item.status === "available"
                          ? "bg-green-600 text-white"
                          : item.status === "pending"
                          ? "bg-yellow-600 text-white"
                          : "bg-red-600 text-white"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* Vehicle Details */}
                <div className="p-4 flex flex-col flex-grow">
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {item.year} {item.make} {item.model}
                      {item.trim && ` ${item.trim}`}
                    </h3>

                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl font-bold text-primary">
                        {formatCurrency(item.price)}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cost:</span>
                        <span className="font-medium text-foreground">
                          {item.cost ? formatCurrency(item.cost) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mileage:</span>
                        <span className="font-medium text-foreground">
                          {item.mileage.toLocaleString()} mi
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">VIN:</span>
                        <span className="font-medium text-foreground text-xs">
                          {item.vin.slice(-8)}
                        </span>
                      </div>
                    </div>

                    {item.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons - Always at bottom */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setIsEditing(false);
                      }}
                      className="flex-1 m3-button-outlined text-sm flex items-center justify-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => handleEditClick(item)}
                      className="flex-1 m3-button-filled text-sm flex items-center justify-center gap-1"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
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

      {/* Detail/Edit Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={handleCloseModal}
        >
          <div
            className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-border sticky top-0 bg-background z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {isEditing ? "Edit Vehicle" : "Vehicle Details"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedItem.year} {selectedItem.make} {selectedItem.model}
                    {selectedItem.trim && ` ${selectedItem.trim}`}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {isEditing ? (
                <>
                  {/* Edit Form */}
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div>
                      <h3 className="font-semibold text-foreground mb-4">Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Year *
                          </label>
                          <input
                            type="number"
                            value={editFormData.year || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, year: e.target.value ? Number(e.target.value) : undefined as any })}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Make *
                          </label>
                          <input
                            type="text"
                            value={editFormData.make || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, make: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Model *
                          </label>
                          <input
                            type="text"
                            value={editFormData.model || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, model: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Trim
                          </label>
                          <input
                            type="text"
                            value={editFormData.trim || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, trim: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            VIN *
                          </label>
                          <input
                            type="text"
                            value={editFormData.vin || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, vin: e.target.value.toUpperCase() })}
                            maxLength={17}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground font-mono"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Mileage *
                          </label>
                          <input
                            type="number"
                            value={editFormData.mileage || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, mileage: e.target.value ? Number(e.target.value) : undefined as any })}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Price *
                          </label>
                          <input
                            type="number"
                            value={editFormData.price || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value ? Number(e.target.value) : undefined as any })}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Cost
                          </label>
                          <input
                            type="number"
                            value={editFormData.cost || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, cost: e.target.value ? Number(e.target.value) : undefined as any })}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Exterior Color
                          </label>
                          <select
                            value={editFormData.exteriorColor || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, exteriorColor: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                          >
                            <option value="">Select...</option>
                            <option value="Black">Black</option>
                            <option value="White">White</option>
                            <option value="Silver">Silver</option>
                            <option value="Gray">Gray</option>
                            <option value="Red">Red</option>
                            <option value="Blue">Blue</option>
                            <option value="Green">Green</option>
                            <option value="Brown">Brown</option>
                            <option value="Beige">Beige</option>
                            <option value="Gold">Gold</option>
                            <option value="Orange">Orange</option>
                            <option value="Yellow">Yellow</option>
                            <option value="Purple">Purple</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Interior Color
                          </label>
                          <select
                            value={editFormData.interiorColor || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, interiorColor: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                          >
                            <option value="">Select...</option>
                            <option value="Black">Black</option>
                            <option value="Gray">Gray</option>
                            <option value="Beige">Beige</option>
                            <option value="Tan">Tan</option>
                            <option value="Brown">Brown</option>
                            <option value="White">White</option>
                            <option value="Red">Red</option>
                            <option value="Blue">Blue</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Transmission
                          </label>
                          <select
                            value={editFormData.transmission || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, transmission: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                          >
                            <option value="">Select...</option>
                            <option value="Automatic">Automatic</option>
                            <option value="Manual">Manual</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Fuel Type
                          </label>
                          <select
                            value={editFormData.fuelType || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, fuelType: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                          >
                            <option value="">Select...</option>
                            <option value="Gasoline">Gasoline</option>
                            <option value="Diesel">Diesel</option>
                            <option value="Electric">Electric</option>
                            <option value="Hybrid">Hybrid</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Title Status
                          </label>
                          <select
                            value={editFormData.titleStatus || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, titleStatus: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                          >
                            <option value="">Select...</option>
                            <option value="Clean">Clean</option>
                            <option value="Salvage">Salvage</option>
                            <option value="Junk">Junk</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Description
                      </label>
                      <textarea
                        value={editFormData.description || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground resize-none"
                        placeholder="Enter vehicle description..."
                      />
                    </div>

                    {/* Photo Management */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-3">
                        Vehicle Photos
                      </label>

                      {/* Upload Button */}
                      <div className="mb-4">
                        <input
                          type="file"
                          id="photo-upload"
                          multiple
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="photo-upload"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg cursor-pointer hover:bg-primary/90 transition-colors"
                        >
                          <Upload className="w-4 h-4" />
                          {uploadPhotosMutation.isPending ? 'Uploading...' : 'Upload Photos'}
                        </label>
                        <p className="text-xs text-muted-foreground mt-2">
                          Drag photos to reorder. First photo is the primary image.
                        </p>
                      </div>

                      {/* Photo Grid */}
                      {displayImages.length > 0 && (
                        <div className="grid grid-cols-3 gap-3">
                          {displayImages.map((img, idx) => (
                            <div
                              key={idx}
                              draggable
                              onDragStart={() => handleDragStart(idx)}
                              onDragOver={(e) => handleDragOver(e, idx)}
                              onDrop={() => handleDrop(idx)}
                              className={`relative group cursor-move rounded-lg overflow-hidden border-2 ${
                                idx === 0 ? 'border-primary' : 'border-border'
                              } ${draggedIndex === idx ? 'opacity-50' : ''}`}
                            >
                              <img
                                src={img}
                                alt={`Photo ${idx + 1}`}
                                className="w-full h-24 object-cover"
                              />
                              {idx === 0 && (
                                <div className="absolute top-1 left-1 bg-primary text-white text-xs px-2 py-1 rounded">
                                  Primary
                                </div>
                              )}
                              <button
                                onClick={() => handleDeletePhoto(img)}
                                disabled={deletePhotoMutation.isPending}
                                className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete photo"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {displayImages.length === 0 && (
                        <p className="text-sm text-muted-foreground">No photos uploaded yet.</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 pt-4 border-t border-border">
                      <button
                        onClick={handleSaveEdit}
                        disabled={updateMutation.isPending}
                        className="w-full m3-button-filled flex items-center justify-center gap-2"
                      >
                        <Save className="w-5 h-5" />
                        {updateMutation.isPending ? "Saving..." : "Save Changes"}
                      </button>

                      {/* Status Change Buttons */}
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() =>
                            handleStatusChange(selectedItem.id as number, "available")
                          }
                          disabled={
                            updateMutation.isPending ||
                            selectedItem.status === "available"
                          }
                          className="m3-button-outlined bg-green-50 border-green-600 text-green-600 hover:bg-green-100 disabled:opacity-50"
                        >
                          Mark Available
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(selectedItem.id as number, "pending")
                          }
                          disabled={
                            updateMutation.isPending ||
                            selectedItem.status === "pending"
                          }
                          className="m3-button-outlined bg-yellow-50 border-yellow-600 text-yellow-600 hover:bg-yellow-100 disabled:opacity-50"
                        >
                          Mark Pending
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(selectedItem.id as number, "sold")
                          }
                          disabled={
                            updateMutation.isPending ||
                            selectedItem.status === "sold"
                          }
                          className="m3-button-outlined bg-primary/10 border-primary text-primary hover:bg-primary/20 disabled:opacity-50"
                        >
                          Mark Sold
                        </button>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={deleteMutation.isPending}
                        className="m3-button-outlined border-red-600 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-5 h-5 mr-2" />
                        Delete Vehicle
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* View Mode */}
                  {/* Images */}
                  {selectedItem.images && selectedItem.images.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-3">
                        Photos ({selectedItem.images.length})
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {selectedItem.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`Vehicle ${idx + 1}`}
                            onClick={() => openGallery(selectedItem.images, idx)}
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
                        <p className="font-medium text-foreground">
                          {selectedItem.vin}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Mileage:</span>
                        <p className="font-medium text-foreground">
                          {selectedItem.mileage.toLocaleString()} miles
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Price:</span>
                        <p className="font-medium text-foreground">
                          {formatCurrency(selectedItem.price)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cost:</span>
                        <p className="font-medium text-foreground">
                          {selectedItem.cost ? formatCurrency(selectedItem.cost) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Exterior Color:</span>
                        <p className="font-medium text-foreground">
                          {selectedItem.exteriorColor || selectedItem.exterior_color || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Interior Color:</span>
                        <p className="font-medium text-foreground">
                          {selectedItem.interiorColor || selectedItem.interior_color || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Transmission:</span>
                        <p className="font-medium text-foreground">
                          {selectedItem.transmission || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Title Status:</span>
                        <p className="font-medium text-foreground">
                          {selectedItem.titleStatus || selectedItem.title_status || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Added:</span>
                        <p className="font-medium text-foreground">
                          {formatDate(selectedItem.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedItem.description && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-3">
                        Description
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedItem.description}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && selectedItem && (
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
                  Delete Vehicle
                </h3>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete this vehicle from inventory?
                </p>
                <p className="text-sm font-medium text-foreground mt-2">
                  {selectedItem.year} {selectedItem.make} {selectedItem.model}
                  {selectedItem.trim && ` ${selectedItem.trim}`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  VIN: {selectedItem.vin}
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
                onClick={() => deleteMutation.mutate(selectedItem.id as number)}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
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
    </AdminLayout>
  );
}
