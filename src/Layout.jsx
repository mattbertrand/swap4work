import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { authLoginUrl } from "@/lib/authNavigation";
import {
  Home,
  Package,
  User,
  Shield,
  Briefcase,
  Plus,
  LogOut,
  Bell,
  Users,
  LayoutDashboard,
  Flag } from
"lucide-react";
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
  SidebarTrigger } from
"@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/notifications/NotificationBell";
import GuestBanner from "@/components/auth/GuestBanner";
import { useAuth } from "@/lib/AuthContext";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  // Session is loaded once by AuthProvider — reusing it keeps the shell mounted
  // during navigation (no per-route re-fetch, no hard page reloads).
  const { user } = useAuth();

  React.useEffect(() => {
    if (!user || user.profile_completed) return;
    if (window.location.pathname.includes('CompleteProfile')) return;

    const protectedPages = [
      createPageUrl('CreateItem'),
      createPageUrl('MyListings'),
      createPageUrl('MyAgreements')].
      map((url) => new URL(url, window.location.origin).pathname);

    const currentPath = window.location.pathname;

    if (protectedPages.some((pagePath) => currentPath.startsWith(pagePath))) {
      navigate(createPageUrl(`CompleteProfile?returnUrl=${encodeURIComponent(currentPath + window.location.search)}`));
    }
  }, [user, location.pathname, navigate]);

  const isAdmin = user?.role === 'admin';

  const navigationItems = [
  {
    title: "Home",
    url: createPageUrl("Home"),
    icon: Home
  },
  {
    title: "Browse Items",
    url: createPageUrl("Browse"),
    icon: Package
  },
  {
    title: "Browse Services",
    url: createPageUrl("BrowseServices"),
    icon: Briefcase
  },
  {
    title: "Find People",
    url: createPageUrl("BrowseUsers"),
    icon: Users
  },
  {
    title: "My Listings",
    url: createPageUrl("MyListings"),
    icon: Package
  },
  {
    title: "My Agreements",
    url: createPageUrl("MyAgreements"),
    icon: Briefcase
  },
  {
    title: "Trade Dashboard",
    url: createPageUrl("TradeDashboard"),
    icon: LayoutDashboard
  },
  {
    title: "Notifications",
    url: createPageUrl("Notifications"),
    icon: Bell
  },
  {
    title: "Profile",
    url: createPageUrl("Profile"),
    icon: User
  }];


  if (isAdmin) {
    navigationItems.push({
      title: "Admin Dashboard",
      url: createPageUrl("AdminDashboard"),
      icon: Shield
    });
    navigationItems.push({
      title: "Moderation",
      url: createPageUrl("AdminReports"),
      icon: Flag
    });
    navigationItems.push({
      title: "User Management",
      url: createPageUrl("AdminUserManagement"),
      icon: Shield
    });
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <Sidebar className="border-r border-orange-100">
          <SidebarHeader className="border-b border-orange-100 p-6">
            <Link to={createPageUrl("Home")} className="flex items-center justify-center w-full">
              <img
                src="https://media.base44.com/images/public/690d293b21b2ce5e9a6db7c8/72467c977_Swap4WorkFinalLogov2.png"
                alt="Swap4Work"
                className="h-40 w-auto object-contain" />
              
            </Link>
          </SidebarHeader>

          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) =>
                  <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                      asChild
                      className={`hover:bg-orange-100 hover:text-orange-700 transition-colors duration-200 rounded-xl mb-1 ${
                      location.pathname === item.url ? 'bg-orange-100 text-orange-700' : ''}`
                      }>
                      
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <div className="px-4 py-6">
              <Link to={createPageUrl("CreateItem")} className="block">
                <button className="w-full bg-gradient-to-r from-orange-500 to-amber-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-orange-600 hover:to-amber-700 transition-all shadow-md flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5 flex-shrink-0" />
                  <span className="font-semibold text-white">List an Item</span>
                </button>
              </Link>
            </div>
          </SidebarContent>

          <SidebarFooter className="border-t border-orange-100 p-4">
            {user ?
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 w-full hover:bg-orange-50 p-2 rounded-lg transition-colors">
                    {user.photo_url ?
                  <img
                    src={user.photo_url}
                    alt={user.full_name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-orange-200" /> :


                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {user.full_name?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                  }
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-medium text-gray-900 text-sm truncate">{user.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("Profile")} className="flex items-center cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                  onClick={() => {
                    base44.auth.logout(createPageUrl("Home"));
                  }}
                  className="text-red-600 focus:text-red-600 cursor-pointer">
                  
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> :

            <Button
              onClick={() => navigate(authLoginUrl(window.location.pathname + window.location.search))}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700">
              
                Sign In
              </Button>
            }
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white/80 backdrop-blur-sm border-b border-orange-100 px-6 py-4 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden hover:bg-orange-100 p-2 rounded-lg transition-colors duration-200" />
                <h1 className="text-xl font-bold text-gray-900 hidden md:block">Swap4Work</h1>
              </div>
              {user && <NotificationBell user={user} />}
            </div>
          </header>

          <div id="main-scroll-container" className="flex-1 overflow-auto">
            {!user && <GuestBanner />}
            {children}
          </div>

          <footer className="bg-white border-t border-orange-100 mt-auto">
            <div className="max-w-7xl mx-auto px-4 py-12 md:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div>
                  <div className="mb-4">
                    <img
                      src="https://media.base44.com/images/public/690d293b21b2ce5e9a6db7c8/72467c977_Swap4WorkFinalLogov2.png"
                      alt="Swap4Work"
                      className="w-auto object-contain h-28" />
                    
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    A local marketplace where items are exchanged for skills and time nearby — the exchange is work, not payments.
                  </p>
                  <p className="text-xs text-gray-500">
                    Building stronger communities through skill exchange.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Quick Links</h4>
                  <ul className="space-y-2">
                    <li>
                      <Link to={createPageUrl("Browse")} className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                        Browse Items
                      </Link>
                    </li>
                    <li>
                      <Link to={createPageUrl("CreateItem")} className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                        List an Item
                      </Link>
                    </li>
                    <li>
                      <Link to={createPageUrl("MyAgreements")} className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                        My Agreements
                      </Link>
                    </li>
                    <li>
                      <Link to={createPageUrl("Profile")} className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                        My Profile
                      </Link>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Resources</h4>
                  <ul className="space-y-2">
                    <li>
                      <Link to={createPageUrl("HowItWorks")} className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                        How It Works
                      </Link>
                    </li>
                    <li>
                      <Link to={createPageUrl("CommunityGuidelines")} className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                        Safety Guidelines
                      </Link>
                    </li>
                    <li>
                      <Link to={createPageUrl("CommunityGuidelines")} className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                        Community Rules
                      </Link>
                    </li>
                    <li>
                      <Link to={createPageUrl("HowItWorks")} className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                        FAQ
                      </Link>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
                  <ul className="space-y-2">
                    <li>
                      <Link to={createPageUrl("Terms")} className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                        Terms &amp; Conditions
                      </Link>
                    </li>
                    <li>
                      <Link to={createPageUrl("Privacy")} className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                        Privacy Policy
                      </Link>
                    </li>
                    <li>
                      <Link to={createPageUrl("Privacy")} className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                        Cookie Policy
                      </Link>
                    </li>
                    <li>
                      <Link to={createPageUrl("CommunityGuidelines")} className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                        Report a Problem
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-8 border-t border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <p className="text-sm text-gray-500">
                    © {new Date().getFullYear()} Swap4Work. All rights reserved.
                  </p>
                  <div className="flex items-center gap-6">
                    <Link to={createPageUrl("CommunityGuidelines")} className="text-sm text-gray-500 hover:text-orange-600 transition-colors">
                      Report an Issue
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </SidebarProvider>);

}