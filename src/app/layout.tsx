import type { Metadata } from 'next';
import { Inter, Noto_Sans_TC } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const notoSansTc = Noto_Sans_TC({ subsets: ['latin'], variable: '--font-noto-tc' });

export const metadata: Metadata = {
  title: 'KOH Draft Advisor',
  description: '王者榮耀陣容智能克制推薦系統',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant" className={`${inter.variable} ${notoSansTc.variable} dark`}>
      <body>{children}</body>
    </html>
  );
}
