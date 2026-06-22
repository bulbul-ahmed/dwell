import { create } from 'zustand';

export type ToastKind = 'success' | 'error' | 'info';

interface Toast {
  title: string;
  msg: string;
  kind: ToastKind;
}

interface ToastStore {
  toast: Toast | null;
  notify: (title: string, msg: string, kind?: ToastKind) => void;
  clear: () => void;
}

export const useToastStore = create<ToastStore>((set) => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return {
    toast: null,
    notify(title, msg, kind = 'success') {
      if (timer) clearTimeout(timer);
      set({ toast: { title, msg, kind } });
      timer = setTimeout(() => set({ toast: null }), 3400);
    },
    clear() {
      if (timer) clearTimeout(timer);
      set({ toast: null });
    },
  };
});
