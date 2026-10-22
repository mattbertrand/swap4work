import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { displayName } from "@/lib/names";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { formatDuration } from "@/lib/duration";
import { createPageUrl } from "@/utils";
import { Plus, Package, Clock, Eye, Edit, Trash2, MessageSquare, Calendar } from "lucide-react";
import AuthModal from "@/components/auth/AuthModal";
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
import { useLanguage } from "@/i18n/LanguageContext";

export default function MyListings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAuthChecked(true); }).catch(() => { setUser(null); setAuthChecked(true); });
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

  if (!authChecked) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div></div>;
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{t("nav.my_listings")}</h1>
                <p className="text-gray-500 mt-1">{t("listings.manage_sub")}</p>
              </div>
              <Button
                onClick={() => setAuthModalOpen(true)}
                className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                {t("listings.new_listing")}
              </Button>
            </div>
            <div className="text-center py-24">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{t("listings.login_to_manage")}</h2>
              <p className="text-gray-500 mb-6">{t("listings.login_to_manage_sub")}</p>
              <Button onClick={() => setAuthModalOpen(true)} className="bg-gradient-to-r from-orange-500 to-amber-600">
                {t("common.create_free_account")}
              </Button>
            </div>
          </div>
        </div>
        <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} message={t("listings.auth_continue")} />
      </>
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
              {(item.photos?.[0] || item.cover_image) ? (
                <img src={item.photos?.[0] || item.cover_image} alt={item.title} className="w-full h-full object-cover" />
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
                  {t(`status.${item.status}`)}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-orange-600 font-medium">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(item.required_hours)}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs">
                    {formatDistanceToNow(new Date(item.created_date?.endsWith('Z') ? item.created_date : item.created_date + 'Z'), { addSuffix: true })}
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
                    {t("listings.n_active_negotiations", { n: activeNegotiations.length })}
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
                        {displayName(negotiation.bidder_name)}
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
                    {t("listings.more", { n: activeNegotiations.length - 3 })}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Link to={createPageUrl(`ItemDetail?id=${item.id}`)} className="flex-1">
              <Button variant="outline" className="w-full">
                <Eye className="w-4 h-4 mr-2" />
                {t("listings.view")}
              </Button>
            </Link>
            {canEdit && (
              <Link to={createPageUrl(`${item.listing_type === 'service' ? 'EditService' : 'EditItem'}?id=${item.id}`)} className="flex-1">
                <Button className="w-full bg-orange-600 hover:bg-orange-700">
                  <Edit className="w-4 h-4 mr-2" />
                  {t("common.edit")}
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
            <h1 className="text-3xl font-bold text-gray-900">{t("nav.my_listings")}</h1>
            <p className="text-gray-500 mt-1">{t("listings.manage_sub")}</p>
          </div>
          <Link to={createPageUrl("CreateItem")}>
            <Button className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700">
              <Plus className="w-5 h-5 mr-2" />
              {t("listings.new_listing")}
            </Button>
          </Link>
        </div>
        <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} message={t("listings.auth_create")} />

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="active">{t("listings.tab_active", { n: activeItems.length })}</TabsTrigger>
            <TabsTrigger value="in_progress">{t("listings.tab_in_progress", { n: inProgressItems.length })}</TabsTrigger>
            <TabsTrigger value="completed">{t("listings.tab_completed", { n: completedItems.length })}</TabsTrigger>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("listings.no_active")}</h3>
                <p className="text-gray-500 mb-4">{t("listings.no_active_sub")}</p>
                <Link to={createPageUrl("CreateItem")}>
                  <Button>{t("listings.create_listing")}</Button>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("listings.no_in_progress")}</h3>
                <p className="text-gray-500">{t("listings.no_in_progress_sub")}</p>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("listings.no_completed")}</h3>
                <p className="text-gray-500">{t("listings.no_completed_sub")}</p>
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
              <AlertDialogTitle>{t("listings.delete_title")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("listings.delete_confirm")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteItem}
                className="bg-red-600 hover:bg-red-700"
              >
                {t("common.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}