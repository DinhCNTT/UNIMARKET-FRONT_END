import React from "react";
import PhoneSpecs from "./PhoneSpecs";
// import LaptopSpecs from "./LaptopSpecs"; 

const CategorySpecRenderer = ({ 
  categoryName, 
  dynamicData, 
  onDynamicChange, 
  errors // 1. Thêm nhận prop errors ở đây
}) => {
  if (!categoryName) return null;

  const normalizedName = categoryName.toLowerCase();

  // Logic hiển thị cho Điện thoại
  if (normalizedName.includes("điện thoại")) {
    return (
      <PhoneSpecs 
        data={dynamicData} 
        onChange={onDynamicChange} 
        errors={errors} // 2. Truyền errors xuống component con
      />
    );
  }

  // Logic hiển thị cho Laptop...
  // if (normalizedName.includes("laptop")) {
  //   return <LaptopSpecs data={dynamicData} onChange={onDynamicChange} errors={errors} />;
  // }

  return null;
};

export default CategorySpecRenderer;