import {createRoot} from 'react-dom/client';
import './index.css';

// Trang chủ ở "/", sách điện tử ở "/sach" (tải riêng để trang chủ nhẹ hơn)
const path = window.location.pathname.replace(/\/+$/, '') || '/';
const isEbook = path === '/sach' || path.startsWith('/sach/');
const root = createRoot(document.getElementById('root')!);

if (isEbook) {
  document.title = 'Sách điện tử – Hán Ngữ Hoa Sen';
  import('./App.tsx').then(({default: App}) => root.render(<App />));
} else {
  import('./landing/Landing.tsx').then(({default: Landing}) => root.render(<Landing />));
}
