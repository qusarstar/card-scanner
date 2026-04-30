'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/', label: '名片', icon: '📇' },
  { href: '/analyze', label: 'AI 分析', icon: '🎯' },
  { href: '/scan', label: '掃描', icon: '📷', primary: true },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-50">
      <div className="flex items-center justify-around max-w-lg mx-auto h-16 px-4">
        {items.map((item) => {
          const active = pathname === item.href;
          if (item.primary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-8"
              >
                <div className="w-14 h-14 rounded-full bg-brand text-white flex items-center justify-center text-2xl shadow-lg shadow-brand/40">
                  {item.icon}
                </div>
                <span className="text-xs text-gray-600 mt-1">{item.label}</span>
              </Link>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-2 ${
                active ? 'text-brand' : 'text-gray-500'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
