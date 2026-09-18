import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Shield,
  Search,
  UserX,
  Trash2,
  Ban,
  ShieldCheck,
  Package,
  Briefcase,
  Star,
  MessageSquare,
  Flag,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DeleteUserDialog from "@/components/admin/DeleteUserDialog";
import SuspendUserDialog from "@/components/admin/SuspendUserDialog";

export default function AdminUserManagement() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [suspendAction, setSuspendAction] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const isAdmin = user?.role === "admin";

  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ["adminAllUsers"],
    queryFn: () => base44.entities.User.list(),
    enabled: !!isAdmin,
  });

  const selectedUser = allUsers.find((u) => u.id === selectedUserId) || null;

  const { data: preview, isFetching: previewLoading } = useQuery({
    queryKey: ["userDeletionPreview", selectedUserId],
    queryFn: async () =>
      (await base44.functions.invoke("deleteUser", { user_id: selectedUserId, mode: "preview" })).data,
    enabled: !!isAdmin && !!selectedUserId,
  });

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
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

  const lowerSearch = search.toLowerCase();
  const filteredUsers = allUsers.filter(
    (u) =>
      !search ||
      u.full_name?.toLowerCase().includes(lowerSearch) ||
      u.email?.toLowerCase().includes(lowerSearch)
  );

  const summaryStats = preview
    ? [
        { label: "Listings", value: preview.will_delete?.listings ?? 0, icon: Package },
        {
          label: "In-Progress Agreements",
          value: preview.will_delete?.in_progress_agreements ?? 0,
          icon: Briefcase,
        },
        {
          label: "Completed Agreements (kept)",
          value: preview.will_keep?.completed_agreements ?? 0,
          icon: Briefcase,
        },
        {
          label: "Reviews Given / Received",
          value: `${preview.will_delete?.reviews_given ?? 0} / ${preview.will_delete?.reviews_received ?? 0}`,
          icon: Star,
        },
        { label: "Messages", value: preview.will_delete?.messages ?? 0, icon: MessageSquare },
        { label: "Reports Filed", value: preview.will_delete?.reports_filed ?? 0, icon: Flag },
      ]
    : [];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-orange-600" />
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User list */}
          <Card className="border-orange-100 lg:col-span-1">
            <CardHeader>
              <CardTitle>Members ({filteredUsers.length})</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto px-4 pb-4 space-y-2">
                {filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      u.id === selectedUserId
                        ? "border-orange-300 bg-orange-50"
                        : "border-gray-100 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{u.full_name}</p>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {u.is_banned && <Badge className="bg-red-100 text-red-700">Banned</Badge>}
                        {!u.is_banned && u.is_suspended && (
                          <Badge className="bg-amber-100 text-amber-700">Suspended</Badge>
                        )}
                        <Badge
                          className={
                            u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
                          }
                        >
                          {u.role}
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No members match your search</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Selected user */}
          <div className="lg:col-span-2">
            {!selectedUser ? (
              <Card className="border-orange-100">
                <CardContent className="p-12 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Select a member to see their profile summary and moderation actions</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card className="border-orange-100">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-xl">
                            {selectedUser.full_name?.[0]?.toUpperCase() || "U"}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-gray-900">{selectedUser.full_name}</h2>
                            {selectedUser.is_banned && (
                              <Badge className="bg-red-100 text-red-700">Banned</Badge>
                            )}
                            {!selectedUser.is_banned && selectedUser.is_suspended && (
                              <Badge className="bg-amber-100 text-amber-700">Suspended</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{selectedUser.email}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Karma: {selectedUser.karma_points || 0} · Completed trades:{" "}
                            {selectedUser.completed_trades || 0} · Rating: {selectedUser.rating || 0}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {selectedUser.is_suspended || selectedUser.is_banned ? (
                          <Button
                            variant="outline"
                            className="border-green-300 text-green-700 hover:bg-green-50"
                            onClick={() => setSuspendAction("unsuspend")}
                          >
                            <ShieldCheck className="w-4 h-4 mr-2" />
                            Reinstate User
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              className="border-amber-300 text-amber-700 hover:bg-amber-50"
                              onClick={() => setSuspendAction("suspend")}
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Suspend
                            </Button>
                            <Button
                              variant="outline"
                              className="border-red-300 text-red-700 hover:bg-red-50"
                              onClick={() => setSuspendAction("ban")}
                            >
                              <UserX className="w-4 h-4 mr-2" />
                              Ban
                            </Button>
                          </>
                        )}
                        <Button
                          variant="destructive"
                          onClick={() => setDeleteOpen(true)}
                          disabled={selectedUser.role === "admin"}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete User &amp; Data
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-orange-100">
                  <CardHeader>
                    <CardTitle>Profile Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {previewLoading ? (
                      <div className="flex justify-center p-6">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {summaryStats.map((stat) => (
                          <div key={stat.label} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 text-gray-500 mb-1">
                              <stat.icon className="w-4 h-4" />
                              <span className="text-xs">{stat.label}</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      <SuspendUserDialog
        open={!!suspendAction}
        onClose={() => setSuspendAction(null)}
        targetUser={selectedUser}
        action={suspendAction}
      />
      <DeleteUserDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        targetUser={selectedUser}
        preview={preview}
        previewLoading={previewLoading}
      />
    </div>
  );
}