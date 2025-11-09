import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, Package, Briefcase, AlertTriangle, 
  TrendingUp, CheckCircle2, Clock, Shield 
} from "lucide-react";

export default function AdminDashboard() {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: allItems = [] } = useQuery({
    queryKey: ['allItems'],
    queryFn: () => base44.entities.Item.list(),
  });

  const { data: allAgreements = [] } = useQuery({
    queryKey: ['allAgreements'],
    queryFn: () => base44.entities.Agreement.list(),
  });

  const { data: allNegotiations = [] } = useQuery({
    queryKey: ['allNegotiations'],
    queryFn: () => base44.entities.Negotiation.list(),
  });

  const { data: allDisputes = [] } = useQuery({
    queryKey: ['allDisputes'],
    queryFn: () => base44.entities.Dispute.list(),
  });

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You need admin privileges to access this page</p>
          <Link to={createPageUrl("Home")}>
            <Button>Go to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate stats
  const activeUsers = allUsers.filter(u => !u.is_suspended).length;
  const activeItems = allItems.filter(i => i.status === 'active').length;
  const activeAgreements = allAgreements.filter(a => ['proposed', 'locked', 'in_progress'].includes(a.status)).length;
  const openDisputes = allDisputes.filter(d => d.status === 'open').length;
  const activeNegotiations = allNegotiations.filter(n => n.status === 'active').length;
  const completedAgreements = allAgreements.filter(a => a.status === 'completed').length;

  const suspendedUsers = allUsers.filter(u => u.is_suspended);
  const recentUsers = [...allUsers].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 10);
  const recentItems = [...allItems].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 10);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-orange-600" />
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{allUsers.length}</p>
                  <p className="text-sm text-green-600 mt-1">{activeUsers} active</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Items</p>
                  <p className="text-3xl font-bold text-gray-900">{activeItems}</p>
                  <p className="text-sm text-gray-500 mt-1">of {allItems.length} total</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Agreements</p>
                  <p className="text-3xl font-bold text-gray-900">{activeAgreements}</p>
                  <p className="text-sm text-green-600 mt-1">{completedAgreements} completed</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Negotiations</p>
                  <p className="text-3xl font-bold text-gray-900">{activeNegotiations}</p>
                  <p className="text-sm text-gray-500 mt-1">of {allNegotiations.length} total</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Open Disputes</p>
                  <p className="text-3xl font-bold text-gray-900">{openDisputes}</p>
                  <Link to={createPageUrl("AdminDisputes")}>
                    <Button size="sm" variant="outline" className="mt-2">
                      Manage Disputes
                    </Button>
                  </Link>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Suspended Users</p>
                  <p className="text-3xl font-bold text-gray-900">{suspendedUsers.length}</p>
                  <p className="text-sm text-red-600 mt-1">Requires attention</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for detailed views */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="agreements">Agreements</TabsTrigger>
            <TabsTrigger value="suspended">Suspended</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="border-orange-100">
              <CardHeader>
                <CardTitle>Recent Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {u.full_name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{u.full_name}</p>
                          <p className="text-sm text-gray-500">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {u.id_verified && (
                          <Badge className="bg-blue-100 text-blue-700">Verified</Badge>
                        )}
                        <Badge className={u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}>
                          {u.role}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="items">
            <Card className="border-orange-100">
              <CardHeader>
                <CardTitle>Recent Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-500">by {item.offerer_name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-orange-100 text-orange-700">
                          {item.required_hours}h
                        </Badge>
                        <Badge className={
                          item.status === 'active' ? 'bg-green-100 text-green-700' :
                          item.status === 'locked' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }>
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agreements">
            <Card className="border-orange-100">
              <CardHeader>
                <CardTitle>Recent Agreements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...allAgreements].slice(0, 10).map((agreement) => (
                    <div key={agreement.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">{agreement.item_title}</p>
                        <p className="text-sm text-gray-500">
                          {agreement.offerer_name} ↔ {agreement.worker_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-orange-100 text-orange-700">
                          {agreement.agreed_hours}h
                        </Badge>
                        <Badge className={
                          agreement.status === 'completed' ? 'bg-green-100 text-green-700' :
                          agreement.status === 'in_progress' || agreement.status === 'locked' ? 'bg-blue-100 text-blue-700' :
                          agreement.status === 'disputed' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }>
                          {agreement.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suspended">
            <Card className="border-orange-100">
              <CardHeader>
                <CardTitle>Suspended Users</CardTitle>
              </CardHeader>
              <CardContent>
                {suspendedUsers.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No suspended users</p>
                ) : (
                  <div className="space-y-4">
                    {suspendedUsers.map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                        <div>
                          <p className="font-semibold text-gray-900">{u.full_name}</p>
                          <p className="text-sm text-gray-500">{u.email}</p>
                          <p className="text-sm text-red-600 mt-1">
                            Karma: {u.karma_points || 0} | Cancellations: {u.cancellation_count || 0}
                          </p>
                        </div>
                        <Badge className="bg-red-100 text-red-700">Suspended</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}