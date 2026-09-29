import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle2, XCircle, Award, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function AdminDisputes() {
  const queryClient = useQueryClient();
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolution, setResolution] = useState("");
  const [partialCredit, setPartialCredit] = useState("");
  const [karmaAdjustments, setKarmaAdjustments] = useState({});

  const { data: disputes = [], isLoading } = useQuery({
    queryKey: ['disputes'],
    queryFn: () => base44.entities.Dispute.list('-created_date'),
  });

  const { data: agreements = [] } = useQuery({
    queryKey: ['agreements'],
    queryFn: () => base44.entities.Agreement.list(),
  });

  const resolveDisputeMutation = useMutation({
    // All privileged resolution writes (dispute record, karma, user
    // suspension, agreement/item state) happen server-side in the
    // admin-only resolveDispute backend function.
    mutationFn: ({ disputeId, action, resolution, partialCredit }) =>
      base44.functions.invoke('resolveDispute', {
        dispute_id: disputeId,
        action,
        resolution,
        partial_credit: partialCredit ? parseFloat(partialCredit) : null
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['disputes']);
      queryClient.invalidateQueries(['agreements']);
      setSelectedDispute(null);
    }
  });

  const openDisputes = disputes.filter(d => d.status === 'open');
  const underReviewDisputes = disputes.filter(d => d.status === 'under_review');
  const resolvedDisputes = disputes.filter(d => d.status === 'resolved' || d.status === 'closed');

  const handleResolveDispute = (action) => {
    if (!selectedDispute) return;
    resolveDisputeMutation.mutate({
      disputeId: selectedDispute.id,
      action,
      resolution,
      partialCredit
    });
  };

  const DisputeCard = ({ dispute }) => {
    const agreement = agreements.find(a => a.id === dispute.agreement_id);

    return (
      <Card 
        className="hover:shadow-lg transition-shadow cursor-pointer border-orange-100"
        onClick={() => setSelectedDispute(dispute)}
      >
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-bold text-lg text-gray-900">{agreement?.item_title || 'Agreement'}</h3>
              <p className="text-sm text-gray-500">Opened by {dispute.opened_by_name}</p>
            </div>
            <Badge className={
              dispute.status === 'open' ? 'bg-red-100 text-red-700' :
              dispute.status === 'under_review' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }>
              {dispute.status.replace('_', ' ')}
            </Badge>
          </div>

          <div className="mb-3">
            <Badge variant="outline" className="mb-2">
              {dispute.reason.replace(/_/g, ' ')}
            </Badge>
            <p className="text-sm text-gray-600 line-clamp-2">{dispute.description}</p>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{format(new Date(dispute.created_date), 'MMM d, yyyy')}</span>
            {dispute.evidence?.length > 0 && (
              <span>{dispute.evidence.length} evidence file(s)</span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dispute Management</h1>
          <p className="text-gray-500 mt-1">Review and resolve agreement disputes</p>
        </div>

        <Tabs defaultValue="open" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="open">
              Open ({openDisputes.length})
            </TabsTrigger>
            <TabsTrigger value="under_review">
              Under Review ({underReviewDisputes.length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved ({resolvedDisputes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="open">
            {openDisputes.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No open disputes</h3>
                <p className="text-gray-500">All disputes have been reviewed or resolved</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {openDisputes.map(dispute => (
                  <DisputeCard key={dispute.id} dispute={dispute} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="under_review">
            {underReviewDisputes.length === 0 ? (
              <div className="text-center py-16">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No disputes under review</h3>
                <p className="text-gray-500">Disputes being reviewed will appear here</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {underReviewDisputes.map(dispute => (
                  <DisputeCard key={dispute.id} dispute={dispute} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="resolved">
            {resolvedDisputes.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No resolved disputes</h3>
                <p className="text-gray-500">Resolved disputes will appear here</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {resolvedDisputes.map(dispute => (
                  <DisputeCard key={dispute.id} dispute={dispute} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dispute Resolution Modal */}
      <Dialog open={!!selectedDispute} onOpenChange={() => setSelectedDispute(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Dispute Resolution
            </DialogTitle>
          </DialogHeader>

          {selectedDispute && (() => {
            const agreement = agreements.find(a => a.id === selectedDispute.agreement_id);
            return (
              <div className="space-y-6">
                {/* Dispute Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Dispute Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Item:</strong> {agreement?.item_title}</p>
                    <p><strong>Opened by:</strong> {selectedDispute.opened_by_name}</p>
                    <p><strong>Reason:</strong> {selectedDispute.reason.replace(/_/g, ' ')}</p>
                    <p><strong>Date:</strong> {format(new Date(selectedDispute.created_date), 'MMM d, yyyy h:mm a')}</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label className="font-semibold">Description</Label>
                  <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-3 rounded-lg">
                    {selectedDispute.description}
                  </p>
                </div>

                {/* Agreement Details */}
                {agreement && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Agreement Status</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Offerer</p>
                        <p className="font-medium">{agreement.offerer_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Worker</p>
                        <p className="font-medium">{agreement.worker_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Agreed Hours</p>
                        <p className="font-medium">{agreement.agreed_hours}h</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Hours Logged</p>
                        <p className="font-medium">{agreement.hours_logged}h</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Evidence */}
                {selectedDispute.evidence && selectedDispute.evidence.length > 0 && (
                  <div>
                    <Label className="font-semibold">Evidence</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {selectedDispute.evidence.map((url, idx) => (
                        <img key={idx} src={url} alt={`Evidence ${idx + 1}`} className="w-full h-24 object-cover rounded-lg" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Resolution Form */}
                {selectedDispute.status !== 'resolved' && selectedDispute.status !== 'closed' && (
                  <>
                    <div>
                      <Label htmlFor="resolution">Resolution Notes</Label>
                      <Textarea
                        id="resolution"
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        placeholder="Enter your resolution notes..."
                        rows={4}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="partialCredit">Partial Credit % (optional)</Label>
                      <Input
                        id="partialCredit"
                        type="number"
                        min="0"
                        max="100"
                        value={partialCredit}
                        onChange={(e) => setPartialCredit(e.target.value)}
                        placeholder="0-100"
                        className="mt-2"
                      />
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                      <Button
                        onClick={() => handleResolveDispute('approve_mutual')}
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Approve Mutual Cancel
                      </Button>
                      <Button
                        onClick={() => handleResolveDispute('award_partial')}
                        disabled={!partialCredit}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                      >
                        <Award className="w-4 h-4 mr-2" />
                        Award Partial Credit
                      </Button>
                      <Button
                        onClick={() => handleResolveDispute('strike_offerer')}
                        className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Strike Offerer
                      </Button>
                    </DialogFooter>
                  </>
                )}

                {/* Already Resolved */}
                {(selectedDispute.status === 'resolved' || selectedDispute.status === 'closed') && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2 text-green-900">Resolution</h3>
                    <p className="text-sm text-green-800 mb-2">{selectedDispute.resolution}</p>
                    <p className="text-xs text-green-600">
                      Resolved by {selectedDispute.resolved_by_name} on {format(new Date(selectedDispute.resolved_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}