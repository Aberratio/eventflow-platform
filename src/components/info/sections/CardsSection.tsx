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
    return IconComponent ? <IconComponent className="h-6 w-6" /> : null;
  };

  return (
    <section className="py-12 md:py-16">
      <div className="container">
        {section.title && (
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">{section.title}</h2>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {section.items?.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                {item.icon && (
                  <div className="p-3 rounded-full bg-primary/10 text-primary w-fit mb-4">
                    {getIcon(item.icon)}
                  </div>
                )}
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
                {item.link && (
                  <a
                    href={item.link}
                    className="text-primary hover:underline mt-3 inline-block"
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
