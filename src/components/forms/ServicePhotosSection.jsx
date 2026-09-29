import React from "react";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2 } from "lucide-react";
import { getServiceCover } from "@/lib/serviceCovers";

// Shared service photo section — used by the create form and the service edit page.
// Real work photos are optional; without them the listing shows the auto-assigned
// category cover.
export default function ServicePhotosSection({
  category,
  photos,
  uploading,
  onFilesSelected,
  onRemovePhoto,
  maxPhotos = 5,
}) {
  const cover = getServiceCover(category);

  return (
    <div>
      <Label className="text-base font-semibold mb-1 block">Photos</Label>
      <p className="text-sm text-gray-500 mb-3">
        Real photos of your work (like before/after shots) help members trust your
        listing. They're optional — without them, we'll show a cover image for your
        category.
      </p>

      {photos.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <div key={index} className="relative aspect-square rounded-xl overflow-hidden border-2 border-blue-200">
                <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => onRemovePhoto(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {photos.length < maxPhotos && (
              <label className="aspect-square border-2 border-dashed border-blue-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onFilesSelected}
                  className="hidden"
                  disabled={uploading}
                />
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-blue-400 mb-2" />
                    <span className="text-sm text-gray-600">Upload</span>
                  </>
                )}
              </label>
            )}
          </div>
          <p className="text-xs text-green-600 mt-2">
            Real photos will display on your listing instead of the category cover.
          </p>
        </>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-48 rounded-xl overflow-hidden border-2 border-blue-200 flex-shrink-0">
            <div className="aspect-[4/3] bg-blue-50">
              <img src={cover} alt={`${category} cover image`} className="w-full h-full object-cover" />
            </div>
          </div>
          <label className="flex-1 border-2 border-dashed border-blue-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors py-8 px-4">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onFilesSelected}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? (
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-2" />
            ) : (
              <Upload className="w-8 h-8 text-blue-400 mb-2" />
            )}
            <span className="text-sm font-medium text-gray-700">
              Add real photos (optional)
            </span>
            <span className="text-xs text-gray-500 mt-1">
              Your listing will use this {category} cover until you do
            </span>
          </label>
        </div>
      )}
    </div>
  );
}