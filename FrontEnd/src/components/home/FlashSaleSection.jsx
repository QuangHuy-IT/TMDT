import React from 'react';
import FlashSaleSection from '../flash-sale/FlashSaleSection';

const FlashSaleSectionWrapper = ({ flashSaleData, isLoading }) => {
  return <FlashSaleSection flashSaleData={flashSaleData} isLoading={isLoading} />;
};

export default FlashSaleSectionWrapper;
