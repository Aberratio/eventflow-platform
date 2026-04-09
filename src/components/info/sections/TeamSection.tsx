import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { InfoPageSection } from '@/types';

interface TeamSectionProps {
  section: InfoPageSection;
}

export const TeamSection = ({ section }: TeamSectionProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <section className="py-12 md:py-16">
      <div className="container">
        {section.title && (
          <h2 className="mb-8 text-center text-2xl font-bold md:text-3xl">{section.title}</h2>
        )}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {section.items?.map((item) => (
            <Card key={item.id} className="text-center">
              <CardContent className="pt-6">
                <Avatar className="mx-auto mb-4 h-24 w-24">
                  <AvatarImage src={item.image} alt={item.title} />
                  <AvatarFallback className="text-xl">{getInitials(item.title)}</AvatarFallback>
                </Avatar>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
