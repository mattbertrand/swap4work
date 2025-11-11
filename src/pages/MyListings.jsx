import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Package, Clock, Eye, Edit, Trash2, MessageSquare, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";

export default function MyListings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [deleteItemId, setDeleteItemId] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['myItems', user?.id],
    queryFn: () => base44.entities.Item.filter({ offerer_id: user.id }, '-created_date'),
    enabled: !!user
  });

  // Fetch negotiations for each item
  const { data: allNegotiations = [] } = useQuery({
    queryKey: ['itemNegotiations', user?.id],
    queryFn: async () => {
      if (!user || items.length === 0) return [];
      const itemIds = items.map(item => item.id);
      const negs = await base44.entities.Negotiation.filter({ 
        item_id: { $in: itemIds }
      });
      console.log('📥 Loaded negotiations for items:', negs.length);
      return negs;
    },
    enabled: !!user && items.length > 0
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId) => base44.entities.Item.delete(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries(['myItems']);
      setDeleteItemId(null);
    }
  });

  const handleDeleteItem = () => {
    if (deleteItemId) {
      deleteItemMutation.mutate(deleteItemId);
    }
  };

  const activeItems = items.filter(item => item.status === 'active');
  const inProgressItems = items.filter(item => ['in_negotiation', 'locked'].includes(item.status));
  const completedItems = items.filter(item => ['completed', 'cancelled'].includes(item.status));

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to view your listings</p>
          <Button onClick={() => base44.auth.redirectToLogin()}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const ItemCard = ({ item }) => {
    const canEdit = ['active', 'in_negotiation'].includes(item.status);
    const itemNegotiations = allNegotiations.filter(n => n.item_id === item.id);
    const activeNegotiations = itemNegotiations.filter(n => n.status === 'active');
    
    return (
      <Card className="hover:shadow-lg transition-shadow border-orange-100">
        <CardContent className="p-5">
          <div className="flex gap-4 mb-4">
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              {item.photos?.[0] ? (
                <img src={item.photos[0]} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-gray-300" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-lg text-gray-900 truncate">{item.title}</h3>
                <Badge className={
                  item.status === 'active' ? 'bg-green-100 text-green-700' :
                  item.status === 'in_negotiation' ? 'bg-blue-100 text-blue-700' :
                  item.status === 'locked' ? 'bg-purple-100 text-purple-700' :
                  'bg-gray-100 text-gray-700'
                }>
                  {item.status.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-orange-600 font-medium">
                  <Clock className="w-4 h-4" />
                  <span>{item.required_hours}h</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs">
                    Listed {formatDistanceToNow(new Date(item.created_date), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Negotiations Section */}
          {activeNegotiations.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-900">
                    {activeNegotiations.length} Active Negotiation{activeNegotiations.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {activeNegotiations.slice(0, 3).map(negotiation => (
                  <Link 
                    key={negotiation.id}
                    to={createPageUrl(`Negotiation?id=${negotiation.id}`)}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-2 bg-white rounded hover:bg-blue-50 transition-colors">
                      <span className="text-xs text-gray-700 font-medium">
                        {negotiation.bidder_name}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {negotiation.counter_offer_hours || negotiation.initial_offer_hours}h
                        </Badge>
                        <span className="text-xs text-blue-600">View →</span>
                      </div>
                    </div>
                  </Link>
                ))}
                {activeNegotiations.length > 3 && (
                  <p className="text-xs text-blue-600 text-center">
                    +{activeNegotiations.length - 3} more
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Link to={createPageUrl(`ItemDetail?id=${item.id}`)} className="flex-1">
              <Button variant="outline" className="w-full">
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
            </Link>
            {canEdit && (
              <Link to={createPageUrl(`EditItem?id=${item.id}`)} className="flex-1">
                <Button className="w-full bg-orange-600 hover:bg-orange-700">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
            )}
            <Button
              onClick={() => setDeleteItemId(item.id)}
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
            <p className="text-gray-500 mt-1">Manage your item listings</p>
          </div>
          <Link to={createPageUrl("CreateItem")}>
            <Button className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700">
              <Plus className="w-5 h-5 mr-2" />
              New Listing
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="active">Active ({activeItems.length})</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress ({inProgressItems.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedItems.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {isLoading ? (
              <div className="grid gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : activeItems.length === 0 ? (
              <div className="text-center py-16">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No active listings</h3>
                <p className="text-gray-500 mb-4">Create your first listing to get started</p>
                <Link to={createPageUrl("CreateItem")}>
                  <Button>Create Listing</Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {activeItems.map(item => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="in_progress">
            {inProgressItems.length === 0 ? (
              <div className="text-center py-16">
                <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No items in progress</h3>
                <p className="text-gray-500">Items being negotiated or worked on will appear here</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {inProgressItems.map(item => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedItems.length === 0 ? (
              <div className="text-center py-16">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No completed items</h3>
                <p className="text-gray-500">Completed trades will appear here</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {completedItems.map(item => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Item</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this item? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteItem}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}