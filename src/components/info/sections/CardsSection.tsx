import { safeUrl } from '@/lib/safeUrl';
import { Card, CardContent } from '@/components/ui/card';
import { InfoPageSection } from '@/types';
import { PageSection } from '@/components/ui/page-section';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Calendar,
  CheckCircle,
  Star,
  Heart,
  Users,
  Trophy,
  Target,
  Zap,
  Shield,
  Award,
  Rocket,
  Gift,
  CreditCard,
  Package,
  Truck,
  Globe,
  Building,
  Home,
  Info,
  HelpCircle,
} from 'lucide-react';

interface CardsSectionProps {
  section: InfoPageSection;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Mail,
  Phone,
  MapPin,
  Clock,
  Calendar,
  CheckCircle,
  Star,
  Heart,
  Users,
  Trophy,
  Target,
  Zap,
  Shield,
  Award,
  Rocket,
  Gift,
  CreditCard,
  Package,
  Truck,
  Globe,
  Building,
  Home,
  Info,
  HelpCircle,
};

export const CardsSection = ({ section }: CardsSectionProps) => {
  const getIcon = (iconName?: string) => {
    if (!iconName) return null;
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
  };

  return (
    <PageSection compact>
      {section.title && (
        <h2 className="mb-6 text-center text-xl font-bold md:text-2xl">{section.title}</h2>
      )}
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
        {section.items?.map((item) => (
          <Card key={item.id} className="transition-shadow hover:shadow-md">
            <CardContent className="p-4 md:px-6 md:pt-6">
              {item.icon && (
                <div className="mb-3 w-fit rounded-lg bg-primary/10 p-2.5 text-primary">
                  {getIcon(item.icon)}
                </div>
              )}
              <h3 className="mb-1.5 text-base font-semibold">{item.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              {safeUrl(item.link) && (
                <a
                  href={safeUrl(item.link)}
                  className="mt-2.5 inline-block text-sm font-medium text-primary hover:underline"
                >
                  Dowiedz się więcej →
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </PageSection>
  );
};
