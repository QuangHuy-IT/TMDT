import React, { useEffect, useRef, useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const RichTextEditor = ({ value, onChange, placeholder = 'Mô tả sản phẩm... có thể chèn ảnh từ máy hoặc URL' }) => {
  const quillRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!quillRef.current) return;

    // getEditor() tồn tại trên class ReactQuill theo type definitions
    const editor = quillRef.current.getEditor?.();
    if (!editor) return;

    // Quill toolbar module cho phép addHandler để override image handler mặc định
    const toolbarModule = editor.getModule('toolbar');

    if (toolbarModule && toolbarModule.addHandler) {
      // Override image handler — bỏ qua popup của Quill, dùng file input tùy chỉnh
      toolbarModule.addHandler('image', () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = (e) => {
            const range = editor.getSelection(true);
            editor.insertEmbed(range.index, 'image', e.target.result);
            editor.setSelection(range.index + 1);
          };
          reader.readAsDataURL(file);
        };
      });
    }

    setIsReady(true);
  }, []);

  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: [] }],
        ['link', 'image'],
        [{ color: [] }, { background: [] }],
        ['clean'],
      ],
    },
  };

  const formats = [
    'header', 'bold', 'italic', 'strike', 'list', 'bullet',
    'align', 'link', 'image', 'color', 'background',
  ];

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        className="[&_.ql-container]:min-h-[160px] [&_.ql-editor]:min-h-[160px] [&_.ql-editor]:text-sm [&_.ql-editor]:text-gray-700 [&_.ql-editor]:leading-relaxed [&_.ql-editor_img]:max-w-full [&_.ql-editor_img]:h-auto [&_.ql-editor_img]:rounded-lg"
        placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;
