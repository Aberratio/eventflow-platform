import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, ArrowRight } from 'lucide-react';

const mockBlogPosts = [
  {
    id: '1',
    title: 'Jak przygotować się do pierwszego maratonu?',
    excerpt: 'Kompleksowy przewodnik dla początkujących biegaczy planujących swój debiut na dystansie 42,195 km.',
    category: 'Porady',
    author: 'Anna Biegacz',
    date: '2026-01-15',
    imageUrl: 'https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?w=400',
  },
  {
    id: '2',
    title: 'Najlepsze trasy rowerowe w Polsce na sezon 2026',
    excerpt: 'Przegląd najpiękniejszych szlaków rowerowych - od gór po wybrzeże Bałtyku.',
    category: 'Inspiracje',
    author: 'Marek Kolarz',
    date: '2026-01-10',
    imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400',
  },
  {
    id: '3',
    title: 'Triathlon dla początkujących - od czego zacząć?',
    excerpt: 'Podstawy treningu triatlonowego i pierwszy sprzęt, który warto kupić.',
    category: 'Porady',
    author: 'Piotr Triathlonista',
    date: '2026-01-05',
    imageUrl: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400',
  },
  {
    id: '4',
    title: 'Kalendarz imprez biegowych 2026 - na co warto się zapisać?',
    excerpt: 'Przegląd najciekawszych wydarzeń biegowych w nadchodzącym sezonie.',
    category: 'Wydarzenia',
    author: 'Redakcja SportTime',
    date: '2026-01-02',
    imageUrl: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400',
  },
];

const BlogPage = () => {
  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Blog</h1>
          <p className="text-muted-foreground">
            Porady, inspiracje i aktualności ze świata sportu
          </p>
        </div>

        {/* Blog posts grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockBlogPosts.map(post => (
            <Card key={post.id} className="group cursor-pointer hover:shadow-md transition-shadow overflow-hidden">
              <div className="aspect-video overflow-hidden">
                <img 
                  src={post.imageUrl} 
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">{post.category}</Badge>
                </div>
                <h2 className="text-xl font-semibold group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h2>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {post.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(post.date).toLocaleDateString('pl-PL')}
                    </span>
                  </div>
                  <span className="text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                    Czytaj <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Placeholder notice */}
        <div className="mt-12 text-center text-muted-foreground">
          <p className="text-sm">
            To jest wersja demonstracyjna bloga. Pełna funkcjonalność będzie dostępna wkrótce.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default BlogPage;