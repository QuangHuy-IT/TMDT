const ZaloButton = ({ phoneNumber = '0866093546' }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <a 
        href={`https://zalo.me/${phoneNumber}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="relative block w-14 h-14 md:w-16 md:h-16 group"
      >
        {/* Hiệu ứng sóng lan tỏa phía sau */}
        <span className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-20"></span>
        
        <div className="relative z-10 w-full h-full p-2 bg-white rounded-full shadow-2xl transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-6 flex items-center justify-center border border-gray-100">
          <img 
            src="https://stc-zaloprofile.zdn.vn/pc/v1/images/logo.png" 
            alt="Zalo Contact" 
            className="w-full h-auto object-contain"
          />
        </div>

        {/* Tooltip khi di chuột vào */}
        <span className="absolute right-16 scale-0 rounded bg-gray-800 p-2 text-xs text-white transition-all group-hover:scale-100 whitespace-nowrap">
          Chat với chúng tôi qua Zalo
        </span>
      </a>
    </div>
  );
};

export default ZaloButton;
