import React, { useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Heading3,
} from 'lucide-react';

const MenuButton = ({ onClick, isActive, title, children, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded-lg transition-all ${
      isActive
        ? 'bg-red-600 text-white'
        : 'text-gray-600 hover:bg-gray-100 hover:text-red-600'
    } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
  >
    {children}
  </button>
);

export const TiptapEditor = ({ value, onChange, placeholder = 'Nhập nội dung...' }) => {
  const fileInputRef = useRef(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageWidth, setImageWidth] = useState(600);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-red-600 underline',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setSelectedImage(ev.target.result);
      setImageWidth(600);
      setShowImageModal(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleInsertImage = () => {
    if (!selectedImage || !editor) return;
    editor.chain().focus().setImage({ src: selectedImage, width: imageWidth }).run();
    setShowImageModal(false);
    setSelectedImage(null);
  };

  const handleLinkAdd = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Nhập URL:', 'https://');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) {
    return (
      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white min-h-[200px] flex items-center justify-center">
        <span className="text-gray-400">Đang tải editor...</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2 mr-1">
          <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Heading 1">
            <Heading1 className="w-4 h-4" />
          </MenuButton>
          <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Heading 2">
            <Heading2 className="w-4 h-4" />
          </MenuButton>
          <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Heading 3">
            <Heading3 className="w-4 h-4" />
          </MenuButton>
        </div>

        <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2 mr-1">
          <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold">
            <Bold className="w-4 h-4" />
          </MenuButton>
          <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic">
            <Italic className="w-4 h-4" />
          </MenuButton>
          <MenuButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough">
            <Strikethrough className="w-4 h-4" />
          </MenuButton>
        </div>

        <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2 mr-1">
          <MenuButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List">
            <List className="w-4 h-4" />
          </MenuButton>
          <MenuButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Numbered List">
            <ListOrdered className="w-4 h-4" />
          </MenuButton>
        </div>

        <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2 mr-1">
          <MenuButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Align Left">
            <AlignLeft className="w-4 h-4" />
          </MenuButton>
          <MenuButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Align Center">
            <AlignCenter className="w-4 h-4" />
          </MenuButton>
          <MenuButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Align Right">
            <AlignRight className="w-4 h-4" />
          </MenuButton>
        </div>

        <div className="flex items-center gap-0.5">
          <MenuButton onClick={handleLinkAdd} isActive={editor.isActive('link')} title="Insert Link">
            <LinkIcon className="w-4 h-4" />
          </MenuButton>
          <MenuButton onClick={() => fileInputRef.current?.click()} title="Insert Image">
            <ImageIcon className="w-4 h-4" />
          </MenuButton>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      {/* Editor Content */}
      <div className="tiptap-editor-wrapper">
        <EditorContent 
          editor={editor} 
          className="min-h-[200px] [&_.ProseMirror]:px-4 [&_.ProseMirror]:py-3 [&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:outline-none [&_.ProseMirror]:text-sm [&_.ProseMirror]:text-gray-700 [&_.ProseMirror]:leading-relaxed [&_.ProseMirror_p.is_editor-empty::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is_editor-empty::before]:text-gray-400 [&_.ProseMirror_p.is_editor-empty::before]:float-left [&_.ProseMirror_p.is_editor-empty::before]:pointer-events-none [&_.ProseMirror_p.is_editor-empty::before]:h-0" 
        />
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Chỉnh kích thước ảnh</h3>
            </div>

            <div className="p-6 space-y-4">
              {selectedImage && (
                <div className="max-h-48 overflow-hidden rounded-lg bg-gray-100">
                  <img src={selectedImage} alt="Preview" className="max-w-full max-h-48 mx-auto object-contain" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chiều rộng (px)</label>
                <input
                  type="number"
                  value={imageWidth}
                  onChange={(e) => setImageWidth(parseInt(e.target.value) || 100)}
                  min={100}
                  max={1200}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex gap-2">
                {[200, 400, 600, 800].map((size) => (
                  <button
                    key={size}
                    onClick={() => setImageWidth(size)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      imageWidth === size ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {size}px
                  </button>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => { setShowImageModal(false); setSelectedImage(null); }}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleInsertImage}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Chèn ảnh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TiptapEditor;
