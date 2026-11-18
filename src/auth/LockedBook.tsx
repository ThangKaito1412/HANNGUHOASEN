import {Lock, LogIn, MessageCircle, Phone} from 'lucide-react';
import {useAuth} from './AuthContext';
import {CENTER} from './api';

/** Khung hiển thị khi chưa có quyền học nội dung (dùng cho quyển bị khóa và trang bị khóa trong sách). */
export function LockedCard({title, subtitle, compact = false}: {title: string; subtitle?: string; compact?: boolean}) {
  const {user, openLogin} = useAuth();
  return (
    <div className={`mx-auto flex max-w-md flex-col items-center text-center ${compact ? 'py-6' : 'py-10'}`}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
        <Lock className="h-7 w-7" />
      </div>
      <h3 className="mt-4 font-['Fraunces'] text-xl font-bold text-stone-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        {subtitle ||
          (user
            ? 'Tài khoản của bạn chưa có quyền học phần này. Liên hệ trung tâm để đăng ký thêm.'
            : '3 bài đầu Quyển 1 và phần Phiên Âm miễn phí. Các bài còn lại dành cho học viên có tài khoản do trung tâm cấp.')}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {!user && (
          <button onClick={openLogin} className="inline-flex items-center gap-1.5 rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-800">
            <LogIn className="h-4 w-4" /> Đăng nhập
          </button>
        )}
        <a href={CENTER.zalo} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-700">
          <MessageCircle className="h-4 w-4" /> Nhắn Zalo mua tài khoản
        </a>
        <a href={CENTER.phoneLink} className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50">
          <Phone className="h-4 w-4" /> {CENTER.phone}
        </a>
      </div>
    </div>
  );
}
