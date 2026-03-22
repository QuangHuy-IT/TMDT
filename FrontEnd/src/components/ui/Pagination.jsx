import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <div className="flex items-center justify-center space-x-2 mt-10">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg border hover:bg-gray-100 disabled:opacity-30"
      >
        ←
      </button>
      
      {[...Array(totalPages)].map((_, i) => (
        <button
          key={i}
          onClick={() => onPageChange(i + 1)}
          className={`w-10 h-10 rounded-lg border font-medium transition-colors ${
            currentPage === i + 1 ? 'bg-red-600 text-white border-red-600' : 'hover:bg-gray-100'
          }`}
        >
          {i + 1}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg border hover:bg-gray-100 disabled:opacity-30"
      >
        →
      </button>
    </div>
  );
};

export default Pagination;