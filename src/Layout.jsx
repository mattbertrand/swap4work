import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { 
  Home, 
  Package, 
  MessageSquare, 
  User, 
  Shield,
  Briefcase,
  Plus
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const isAdmin = user?.role === 'admin';

  const navigationItems = [
    {
      title: "Browse Items",
      url: createPageUrl("Browse"),
      icon: Home,
    },
    {
      title: "My Listings",
      url: createPageUrl("MyListings"),
      icon: Package,
    },
    {
      title: "My Agreements",
      url: createPageUrl("MyAgreements"),
      icon: Briefcase,
    },
    {
      title: "Profile",
      url: createPageUrl("Profile"),
      icon: User,
    },
  ];

  if (isAdmin) {
    navigationItems.push({
      title: "Admin Dashboard",
      url: createPageUrl("AdminDashboard"),
      icon: Shield,
    });
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
    </div>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <Sidebar className="border-r border-orange-100">
          <SidebarHeader className="border-b border-orange-100 p-6">
            <Link to={createPageUrl("Browse")} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-gray-900">WorkSwap</h2>
                <p className="text-xs text-gray-500">Trade work for items</p>
              </div>
            </Link>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-orange-100 hover:text-orange-700 transition-colors duration-200 rounded-xl mb-1 ${
                          location.pathname === item.url ? 'bg-orange-100 text-orange-700' : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <div className="px-4 py-6">
              <Link to={createPageUrl("CreateItem")}>
                <button className="w-full bg-gradient-to-r from-orange-500 to-amber-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-orange-600 hover:to-amber-700 transition-all shadow-md flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" />
                  List an Item
                </button>
              </Link>
            </div>
          </SidebarContent>

          <SidebarFooter className="border-t border-orange-100 p-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user.full_name?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{user.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => base44.auth.redirectToLogin()}
                className="w-full text-center py-2 text-sm font-medium text-orange-600 hover:text-orange-700"
              >
                Sign In
              </button>
            )}
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white/80 backdrop-blur-sm border-b border-orange-100 px-6 py-4 md:hidden sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-orange-100 p-2 rounded-lg transition-colors duration-200" />
              <h1 className="text-xl font-bold text-gray-900">WorkSwap</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}