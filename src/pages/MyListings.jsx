import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Package, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MyListings() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['myItems', user?.id],
    queryFn: () => base44.entities.Item.filter({ offerer_id: user.id }, '-created_date'),
    enabled: !!user
  });

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

  const ItemCard = ({ item }) => (
    <Link to={createPageUrl(`ItemDetail?id=${item.id}`)}>
      <Card className="hover:shadow-lg transition-shadow border-orange-100 cursor-pointer">
        <CardContent className="p-5">
          <div className="flex gap-4">
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
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-orange-600 font-medium">
                  <Clock className="w-4 h-4" />
                  <span>{item.required_hours}h</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Eye className="w-4 h-4" />
                  <span>{item.category}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

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
      </div>
    </div>
  );
}