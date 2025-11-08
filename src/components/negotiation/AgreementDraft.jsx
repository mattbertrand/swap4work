import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, MapPin, Calendar, FileText, Edit, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AgreementDraft({ 
  negotiation, 
  item, 
  isOfferer, 
  hasConfirmed, 
  otherPartyConfirmed,
  onConfirm,
  onEdit,
  onCancel 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    location: negotiation.location || "",
    due_date: negotiation.due_date || "",
    notes: negotiation.notes || ""
  });

  const bothConfirmed = hasConfirmed && otherPartyConfirmed;

  const handleSaveEdit = () => {
    onEdit(editData);
    setIsEditing(false);
  };

  return (
    <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
      <CardHeader className="border-b border-green-200">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-green-900">
            <Sparkles className="w-6 h-6 text-green-600" />
            Agreement Draft
          </CardTitle>
          {bothConfirmed ? (
            <Badge className="bg-green-600 text-white">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Confirmed by Both
            </Badge>
          ) : (
            <Badge className="bg-yellow-100 text-yellow-700">
              Pending Confirmation
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Summary */}
        <div className="bg-white rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <div>
              <h3 className="font-bold text-xl text-gray-900">{item.title}</h3>
              <p className="text-sm text-gray-500">Item Category: {item.category}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <Clock className="w-5 h-5 text-orange-600" />
                <span className="text-3xl font-bold text-gray-900">{negotiation.agreed_hours}</span>
                <span className="text-lg text-gray-600">hours</span>
              </div>
              {negotiation.work_type && (
                <p className="text-sm text-gray-600 mt-1">{negotiation.work_type}</p>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-3 pt-3">
              <div>
                <Label htmlFor="location">Work Location</Label>
                <div className="flex items-center gap-2 mt-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <Input
                    id="location"
                    value={editData.location}
                    onChange={(e) => setEditData({...editData, location: e.target.value})}
                    placeholder="Where will the work be performed?"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="due_date">Due Date</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <Input
                    id="due_date"
                    type="date"
                    value={editData.due_date}
                    onChange={(e) => setEditData({...editData, due_date: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <div className="flex items-start gap-2 mt-2">
                  <FileText className="w-4 h-4 text-gray-400 mt-3" />
                  <Textarea
                    id="notes"
                    value={editData.notes}
                    onChange={(e) => setEditData({...editData, notes: e.target.value})}
                    placeholder="Any special instructions or requirements..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSaveEdit} className="flex-1 bg-green-600 hover:bg-green-700">
                  Save Changes
                </Button>
                <Button onClick={() => setIsEditing(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-700">Location</p>
                  <p className="text-gray-900">{negotiation.location || "Not specified"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-700">Due Date</p>
                  <p className="text-gray-900">
                    {negotiation.due_date 
                      ? new Date(negotiation.due_date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      : "To be determined"
                    }
                  </p>
                </div>
              </div>

              {negotiation.notes && (
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Notes</p>
                    <p className="text-gray-900 whitespace-pre-wrap">{negotiation.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Confirmation Status */}
        {!bothConfirmed && (
          <Alert className={hasConfirmed ? "bg-blue-50 border-blue-200" : "bg-yellow-50 border-yellow-200"}>
            <AlertDescription className={hasConfirmed ? "text-blue-900" : "text-yellow-900"}>
              {hasConfirmed ? (
                <>
                  <CheckCircle2 className="w-4 h-4 inline mr-2" />
                  You've confirmed. Waiting for {isOfferer ? negotiation.bidder_name : negotiation.offerer_name} to confirm.
                </>
              ) : (
                <>
                  Please review the terms carefully before confirming this agreement.
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        {!bothConfirmed && (
          <div className="flex gap-3 pt-2">
            {!hasConfirmed ? (
              <>
                <Button
                  onClick={onConfirm}
                  className="flex-1 bg-green-600 hover:bg-green-700 h-12"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Confirm Agreement
                </Button>
                {!isEditing && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    className="h-12"
                  >
                    <Edit className="w-5 h-5 mr-2" />
                    Edit Terms
                  </Button>
                )}
              </>
            ) : (
              <Button
                onClick={onCancel}
                variant="outline"
                className="w-full h-12"
              >
                Cancel Negotiation
              </Button>
            )}
          </div>
        )}

        {bothConfirmed && (
          <Alert className="bg-green-100 border-green-300">
            <AlertDescription className="text-green-900 font-semibold text-center">
              🎉 Agreement confirmed! You're now trading your time for something real.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}