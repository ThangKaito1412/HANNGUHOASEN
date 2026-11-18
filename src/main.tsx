import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import Landing from './landing/Landing.tsx';
import './index.css';

// Trang chủ ở "/", sách điện tử ở "/sach"
const path = window.location.pathname.replace(/\/+$/, '') || '/';
const isEbook = path === '/sach' || path.startsWith('/sach/');

if (isEbook) document.title = 'Sách điện tử – Hán Ngữ Hoa Sen';

createRoot(document.getElementById('root')!).render(isEbook ? <App /> : <Landing />);
