import {createRoot} from 'react-dom/client';
import './index.css';

// "/" = trang chủ, "/sach" = sách điện tử, "/admin" = quản trị (mỗi phần tải riêng cho nhẹ)
const path = window.location.pathname.replace(/\/+$/, '') || '/';
const is = (p: string) => path === p || path.startsWith(p + '/');
const root = createRoot(document.getElementById('root')!);

if (is('/sach')) {
  document.title = 'Sách điện tử – Hán Ngữ Hoa Sen';
  Promise.all([import('./App.tsx'), import('./auth/AuthContext.tsx')]).then(([{default: App}, {AuthProvider}]) =>
    root.render(
      <AuthProvider>
        <App />
      </AuthProvider>
    )
  );
} else if (is('/admin')) {
  document.title = 'Quản trị – Hán Ngữ Hoa Sen';
  const meta = document.createElement('meta');
  meta.name = 'robots';
  meta.content = 'noindex,nofollow';
  document.head.appendChild(meta);
  import('./admin/AdminApp.tsx').then(({default: AdminApp}) => root.render(<AdminApp />));
} else {
  import('./landing/Landing.tsx').then(({default: Landing}) => root.render(<Landing />));
}
