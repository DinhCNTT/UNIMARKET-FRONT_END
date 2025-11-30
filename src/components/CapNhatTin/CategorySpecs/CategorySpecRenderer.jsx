import React from "react";
import PhoneSpecs from "./PhoneSpecs";
// import LaptopSpecs from "./LaptopSpecs"; // Sau này import thêm

const CategorySpecRenderer = ({ categoryName, dynamicData, onDynamicChange }) => {
  if (!categoryName) return null;

  const normalizedName = categoryName.toLowerCase();

  // Logic hiển thị cho Điện thoại
  if (normalizedName.includes("điện thoại")) {
    return <PhoneSpecs data={dynamicData} onChange={onDynamicChange} />;
  }

  // Logic hiển thị cho Laptop (Ví dụ mở rộng sau này)
  // if (normalizedName.includes("laptop")) {
  //   return <LaptopSpecs data={dynamicData} onChange={onDynamicChange} />;
  // }

  return null;
};

export default CategorySpecRenderer;