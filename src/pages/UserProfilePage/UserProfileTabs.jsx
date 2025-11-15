import React, { useEffect, useRef } from "react";
import styles from "./UserProfileTabs.module.css";
import { IoNewspaperOutline } from "react-icons/io5";
import { MdOutlineOndemandVideo } from "react-icons/md";

const UserProfileTabs = ({ activeTab, onTabClick }) => {
  const tabsWrapperRef = useRef(null);

  /**
   * ✅ GIỮ LẠI LOGIC UNDERLINE ĐỘNG:
   * Logic này giờ đã được đóng gói trong component này
   * và không làm ảnh hưởng đến component cha.
   */
  useEffect(() => {
    const tabsWrapper = tabsWrapperRef.current;
    if (!tabsWrapper) return;

    const tabs = tabsWrapper.querySelectorAll(`.${styles.tab}`);
    if (tabs.length === 0) return;

    const handleMouseEnter = (e) => {
      const rect = e.target.getBoundingClientRect();
      const parentRect = tabsWrapper.getBoundingClientRect();
      tabsWrapper.style.setProperty(
        "--underline-left",
        rect.left - parentRect.left + "px"
      );
      tabsWrapper.style.setProperty("--underline-width", rect.width + "px");
    };

    tabs.forEach((tab) =>
      tab.addEventListener("mouseenter", handleMouseEnter)
    );

    // Set vị trí underline cho tab active ban đầu
    const activeTabElement = tabsWrapper.querySelector(`.${styles.active}`);
    if (activeTabElement) {
      const rect = activeTabElement.getBoundingClientRect();
      const parentRect = tabsWrapper.getBoundingClientRect();
      tabsWrapper.style.setProperty(
        "--underline-left",
        rect.left - parentRect.left + "px"
      );
      tabsWrapper.style.setProperty("--underline-width", rect.width + "px");
    }

    return () => {
      tabs.forEach((tab) =>
        tab.removeEventListener("mouseenter", handleMouseEnter)
      );
    };
  }, [activeTab]); // Chạy lại khi activeTab thay đổi để set lại underline

  return (
    <div className={styles.tabsContainer} ref={tabsWrapperRef}>
      <button
        className={`${styles.tab} ${activeTab === "posts" ? styles.active : ""}`}
        onClick={() => onTabClick("posts")}
      >
        <IoNewspaperOutline /> Tin đăng
      </button>
      <button
        className={`${styles.tab} ${
          activeTab === "videos" ? styles.active : ""
        }`}
        onClick={() => onTabClick("videos")}
      >
        <MdOutlineOndemandVideo /> Video
      </button>
    </div>
  );
};

export default UserProfileTabs;