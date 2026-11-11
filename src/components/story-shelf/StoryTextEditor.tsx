import { Markdown } from '@tiptap/markdown';
import { EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { useEffect, useRef, useState } from 'react';
import './StoryTextEditor.css';

function ToolbarButton({
  active = false,
  disabled,
  label,
  onClick,
}: {
  active?: boolean;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className="story-text-editor-tool"
      disabled={disabled}
      onClick={onClick}
      onMouseDown={(event) => event.preventDefault()}
      type="button"
    >
      {label}
    </button>
  );
}

function encodeFootnote(note: string): string {
  return encodeURIComponent(note).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export function StoryTextEditor({
  onChange,
}: {
  onChange: (markdown: string) => void;
}) {
  const [footnoteDialogOpen, setFootnoteDialogOpen] = useState(false);
  const [footnoteText, setFootnoteText] = useState('');
  const footnoteDialogRef = useRef<HTMLDialogElement>(null);
  const footnoteInputRef = useRef<HTMLTextAreaElement>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit.configure({ link: { openOnClick: false } }), Markdown],
    editorProps: {
      attributes: {
        'aria-label': 'Story text',
        'aria-multiline': 'true',
        class: 'story-text-editor-content',
        role: 'textbox',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getMarkdown());
    },
  });

  useEffect(() => {
    if (footnoteDialogOpen) {
      footnoteDialogRef.current?.showModal();
      footnoteInputRef.current?.focus();
    } else {
      footnoteDialogRef.current?.close();
    }
  }, [footnoteDialogOpen]);

  const disabled = !editor || editor.isDestroyed;

  function addFootnote() {
    const note = footnoteText.trim();
    if (!editor || !note) {
      return;
    }

    let footnoteNumber = 0;
    editor.state.doc.descendants((node) => {
      for (const mark of node.marks) {
        const href = mark.attrs.href;
        if (typeof href === 'string') {
          const match = href.match(/^#footnote-(\d+)(?:-|$)/);
          if (match) {
            footnoteNumber = Math.max(footnoteNumber, Number(match[1]));
          }
        }
      }
    });

    footnoteDialogRef.current?.close();
    setFootnoteDialogOpen(false);
    setFootnoteText('');
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'text',
        text: String(footnoteNumber + 1),
        marks: [{
          type: 'link',
          attrs: {
            href: `#footnote-${footnoteNumber + 1}-${encodeFootnote(note)}`,
          },
        }],
      })
      .run();
  }

  return (
    <div className="story-text-editor">
      <div aria-label="Story formatting" className="story-text-editor-toolbar" role="toolbar">
        <ToolbarButton
          active={editor?.isActive('bold')}
          disabled={disabled}
          label="Bold"
          onClick={() => editor?.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          active={editor?.isActive('italic')}
          disabled={disabled}
          label="Italic"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          active={editor?.isActive('heading', { level: 2 })}
          disabled={disabled}
          label="Heading"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <ToolbarButton
          active={editor?.isActive('bulletList')}
          disabled={disabled}
          label="Bulleted list"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          active={editor?.isActive('orderedList')}
          disabled={disabled}
          label="Numbered list"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        />
        <ToolbarButton
          active={editor?.isActive('blockquote')}
          disabled={disabled}
          label="Quote"
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        />
        <ToolbarButton
          disabled={disabled}
          label="Footnote"
          onClick={() => setFootnoteDialogOpen(true)}
        />
      </div>
      <EditorContent editor={editor} />
      <dialog
        aria-labelledby="story-footnote-title"
        className="story-footnote-dialog"
        onClose={() => setFootnoteDialogOpen(false)}
        ref={footnoteDialogRef}
      >
        <div>
          <h2 id="story-footnote-title">Add a footnote</h2>
          <label>
            Footnote text
            <textarea
              onChange={(event) => setFootnoteText(event.target.value)}
              ref={footnoteInputRef}
              rows={4}
              value={footnoteText}
            />
          </label>
          <div className="story-footnote-dialog-actions">
            <button disabled={!footnoteText.trim()} onClick={addFootnote} type="button">
              Insert footnote
            </button>
            <button onClick={() => setFootnoteDialogOpen(false)} type="button">Cancel</button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
