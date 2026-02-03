import { InfoPageSection } from '@/types';

interface TextSectionProps {
  section: InfoPageSection;
}

export const TextSection = ({ section }: TextSectionProps) => {
  return (
    <section className="py-12 md:py-16">
      <div className="container">
        <div className="max-w-3xl mx-auto">
          {section.title && (
            <h2 className="text-2xl md:text-3xl font-bold mb-6">{section.title}</h2>
          )}
          {section.content && (
            <div className="prose prose-lg dark:prose-invert max-w-none">
              {section.content.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
