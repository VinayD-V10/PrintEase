import React from 'react';
import { X } from 'lucide-react';
import { User } from '../types/printease';
import { AuthScreen } from './AuthScreen';

interface Props {
  onClose: () => void;
  onSuccess: (user: User, token: string) => void;
  onQuickEnter?: () => void;
}

export const ShopkeeperAccessModal: React.FC<Props> = ({
  onClose,
  onSuccess,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md my-8">
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-50 w-9 h-9 rounded-full bg-[#5A3C0B] text-[#FFF5E1] hover:bg-[#422C09] flex items-center justify-center shadow-lg border-2 border-[#C48B28] cursor-pointer transition-transform hover:scale-110"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="rounded-3xl overflow-hidden shadow-2xl">
          <AuthScreen
            initialMode="owner-login"
            onAuthSuccess={(user, token) => {
              onSuccess(user, token);
              onClose();
            }}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
};
