import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createAndOpenAiChat } from './AiHelpers';
import '../../styles/floatingAiButton.css';

export default function FloatingAiButton({ user }) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.preventDefault();
    createAndOpenAiChat({ user, navigate });
  };

  return (
    <button
      className="um-floating-ai-button"
      aria-label="Uni.AI"
      data-title="Uni.AI"
      onClick={handleClick}
      title="Uni.AI"
    >
      {/* Avatar image is in `/public/images/uni-ai-avatar.svg` */}
      <img src="/images/uni-ai-avatar.svg" alt="Uni.AI" className="um-ai-avatar" />
      <span className="sr-only">Uni.AI</span>
    </button>
  );
}
