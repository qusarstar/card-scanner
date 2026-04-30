import './globals.css';

export const metadata = {
  title: '名片掃描',
  description: '智慧名片管理與潛在客戶分析',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '名片掃描',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: '#4F46E5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="min-h-screen bg-[#F2F2F7] text-gray-900">
        {children}
      </body>
    </html>
  );
}
