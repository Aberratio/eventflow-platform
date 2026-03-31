import { InfoPageSection } from '@/types';
import { CheckCircle } from 'lucide-react';

interface TextSectionProps {
  section: InfoPageSection;
}

const parseMarkdown = (text: string): string => {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
};

export const TextSection = ({ section }: TextSectionProps) => {
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="space-y-2 my-4">
            {currentList.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-primary mt-1 shrink-0" />
                <span
                  className="text-sm md:text-base leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(item) }}
                />
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
        currentList.push(trimmed.replace(/^[•\-]\s*/, ''));
      } else {
        flushList();
        if (trimmed) {
          elements.push(
            <p
              key={`p-${index}`}
              className="text-sm md:text-base text-muted-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(trimmed) }}
            />
          );
        }
      }
    });
    flushList();

    return elements;
  };

  return (
    <section className="py-8 md:py-12">
      <div className="container">
        <div className="max-w-3xl mx-auto">
          {section.title && (
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-7 bg-primary rounded-full shrink-0" />
              <h2 className="text-xl md:text-2xl font-bold">{section.title}</h2>
            </div>
          )}
          {section.content && (
            <div className="space-y-3 pl-0 md:pl-1">
              {renderContent(section.content)}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
