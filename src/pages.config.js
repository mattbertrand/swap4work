import AdminDashboard from './pages/AdminDashboard';
import AdminDisputes from './pages/AdminDisputes';
import AdminReports from './pages/AdminReports';
import AgreementDetail from './pages/AgreementDetail';
import Browse from './pages/Browse';
import BrowseUsers from './pages/BrowseUsers';
import Chat from './pages/Chat';
import CompleteProfile from './pages/CompleteProfile';
import CreateItem from './pages/CreateItem';
import EditItem from './pages/EditItem';
import Home from './pages/Home';
import ItemDetail from './pages/ItemDetail';
import MyAgreements from './pages/MyAgreements';
import MyListings from './pages/MyListings';
import Negotiation from './pages/Negotiation';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import TimeTracking from './pages/TimeTracking';
import TradeDashboard from './pages/TradeDashboard';
import BrowseServices from './pages/BrowseServices';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "AdminDisputes": AdminDisputes,
    "AdminReports": AdminReports,
    "AgreementDetail": AgreementDetail,
    "Browse": Browse,
    "BrowseUsers": BrowseUsers,
    "Chat": Chat,
    "CompleteProfile": CompleteProfile,
    "CreateItem": CreateItem,
    "EditItem": EditItem,
    "Home": Home,
    "ItemDetail": ItemDetail,
    "MyAgreements": MyAgreements,
    "MyListings": MyListings,
    "Negotiation": Negotiation,
    "Notifications": Notifications,
    "Profile": Profile,
    "PublicProfile": PublicProfile,
    "TimeTracking": TimeTracking,
    "TradeDashboard": TradeDashboard,
    "BrowseServices": BrowseServices,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};