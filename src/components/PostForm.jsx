// PostForm.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import TopNavbar from "../components/TopNavbar";
import { useNavigate } from "react-router-dom";
import styles from "./PostForm.module.css";

const PostForm = () => {
  const [categories, setCategories] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [showSubCategories, setShowSubCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [subCategories, setSubCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("http://localhost:5133/api/category/get-categories-with-icon");
        console.log("Dữ liệu danh mục:", res.data);

        const validCategories = res.data.map(category => ({
          ...category,
          DanhMucCon: Array.isArray(category.danhMucCon) ? category.danhMucCon.filter(sub => sub?.id) : [],
        }));
        setCategories(validCategories);
      } catch (error) {
        console.error("Lỗi khi tải danh mục:", error);
      }
    };
    fetchCategories();

    setModalVisible(true);
  }, []);

  const toggleModal = () => {
    setModalVisible(!modalVisible);
    setShowSubCategories(false);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSubCategories(category.DanhMucCon);
    setShowSubCategories(true);
  };

  const handleBackToCategories = () => {
    setShowSubCategories(false);
  };

  const handleSubCategorySelect = (subCategory) => {
    console.log("Danh mục con đã chọn:", subCategory.tenDanhMucCon);
    setModalVisible(false);
    setShowSubCategories(false);

    navigate(`/post-tin?categoryId=${subCategory.id}&categoryName=${subCategory.tenDanhMucCon}`);
  };

  const handleClickOutside = (event) => {
    if (event.target.closest(`.${styles.content}`) === null) {
      setModalVisible(false);
    }
  };

  return (
    <>
      <TopNavbar />
      <div className={styles.wrapper}>
        <div className={styles.container}>
          <div className={styles.section}>
            
            {/* --- Layout chia 2 cột --- */}
            <div className={styles.layoutContainer}>
              
              {/* Cột Trái: Nội dung chọn danh mục */}
              <div className={styles.leftColumn}>
                <h2 className={styles.mainTitle}>Đăng tin mới</h2>
                <p className={styles.subtitle}>Chọn danh mục để bắt đầu đăng tin</p>
                
                <div className={styles.header} onClick={toggleModal}>
                  <div className={styles.headerContent}>
                    <span className={styles.headerLabel}>Danh mục</span>
                    <span className={styles.headerValue}>
                      {selectedCategory ? selectedCategory.tenDanhMucCha : "Chọn danh mục"}
                    </span>
                  </div>
                  <svg className={styles.chevron} width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              {/* Cột Phải: Ảnh minh họa */}
              <div className={styles.rightColumn}>
                <img 
                  src="/images/FormDangTin.png" 
                  alt="Minh họa đăng tin" 
                  className={styles.illustrationImage} 
                />
              </div>

            </div>
            {/* --- Kết thúc Layout --- */}

            {modalVisible && (
              <div className={`${styles.modal} ${styles.active}`} onClick={handleClickOutside}>
                <div className={styles.content}>
                  {!showSubCategories ? (
                    <>
                      <div className={styles.modalHeader}>
                        <h3 className={styles.modalTitle}>Chọn danh mục</h3>
                        <button className={styles.btnClose} onClick={toggleModal}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                      
                      <div className={styles.grid}>
                        {categories.map((category) => (
                          <div
                            key={category.id}
                            className={styles.item}
                            onClick={() => handleCategorySelect(category)}
                          >
                            <div className={styles.itemLeft}>
                              {category.icon && (
                                <img
                                  src={category.icon}
                                  alt={category.tenDanhMucCha}
                                  className={styles.icon}
                                />
                              )}
                              <span className={styles.itemText}>{category.tenDanhMucCha}</span>
                            </div>
                            <svg className={styles.arrow} width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={styles.modalHeader}>
                        <button className={styles.btnBack} onClick={handleBackToCategories}>
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M12.5 5L7.5 10L12.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>Quay lại</span>
                        </button>
                        <h3 className={styles.modalTitle}>{selectedCategory?.tenDanhMucCha}</h3>
                      </div>
                      
                      <div className={styles.subList}>
                        {subCategories.map((subCategory) => (
                          <div 
                            key={subCategory.id} 
                            className={styles.subItem}
                            onClick={() => handleSubCategorySelect(subCategory)}
                          >
                            <span className={styles.subName}>{subCategory.tenDanhMucCon}</span>
                            <svg className={styles.arrow} width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PostForm;