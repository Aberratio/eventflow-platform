import { Card, CardContent } from '@/components/ui/card';
import { InfoPageSection } from '@/types';
import { 
  Mail, Phone, MapPin, Clock, Calendar, CheckCircle, Star, Heart,
  Users, Trophy, Target, Zap, Shield, Award, Rocket, Gift,
  CreditCard, Package, Truck, Globe, Building, Home, Info, HelpCircle
} from 'lucide-react';

interface CardsSectionProps {
  section: InfoPageSection;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Mail, Phone, MapPin, Clock, Calendar, CheckCircle, Star, Heart,
  Users, Trophy, Target, Zap, Shield, Award, Rocket, Gift,
  CreditCard, Package, Truck, Globe, Building, Home, Info, HelpCircle,
};

export const CardsSection = ({ section }: CardsSectionProps) => {
  const getIcon = (iconName?: string) => {
    if (!iconName) return null;
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
  };

  return (
    <section className="py-8 md:py-12">
      <div className="container">
        {section.title && (
          <h2 className="text-xl md:text-2xl font-bold mb-6 text-center">{section.title}</h2>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
          {section.items?.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:pt-6 md:px-6">
                {item.icon && (
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary w-fit mb-3">
                    {getIcon(item.icon)}
                  </div>
                )}
                <h3 className="text-base font-semibold mb-1.5">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                {item.link && (
                  <a
                    href={item.link}
                    className="text-sm text-primary hover:underline mt-2.5 inline-block font-medium"
                  >
                    Dowiedz się więcej →
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
