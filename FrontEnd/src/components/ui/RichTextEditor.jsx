import React, { useMemo } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const RichTextEditor = ({ value, onChange, placeholder = 'Mô tả sản phẩm... có thể chèn ảnh từ máy hoặc URL' }) => {
  // Image handler: đọc file → base64 → insert vào editor
  const imageHandler = function() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const range = this.quill.getSelection(true);
        this.quill.insertEmbed(range.index, 'image', e.target.result);
        this.quill.setSelection(range.index + 1);
      };
      reader.readAsDataURL(file);
    };
  };

  // Chỉ dùng toolbar mặc định của Quill (đẹp & có sẵn)
  const modules = useMemo(() => ({
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
      handlers: {
        image: imageHandler,
      },
    },
  }), []);

  const formats = [
    'header', 'bold', 'italic', 'strike', 'list', 'bullet',
    'align', 'link', 'image', 'color', 'background',
  ];

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 [&_.ql-toolbar]:!bg-gray-50 [&_.ql-toolbar]:!border-gray-200 [&_.ql-toolbar_.ql-stroke]:!stroke-gray-500 [&_.ql-toolbar_.ql-fill]:!fill-gray-500 [&_.ql-toolbar_.ql-picker]:!text-gray-600 [&_.ql-toolbar_.ql-picker-label]:!text-gray-500">
      <ReactQuill
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
