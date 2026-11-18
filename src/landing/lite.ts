/** Chế độ nhẹ cho điện thoại / màn hình cảm ứng: hiển thị từng trang, bỏ hiệu ứng nặng. */
export const LITE: boolean = typeof window !== 'undefined' && window.matchMedia('(max-width: 820px), (pointer: coarse)').matches;
