import { InfoPageSection } from '@/types';
import { CheckCircle } from 'lucide-react';
import { PageSection } from '@/components/ui/page-section';
import { SectionHeading } from '@/components/ui/section-heading';
import { renderInlineMarkdown } from '@/lib/inlineMarkdown';

interface TextSectionProps {
  section: InfoPageSection;
}

export const TextSection = ({ section }: TextSectionProps) => {
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="my-4 space-y-2">
            {currentList.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-muted-foreground">
                <CheckCircle className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <span className="text-sm leading-relaxed md:text-base">
                  {renderInlineMarkdown(item)}
                </span>
              </li>
            ))}
          </ul>,
        );
        currentList = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
        currentList.push(trimmed.replace(/^[•-]\s*/, ''));
      } else {
        flushList();
        if (trimmed) {
          elements.push(
            <p
              key={`p-${index}`}
              className="text-sm leading-relaxed text-muted-foreground md:text-base"
            >
              {renderInlineMarkdown(trimmed)}
            </p>,
          );
        }
      }
    });
    flushList();

    return elements;
  };

  return (
    <PageSection compact>
      <div className="mx-auto max-w-3xl">
        {section.title && <SectionHeading title={section.title} className="mb-5" />}
        {section.content && (
          <div className="space-y-3 pl-0 md:pl-1">{renderContent(section.content)}</div>
        )}
      </div>
    </PageSection>
  );
};
