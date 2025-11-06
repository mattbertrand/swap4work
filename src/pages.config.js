import Browse from './pages/Browse';
import CreateItem from './pages/CreateItem';
import Layout from './Layout.jsx';


export const PAGES = {
    "Browse": Browse,
    "CreateItem": CreateItem,
}

export const pagesConfig = {
    mainPage: "Browse",
    Pages: PAGES,
    Layout: Layout,
};