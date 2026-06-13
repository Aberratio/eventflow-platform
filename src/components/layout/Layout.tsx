import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="min-h-[calc(100vh-64px)] flex-1 bg-background">{children}</main>
      <Footer />
    </div>
  );
};
