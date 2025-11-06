import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateItem() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Electronics",
    condition: "Good",
    required_hours: "",
    location: "",
    suggested_tasks: "",
    offerer_terms: "",
    estimated_value: "",
    photos: []
  });

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.file_url);
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...urls]
      }));
    } catch (error) {
      console.error("Error uploading files:", error);
    }
    setUploading(false);
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.photos.length < 3) {
      alert("Please upload at least 3 photos");
      return;
    }

    setLoading(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.Item.create({
        ...formData,
        required_hours: parseFloat(formData.required_hours),
        estimated_value: parseFloat(formData.estimated_value) || 0,
        offerer_id: user.id,
        offerer_name: user.full_name,
        status: "active"
      });
      navigate(createPageUrl("MyListings"));
    } catch (error) {
      console.error("Error creating item:", error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 hover:bg-orange-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="border-orange-100 shadow-xl">
          <CardHeader className="border-b border-orange-100">
            <CardTitle className="text-2xl font-bold">List a New Item</CardTitle>
            <p className="text-gray-500">Fill in the details about the item you want to trade</p>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Photos Upload */}
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Item Photos <span className="text-red-500">*</span> (minimum 3)
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden border-2 border-orange-200">
                      <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  {formData.photos.length < 5 && (
                    <label className="aspect-square border-2 border-dashed border-orange-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                      {uploading ? (
                        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-orange-400 mb-2" />
                          <span className="text-sm text-gray-600">Upload</span>
                        </>
                      )}
                    </label>
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="title">Item Title <span className="text-red-500">*</span></Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g., MacBook Pro 2020"
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Home Goods">Home Goods</SelectItem>
                      <SelectItem value="Furniture">Furniture</SelectItem>
                      <SelectItem value="Appliances">Appliances</SelectItem>
                      <SelectItem value="Tools">Tools</SelectItem>
                      <SelectItem value="Sports Equipment">Sports Equipment</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="condition">Condition <span className="text-red-500">*</span></Label>
                  <Select value={formData.condition} onValueChange={(value) => setFormData({...formData, condition: value})}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Like New">Like New</SelectItem>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Fair">Fair</SelectItem>
                      <SelectItem value="Poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="required_hours">Required Work Hours <span className="text-red-500">*</span></Label>
                  <Input
                    id="required_hours"
                    type="number"
                    min="1"
                    step="0.5"
                    value={formData.required_hours}
                    onChange={(e) => setFormData({...formData, required_hours: e.target.value})}
                    placeholder="e.g., 40"
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="location">Location <span className="text-red-500">*</span></Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="City or ZIP code"
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="estimated_value">Estimated Value ($)</Label>
                  <Input
                    id="estimated_value"
                    type="number"
                    min="0"
                    value={formData.estimated_value}
                    onChange={(e) => setFormData({...formData, estimated_value: e.target.value})}
                    placeholder="e.g., 1200"
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Detailed description of the item..."
                  rows={4}
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="suggested_tasks">Suggested Tasks</Label>
                <Textarea
                  id="suggested_tasks"
                  value={formData.suggested_tasks}
                  onChange={(e) => setFormData({...formData, suggested_tasks: e.target.value})}
                  placeholder="e.g., Clean garage, organize storage, help with moving..."
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="offerer_terms">Your Terms (non-negotiable)</Label>
                <Textarea
                  id="offerer_terms"
                  value={formData.offerer_terms}
                  onChange={(e) => setFormData({...formData, offerer_terms: e.target.value})}
                  placeholder="e.g., Must pick up item in person, work must be completed within 2 weeks..."
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || formData.photos.length < 3}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "List Item"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}