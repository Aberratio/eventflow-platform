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
          <ul key={`list-${elements.length}`} className="my-4 space-y-2">
            {currentList.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-muted-foreground">
                <CheckCircle className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <span
                  className="text-sm leading-relaxed md:text-base"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(item) }}
                />
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
              dangerouslySetInnerHTML={{ __html: parseMarkdown(trimmed) }}
            />,
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
        <div className="mx-auto max-w-3xl">
          {section.title && (
            <div className="mb-5 flex items-center gap-3">
              <div className="h-7 w-1 shrink-0 rounded-full bg-primary" />
              <h2 className="text-xl font-bold md:text-2xl">{section.title}</h2>
            </div>
          )}
          {section.content && (
            <div className="space-y-3 pl-0 md:pl-1">{renderContent(section.content)}</div>
          )}
        </div>
      </div>
    </section>
  );
};
