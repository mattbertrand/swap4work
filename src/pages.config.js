import Browse from './pages/Browse';
import CreateItem from './pages/CreateItem';
import ItemDetail from './pages/ItemDetail';
import MyListings from './pages/MyListings';
import MyAgreements from './pages/MyAgreements';
import Chat from './pages/Chat';
import TimeTracking from './pages/TimeTracking';
import Profile from './pages/Profile';
import Home from './pages/Home';
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
}

export const pagesConfig = {
    mainPage: "Browse",
    Pages: PAGES,
    Layout: Layout,
};