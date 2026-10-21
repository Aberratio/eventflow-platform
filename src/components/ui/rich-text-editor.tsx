import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Link as LinkIcon,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  RemoveFormatting,
  Link2Off,
} from 'lucide-react';
import { Button } from './button';
import { Separator } from './separator';
import { cn } from '@/lib/utils';
import { useState, useCallback, useEffect, useId } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './dialog';
import { Input } from './input';
import { Label } from './label';
import { normalizeLinkHref } from '@/lib/linkHref';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  /** Accessible name of the editing surface. Falls back to `placeholder` when omitted. */
  ariaLabel?: string;
}

interface ToolbarButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  onClick: () => void;
  title: string;
  disabled?: boolean;
}

const ToolbarButton = ({ icon: Icon, active, onClick, title, disabled }: ToolbarButtonProps) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={onClick}
    title={title}
    disabled={disabled}
    className={cn('h-8 w-8 p-0', active && 'bg-muted text-foreground')}
  >
    <Icon className="h-4 w-4" />
  </Button>
);

// Module-level: same extension instances on every render (useEditor compares them by identity and
// otherwise calls setOptions on every render). StarterKit v3 already bundles Link + Underline: configure
// them here, never register them twice (a duplicate registration would keep StarterKit's default
// openOnClick: true handler active alongside this one).
const EDITOR_EXTENSIONS = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    link: {
      openOnClick: false,
      defaultProtocol: 'https',
      HTMLAttributes: {
        class: 'text-primary underline hover:no-underline',
      },
    },
  }),
];

export const RichTextEditor = ({
  value,
  onChange,
  placeholder = 'Rozpocznij pisanie...',
  className,
  minHeight = '120px',
  ariaLabel,
}: RichTextEditorProps) => {
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkError, setLinkError] = useState('');
  const urlInputId = useId();

  const editor = useEditor({
    // Create the editor in useEditor's own effect, not during render. With immediate rendering the
    // instance is built during render and its 1ms destroy timer (see @tiptap/react useEditor.ts) races
    // React's passive-effect flush on heavy pages: if the flush lands after the timer, the editor gets
    // destroyed (schema = null) before this component's own sync effect calls editor.getHTML() on it
    // ("Cannot read properties of null (reading 'cached')").
    immediatelyRender: false,
    extensions: EDITOR_EXTENSIONS,
    content: value ?? '',
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none',
          'min-h-[80px] break-words p-3',
          '[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5',
          '[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5',
          '[&_li]:my-0.5',
        ),
        style: `min-height: ${minHeight}`,
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': ariaLabel ?? placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync external value changes (e.g. event loaded for edit) without echoing them back through onChange.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return; // defence in depth: never touch a destroyed instance
    const html = value ?? ''; // some hosts pass undefined (e.g. dist.infoHtml)
    if (html === '' && editor.isEmpty) return; // '' vs '<p></p>' is not a change
    if (html !== editor.getHTML()) {
      editor.commands.setContent(html, { emitUpdate: false });
    }
  }, [value, editor]);

  const handleAddLink = useCallback(() => {
    if (!editor || editor.isDestroyed) return;

    const previousUrl = editor.getAttributes('link').href;
    setLinkUrl(previousUrl || '');
    setLinkError('');
    setShowLinkDialog(true);
  }, [editor]);

  const confirmLink = useCallback(() => {
    if (!editor || editor.isDestroyed) return;

    const result = normalizeLinkHref(linkUrl);
    if (result.kind === 'rejected') {
      setLinkError('Nieobsługiwany adres. Użyj http(s)://, mailto: lub tel:.');
      return;
    }

    if (result.kind === 'empty') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: result.href }).run();
    }

    setShowLinkDialog(false);
    setLinkUrl('');
    setLinkError('');
  }, [editor, linkUrl]);

  const removeLink = useCallback(() => {
    if (!editor || editor.isDestroyed) return;
    editor.chain().focus().unsetLink().run();
  }, [editor]);

  if (!editor) {
    // The editor is created in an effect (see immediatelyRender above), so it does not exist on the
    // first render. Render a placeholder with the same frame to avoid layout shift; 41px is the
    // toolbar height.
    return (
      <div
        className={cn('overflow-hidden rounded-md border bg-black/10', className)}
        style={{ minHeight: `calc(${minHeight} + 41px)` }}
        aria-busy="true"
      />
    );
  }

  return (
    <div className={cn('overflow-hidden rounded-md border bg-black/10', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-white/[0.025] px-2 py-1">
        <ToolbarButton
          icon={Bold}
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Pogrubienie (Ctrl+B)"
        />
        <ToolbarButton
          icon={Italic}
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Kursywa (Ctrl+I)"
        />
        <ToolbarButton
          icon={UnderlineIcon}
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Podkreślenie (Ctrl+U)"
        />
        <ToolbarButton
          icon={Strikethrough}
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Przekreślenie"
        />

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton
          icon={LinkIcon}
          active={editor.isActive('link')}
          onClick={handleAddLink}
          title="Dodaj link"
        />
        {editor.isActive('link') && (
          <ToolbarButton icon={Link2Off} onClick={removeLink} title="Usuń link" />
        )}

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton
          icon={List}
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Lista punktowana"
        />
        <ToolbarButton
          icon={ListOrdered}
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Lista numerowana"
        />

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton
          icon={Heading2}
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Nagłówek 2"
        />
        <ToolbarButton
          icon={Heading3}
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Nagłówek 3"
        />

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton
          icon={RemoveFormatting}
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          title="Wyczyść formatowanie"
        />
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />

      {/* Link Dialog */}
      <Dialog
        open={showLinkDialog}
        onOpenChange={(open) => {
          setShowLinkDialog(open);
          if (!open) setLinkError('');
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dodaj link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor={urlInputId}>Adres URL</Label>
              <Input
                id={urlInputId}
                value={linkUrl}
                onChange={(e) => {
                  setLinkUrl(e.target.value);
                  if (linkError) setLinkError('');
                }}
                placeholder="https://example.com"
                aria-invalid={linkError ? true : undefined}
                aria-describedby={`${urlInputId}-hint${linkError ? ` ${urlInputId}-error` : ''}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    confirmLink();
                  }
                }}
              />
              <p id={`${urlInputId}-hint`} className="text-xs text-muted-foreground">
                Możesz też wpisać adres e-mail lub numer telefonu — dodamy mailto:/tel:
                automatycznie.
              </p>
              {linkError && (
                <p id={`${urlInputId}-error`} role="alert" className="text-xs text-destructive">
                  {linkError}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              Anuluj
            </Button>
            <Button onClick={confirmLink}>Zapisz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
