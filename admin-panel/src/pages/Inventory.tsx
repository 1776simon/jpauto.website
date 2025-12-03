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
  const [isCreating, setIsCreating] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<InventoryItem>>({});
  const [page, setPage] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isReordering, setIsReordering] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<{url: string, order: number}[]>([]);
  const [vinDecoding, setVinDecoding] = useState(false);
  const [vinStatus, setVinStatus] = useState<{type: 'success' | 'error' | 'loading' | null, message: string}>({type: null, message: ''});

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

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<InventoryItem>) => api.createInventoryItem(data),
    onSuccess: (newItem) => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryStats"] });
      toast.success("Vehicle added to inventory successfully");
      // Keep modal open to allow photo uploads
      setSelectedItem(newItem);
      setIsCreating(false);
      setIsEditing(true);
    },
    onError: (error: Error) => {
      toast.error(`Failed to add vehicle: ${error.message}`);
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
      // No toast message - handled by main update mutation
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
      fuelType: item.fuelType || '',
      drivetrain: item.drivetrain || '',
      engine: item.engine || '',
      mpgCity: item.mpgCity || item.mpg_city || undefined,
      mpgHighway: item.mpgHighway || item.mpg_highway || undefined,
      titleStatus: item.titleStatus || item.title_status || '',
      previousOwners: item.previousOwners || item.previous_owners || '',
      accidentHistory: item.accidentHistory || item.accident_history || '',
      serviceRecordsOnFile: item.serviceRecordsOnFile || item.service_records_on_file || '',
      description: item.description || '',
      images: item.images || [],
    });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    // Auto-apply photo order if user is in reordering mode
    let dataToSave = editFormData;

    if (isReordering) {
      if (selectedPhotos.length > 0) {
        // User selected photos - apply the new order
        const currentImages = editFormData.images || [];
        const selectedUrls = selectedPhotos
          .sort((a, b) => a.order - b.order)
          .map(p => p.url);
        const unselectedUrls = currentImages.filter(url => !selectedUrls.includes(url));
        const newImageOrder = [...selectedUrls, ...unselectedUrls];

        // Update local data with new order
        dataToSave = { ...editFormData, images: newImageOrder };
        setEditFormData(dataToSave);
      }

      // Exit reordering mode regardless
      setIsReordering(false);
      setSelectedPhotos([]);
    }

    // Clean up the data before sending
    const cleanedData: Partial<InventoryItem> = {
      ...dataToSave,
    };

    // Remove empty string values and ensure proper types
    Object.keys(cleanedData).forEach((key) => {
      const value = cleanedData[key as keyof InventoryItem];
      if (value === '' || value === null || value === undefined) {
        delete cleanedData[key as keyof InventoryItem];
      }
    });

    if (isCreating) {
      // Creating new vehicle
      createMutation.mutate(cleanedData);
    } else {
      // Updating existing vehicle
      if (!selectedItem) return;

      // Check if photo order has changed (use dataToSave since it has the latest order)
      const photosChanged = JSON.stringify(dataToSave.images) !== JSON.stringify(selectedItem.images);

      updateMutation.mutate({
        id: selectedItem.id as number,
        data: cleanedData,
      });

      // If photo order changed, also update photo order
      if (photosChanged && dataToSave.images) {
        reorderPhotosMutation.mutate({
          id: selectedItem.id as number,
          imageUrls: dataToSave.images
        });
      }
    }
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setIsEditing(false);
    setIsCreating(false);
    setEditFormData({});
    setVinStatus({ type: null, message: '' });
    setIsReordering(false);
    setSelectedPhotos([]);
  };

  const handleAddNewClick = () => {
    setSelectedItem(null);
    setIsCreating(true);
    setIsEditing(false);
    setEditFormData({
      year: '' as any,
      make: '',
      model: '',
      trim: '',
      vin: '',
      mileage: '' as any,
      price: '' as any,
      cost: '' as any,
      exteriorColor: '',
      interiorColor: '',
      transmission: '',
      fuelType: '',
      drivetrain: '',
      engine: '',
      mpgCity: undefined,
      mpgHighway: undefined,
      titleStatus: '',
      previousOwners: '',
      accidentHistory: '',
      serviceRecordsOnFile: '',
      description: '',
      images: [],
    });
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

  const handleStartReordering = () => {
    setIsReordering(true);
    setSelectedPhotos([]);
  };

  const handleCancelReordering = () => {
    setIsReordering(false);
    setSelectedPhotos([]);
  };

  const handlePhotoClick = (imageUrl: string) => {
    if (!isReordering) return;

    const existingIndex = selectedPhotos.findIndex(p => p.url === imageUrl);

    if (existingIndex !== -1) {
      // Photo is already selected - deselect it and adjust order
      const newSelected = selectedPhotos
        .filter(p => p.url !== imageUrl)
        .map((p, idx) => ({ url: p.url, order: idx + 1 }));
      setSelectedPhotos(newSelected);
    } else {
      // Photo not selected - add it with next order number
      const nextOrder = selectedPhotos.length + 1;
      setSelectedPhotos([...selectedPhotos, { url: imageUrl, order: nextOrder }]);
    }
  };

  const handleDeletePhoto = (imageUrl: string) => {
    if (!selectedItem) return;
    if (!confirm('Are you sure you want to delete this photo?')) return;

    deletePhotoMutation.mutate({
      id: selectedItem.id as number,
      imageUrl
    });
  };

  const displayImages = editFormData.images || [];

  // VIN Decoder Function (using NHTSA API)
  const decodeVIN = async () => {
    const vin = (editFormData.vin || '').trim().toUpperCase();

    // Validate VIN length
    if (vin.length !== 17) {
      setVinStatus({ type: 'error', message: 'VIN must be exactly 17 characters' });
      return;
    }

    setVinDecoding(true);
    setVinStatus({ type: 'loading', message: 'Decoding VIN from NHTSA database...' });

    try {
      // Call NHTSA VIN Decoder API via our backend
      const vehicleData = await api.decodeVIN(vin);

      // Auto-fill form fields with decoded data
      const updates: Partial<InventoryItem> = {};
      if (vehicleData.year) updates.year = vehicleData.year;
      if (vehicleData.make) updates.make = vehicleData.make;
      if (vehicleData.model) updates.model = vehicleData.model;
      if (vehicleData.trim) updates.trim = vehicleData.trim;

      // New fields from NHTSA
      if (vehicleData.engine) updates.engine = vehicleData.engine;
      if (vehicleData.drivetrain) updates.drivetrain = vehicleData.drivetrain;
      if (vehicleData.mpgCity) updates.mpgCity = vehicleData.mpgCity;
      if (vehicleData.mpgHighway) updates.mpgHighway = vehicleData.mpgHighway;
      if (vehicleData.transmission) updates.transmission = vehicleData.transmission;
      if (vehicleData.fuelType) updates.fuelType = vehicleData.fuelType;
      if (vehicleData.bodyType) updates.bodyType = vehicleData.bodyType;
      if (vehicleData.horsepower) updates.horsepower = vehicleData.horsepower;

      setEditFormData({ ...editFormData, ...updates });
      setVinStatus({ type: 'success', message: `✓ Decoded: ${vehicleData.year} ${vehicleData.make} ${vehicleData.model}` });
    } catch (error: any) {
      console.error('VIN decode error:', error);
      setVinStatus({ type: 'error', message: error.message || 'Failed to decode VIN. Please fill in details manually.' });
    } finally {
      setVinDecoding(false);
    }
  };

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
            {/* Add New Vehicle Card */}
            <div
              onClick={handleAddNewClick}
              className="m3-card overflow-hidden hover:shadow-lg transition-shadow group flex flex-col cursor-pointer border-2 border-dashed border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10"
            >
              <div className="h-full flex flex-col items-center justify-center p-8 min-h-[400px]">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Plus className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Add New Vehicle
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  Click to manually add a vehicle to inventory
                </p>
              </div>
            </div>

            {/* Vehicle Cards */}
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
                        <span className="vin-text text-foreground text-sm">
                          {item.vin}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Exterior:</span>
                        <span className="font-medium text-foreground">
                          {item.exteriorColor || item.exterior_color || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Interior:</span>
                        <span className="font-medium text-foreground">
                          {item.interiorColor || item.interior_color || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transmission:</span>
                        <span className="font-medium text-foreground">
                          {item.transmission || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fuel Type:</span>
                        <span className="font-medium text-foreground">
                          {item.fuelType || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Title:</span>
                        <span className="font-medium text-foreground">
                          {item.titleStatus || item.title_status || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button - Always at bottom */}
                  <div className="mt-4">
                    <button
                      onClick={() => handleEditClick(item)}
                      className="w-full m3-button-filled text-sm flex items-center justify-center gap-1"
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
      {(selectedItem || isCreating) && (
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
                    {isCreating ? "Add New Vehicle" : isEditing ? "Edit Vehicle" : "Vehicle Details"}
                  </h2>
                  {selectedItem && (
                    <p className="text-sm text-muted-foreground">
                      {selectedItem.year} {selectedItem.make} {selectedItem.model}
                      {selectedItem.trim && ` ${selectedItem.trim}`}
                    </p>
                  )}
                  {isCreating && (
                    <p className="text-sm text-muted-foreground">
                      Fill in the vehicle details below
                    </p>
                  )}
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
              {(isEditing || isCreating) ? (
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
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-foreground mb-2">
                            VIN * <span className="text-xs text-muted-foreground">(We'll auto-fill details from your VIN)</span>
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editFormData.vin || ''}
                              onChange={(e) => {
                                setEditFormData({ ...editFormData, vin: e.target.value.toUpperCase() });
                                if (vinStatus.type) setVinStatus({ type: null, message: '' });
                              }}
                              maxLength={17}
                              className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground font-mono"
                              required
                            />
                            <button
                              type="button"
                              onClick={decodeVIN}
                              disabled={vinDecoding || (editFormData.vin?.length !== 17)}
                              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {vinDecoding ? 'Decoding...' : 'Decode VIN'}
                            </button>
                          </div>
                          {vinStatus.type && (
                            <div className={`mt-2 text-sm ${
                              vinStatus.type === 'success' ? 'text-green-600' :
                              vinStatus.type === 'error' ? 'text-red-600' :
                              'text-blue-600'
                            }`}>
                              {vinStatus.message}
                            </div>
                          )}
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
                            Drivetrain
                          </label>
                          <select
                            value={editFormData.drivetrain || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, drivetrain: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                          >
                            <option value="">Select...</option>
                            <option value="AWD">AWD</option>
                            <option value="RWD">RWD</option>
                            <option value="FWD">FWD</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Engine
                          </label>
                          <input
                            type="text"
                            value={editFormData.engine || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, engine: e.target.value })}
                            placeholder="e.g., 2.0L 4-Cylinder Turbo"
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            MPG City
                          </label>
                          <input
                            type="number"
                            value={editFormData.mpgCity || ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                              setEditFormData({ ...editFormData, mpgCity: value });
                            }}
                            placeholder="City MPG"
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            MPG Highway
                          </label>
                          <input
                            type="number"
                            value={editFormData.mpgHighway || ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                              setEditFormData({ ...editFormData, mpgHighway: value });
                            }}
                            placeholder="Highway MPG"
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
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

                    {/* Vehicle History Section */}
                    <div className="border-t border-border pt-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4">Vehicle History</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Previous Owners
                          </label>
                          <select
                            value={editFormData.previousOwners || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, previousOwners: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                          >
                            <option value="">Select...</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4+">4+</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Accident History
                          </label>
                          <select
                            value={editFormData.accidentHistory || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, accidentHistory: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                          >
                            <option value="">Select...</option>
                            <option value="No accidents">No accidents</option>
                            <option value="1">1 accident</option>
                            <option value="2">2 accidents</option>
                            <option value="3">3 accidents</option>
                            <option value="4+ accidents">4+ accidents</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Service Records on File
                          </label>
                          <select
                            value={editFormData.serviceRecordsOnFile || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, serviceRecordsOnFile: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                          >
                            <option value="">Select...</option>
                            <option value="Less than 5">Less than 5</option>
                            <option value="5-10">5-10 records</option>
                            <option value="10-20">10-20 records</option>
                            <option value="20+ records">20+ records</option>
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

                      {isCreating ? (
                        <div className="bg-muted/50 border border-dashed border-border rounded-lg p-6 text-center">
                          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Save the vehicle first, then you can upload photos
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Upload and Reorder Buttons */}
                          <div className="mb-4">
                            <div className="flex items-center gap-3 mb-2">
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

                              {!isReordering && displayImages.length > 1 && (
                                <button
                                  onClick={handleStartReordering}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-background border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
                                >
                                  Click to Reorder
                                </button>
                              )}
                            </div>

                            {isReordering && (
                              <div className="flex items-center gap-3 mb-2">
                                <button
                                  onClick={handleCancelReordering}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-background border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                  Cancel
                                </button>
                                <span className="text-sm text-muted-foreground">
                                  {selectedPhotos.length > 0
                                    ? `${selectedPhotos.length} photo${selectedPhotos.length !== 1 ? 's' : ''} selected - scroll down and click "Save Changes"`
                                    : 'Click photos in your desired order'}
                                </span>
                              </div>
                            )}

                            <p className="text-xs text-muted-foreground">
                              {isReordering
                                ? 'Click photos in the order you want them. Click again to deselect.'
                                : 'First photo is the primary image.'}
                            </p>
                          </div>
                        </>
                      )}

                      {/* Photo Grid */}
                      {!isCreating && displayImages.length > 0 && (
                        <div className="grid grid-cols-3 gap-3">
                          {displayImages.map((img, idx) => {
                            const selectedPhoto = selectedPhotos.find(p => p.url === img);
                            const isSelected = !!selectedPhoto;
                            const orderNumber = selectedPhoto?.order;

                            return (
                              <div
                                key={idx}
                                onClick={() => isReordering ? handlePhotoClick(img) : undefined}
                                className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                                  isReordering ? 'cursor-pointer' : ''
                                } ${
                                  isSelected
                                    ? 'border-green-500 ring-2 ring-green-500 ring-offset-2'
                                    : idx === 0
                                    ? 'border-primary'
                                    : 'border-border'
                                } ${isReordering && !isSelected ? 'opacity-60 hover:opacity-80' : ''}`}
                              >
                                <img
                                  src={img}
                                  alt={`Photo ${idx + 1}`}
                                  className="w-full h-24 object-cover"
                                />
                                {idx === 0 && !isReordering && (
                                  <div className="absolute top-1 left-1 bg-primary text-white text-xs px-2 py-1 rounded">
                                    Primary
                                  </div>
                                )}
                                {isReordering && isSelected && (
                                  <div className="absolute top-1 left-1 bg-green-600 text-white text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center shadow-lg">
                                    {orderNumber}
                                  </div>
                                )}
                                {!isReordering && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeletePhoto(img);
                                    }}
                                    disabled={deletePhotoMutation.isPending}
                                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Delete photo"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {!isCreating && displayImages.length === 0 && (
                        <p className="text-sm text-muted-foreground">No photos uploaded yet.</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 pt-4 border-t border-border">
                      <button
                        onClick={handleSaveEdit}
                        disabled={updateMutation.isPending || createMutation.isPending}
                        className="w-full m3-button-filled flex items-center justify-center gap-2"
                      >
                        <Save className="w-5 h-5" />
                        {isCreating
                          ? (createMutation.isPending ? "Adding Vehicle..." : "Add Vehicle")
                          : (updateMutation.isPending ? "Saving..." : "Save Changes")
                        }
                      </button>

                      {/* Status Change Buttons - Only show when editing */}
                      {!isCreating && selectedItem && (
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
                      )}

                      {/* Delete Button - Only show when editing */}
                      {!isCreating && selectedItem && (
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          disabled={deleteMutation.isPending}
                          className="m3-button-outlined border-red-600 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-5 h-5 mr-2" />
                          Delete Vehicle
                        </button>
                      )}
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
                        <p className="vin-text text-foreground text-base">
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
                <p className="text-sm mt-1">
                  <span className="text-muted-foreground">VIN:</span> <span className="vin-text text-foreground">{selectedItem.vin}</span>
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
