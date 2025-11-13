import Browse from './pages/Browse';
import CreateItem from './pages/CreateItem';
import ItemDetail from './pages/ItemDetail';
import MyListings from './pages/MyListings';
import MyAgreements from './pages/MyAgreements';
import Chat from './pages/Chat';
import TimeTracking from './pages/TimeTracking';
import Profile from './pages/Profile';
import Home from './pages/Home';
import CompleteProfile from './pages/CompleteProfile';
import EditItem from './pages/EditItem';
import AdminDisputes from './pages/AdminDisputes';
import Negotiation from './pages/Negotiation';
import AdminDashboard from './pages/AdminDashboard';
import Notifications from './pages/Notifications';
import AgreementDetail from './pages/AgreementDetail';
import Layout from './Layout.jsx';


export const PAGES = {
    "Browse": Browse,
    "CreateItem": CreateItem,
    "ItemDetail": ItemDetail,
    "MyListings": MyListings,
    "MyAgreements": MyAgreements,
    "Chat": Chat,
    "TimeTracking": TimeTracking,
    "Profile": Profile,
    "Home": Home,
    "CompleteProfile": CompleteProfile,
    "EditItem": EditItem,
    "AdminDisputes": AdminDisputes,
    "Negotiation": Negotiation,
    "AdminDashboard": AdminDashboard,
    "Notifications": Notifications,
    "AgreementDetail": AgreementDetail,
}

export const pagesConfig = {
    mainPage: "Browse",
    Pages: PAGES,
    Layout: Layout,
};