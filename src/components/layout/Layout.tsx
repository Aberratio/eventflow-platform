import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:shadow-lg focus:outline focus:outline-2 focus:outline-ring"
      >
        Przejdź do treści
      </a>
      <Header />
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-[calc(100vh-64px)] flex-1 bg-background focus:outline-none"
      >
        {children}
      </main>
      <Footer />
    </div>
  );
};
