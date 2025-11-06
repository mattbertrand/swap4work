import Browse from './pages/Browse';
import CreateItem from './pages/CreateItem';
import ItemDetail from './pages/ItemDetail';
import MyListings from './pages/MyListings';
import Layout from './Layout.jsx';


export const PAGES = {
    "Browse": Browse,
    "CreateItem": CreateItem,
    "ItemDetail": ItemDetail,
    "MyListings": MyListings,
}

export const pagesConfig = {
    mainPage: "Browse",
    Pages: PAGES,
    Layout: Layout,
};