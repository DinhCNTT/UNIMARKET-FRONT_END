import { useState, useEffect } from 'react';
import { quickMessageService } from '../../services/quickMessageService';

/**
 * Custom hook để quản lý tin nhắn nhanh (Quick Messages)
 * Xử lý load, save, delete, edit và sync với quick-replies bar
 */
export const useQuickMessages = (userId) => {
  const [quickMessages, setQuickMessages] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [isLoadingQuickMessages, setIsLoadingQuickMessages] = useState(false);
  const [isSavingQuickMessages, setIsSavingQuickMessages] = useState(false);

  /**
   * Tìm phần tử container chứa nút quick replies trên trang
   */
  const findQuickRepliesContainer = () => {
    let container = document.querySelector('div[class*="quickReplies"]');
    if (!container) container = document.querySelector('div[class^="_quickReplies_"]');
    if (container) {
      console.log('[QuickMessages] Found quick-replies container');
    }
    return container;
  };

  /**
   * Tạo nút quick reply động
   */
  const createQuickReplyButton = (text) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = '_quickReplyBtn_4u9j7_41';
    btn.textContent = text;
    btn.addEventListener('click', () => {
      try {
        const evt = new CustomEvent('quick-reply', { detail: { text } });
        window.dispatchEvent(evt);
      } catch (e) {
        const input = document.querySelector('textarea') || document.querySelector('input[type="text"]');
        if (input) {
          input.value = text;
          input.focus();
          const event = new Event('input', { bubbles: true });
          input.dispatchEvent(event);
        }
      }
    });
    return btn;
  };

  /**
   * Sync tin nhắn nhanh vào quick-replies bar (với retry mechanism)
   */
  const syncQuickRepliesBar = (messages) => {
    console.log('[QuickMessages] syncQuickRepliesBar called with', messages?.length || 0, 'messages');
    let container = findQuickRepliesContainer();

    if (!container) {
      console.log('[QuickMessages] Quick-replies container not found on page yet, retrying...');
      setTimeout(() => {
        container = findQuickRepliesContainer();
        if (container) {
          console.log('[QuickMessages] Found container after 100ms retry');
          doSyncQuickRepliesBar(container, messages);
        } else {
          console.log('[QuickMessages] Still no container after 100ms, trying again...');
          setTimeout(() => {
            container = findQuickRepliesContainer();
            if (container) {
              console.log('[QuickMessages] Found container after 300ms retry');
              doSyncQuickRepliesBar(container, messages);
            } else {
                console.warn('[QuickMessages] Could not find quick-replies container after 300ms');
                // As a more robust fallback, observe DOM mutations and wait for the container to appear.
                try {
                  const observer = new MutationObserver((mutations, obs) => {
                    const c = findQuickRepliesContainer();
                    if (c) {
                      console.log('[QuickMessages] Found container via MutationObserver');
                      doSyncQuickRepliesBar(c, messages);
                      try { obs.disconnect(); } catch(e) {}
                    }
                  });
                  observer.observe(document.body, { childList: true, subtree: true });
                  // Safety: stop observing after 10s to avoid leaking observers
                  setTimeout(() => {
                    try { observer.disconnect(); console.log('[QuickMessages] MutationObserver disconnected after timeout'); } catch(e) {}
                  }, 10000);
                } catch (obsErr) {
                  console.warn('[QuickMessages] MutationObserver not available or failed:', obsErr);
                }
            }
          }, 200);
        }
      }, 100);
      return;
    }

    console.log('[QuickMessages] Found quick-replies container immediately');
    doSyncQuickRepliesBar(container, messages);
  };

  /**
   * Thực hiện sync nút quick replies vào DOM
   */
  const doSyncQuickRepliesBar = (container, messages) => {
    console.log('[QuickMessages] doSyncQuickRepliesBar: syncing', messages?.length || 0, 'messages to container');
    let managed = container.querySelector('[data-managed-by="quick-messages"]');
    if (!managed) {
      console.log('[QuickMessages] Creating managed wrapper for quick messages');
      managed = document.createElement('div');
      managed.setAttribute('data-managed-by', 'quick-messages');
      // Style để các button nằm cùng hàng với các quick replies khác
      managed.style.display = 'contents'; // Hoặc 'inline-flex' tùy theo layout cha
      container.insertBefore(managed, container.firstChild);
    }

    managed.innerHTML = '';

    const toShow = Array.isArray(messages) ? messages : [];
    console.log('[QuickMessages] Creating', toShow.length, 'quick message buttons');
    toShow.forEach((m) => {
      const b = createQuickReplyButton(m.content || m.Content || String(m));
      b.dataset.quickMessageId = m.id ?? '';
      managed.appendChild(b);
    });
    console.log('[QuickMessages] Finished syncing quick messages to DOM');
  };

  /**
   * Load tin nhắn nhanh từ API
   */
  const loadQuickMessages = async () => {
    if (!userId) {
      console.warn('[QuickMessages] userId not available yet');
      return;
    }

    setIsLoadingQuickMessages(true);
    try {
      console.log('[QuickMessages] Calling getMyQuickMessages with userId:', userId);
      const messages = await quickMessageService.getMyQuickMessages();
      setQuickMessages(messages || []);
      console.log('[QuickMessages] Loaded quick messages:', messages);
      try {
        syncQuickRepliesBar(messages || []);
      } catch (e) {
        console.warn('[QuickMessages] syncQuickRepliesBar failed:', e);
      }
    } catch (error) {
      console.error('Lỗi load tin nhắn nhanh:', error);
      setQuickMessages([]);
      if (error.response?.status === 401) {
        console.log('[QuickMessages] Got 401, retrying after 1s...');
        setTimeout(() => {
          quickMessageService.getMyQuickMessages()
            .then(msgs => {
              setQuickMessages(msgs || []);
              console.log('[QuickMessages] Retry successful:', msgs);
            })
            .catch(err => {
              console.error('[QuickMessages] Retry failed:', err);
              setQuickMessages([]);
            });
        }, 1000);
      }
    } finally {
      setIsLoadingQuickMessages(false);
    }
  };

  /**
   * Lưu tin nhắn nhanh mới hoặc cập nhật tin nhắn hiện tại
   */
  const saveQuickMessages = async (contentParam) => {
    const contentToSave = contentParam !== undefined ? contentParam : editingContent;
    
    if (!contentToSave.trim()) {
      alert('Vui lòng nhập nội dung tin nhắn');
      return false;
    }

    setIsSavingQuickMessages(true);
    try {
      if (editingId) {
        // Update existing message - find its current order
        const existingMsg = quickMessages.find(m => m.id === editingId);
        const order = existingMsg?.order || 1;
        await quickMessageService.updateQuickMessage(editingId, contentToSave, order);
        console.log('[QuickMessages] Quick message updated successfully');
      } else {
        // Create new message - find the first available order (1-5)
        const usedOrders = new Set(quickMessages.map(m => m.order));
        let availableOrder = 1;
        for (let i = 1; i <= 5; i++) {
          if (!usedOrders.has(i)) {
            availableOrder = i;
            break;
          }
        }
        // If all slots are full (shouldn't happen), use the next available
        if (usedOrders.size >= 5) {
          alert('Đã đạt giới hạn tối đa 5 tin nhắn nhanh');
          setIsSavingQuickMessages(false);
          return false;
        }
        await quickMessageService.createQuickMessage(contentToSave, availableOrder);
        console.log('[QuickMessages] Quick message saved with order:', availableOrder);
      }
      
      await loadQuickMessages();
      setEditingContent('');
      setEditingId(null);
      try {
        const latest = await quickMessageService.getMyQuickMessages();
        syncQuickRepliesBar(latest || []);
      } catch (e) {
        console.warn('[QuickMessages] Could not sync quick replies after save:', e);
      }
      return true;
    } catch (error) {
      console.error('Lỗi lưu tin nhắn nhanh:', error);
      alert('Lỗi lưu tin nhắn nhanh: ' + (error.response?.data?.message || error.message));
      return false;
    } finally {
      setIsSavingQuickMessages(false);
    }
  };

  /**
   * Xóa tin nhắn nhanh
   */
  const deleteQuickMessage = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa tin nhắn này?')) return false;

    try {
      await quickMessageService.deleteQuickMessage(id);
      setQuickMessages(prev => prev.filter(msg => msg.id !== id));
      console.log('[QuickMessages] Quick message deleted');
      try {
        const latest = await quickMessageService.getMyQuickMessages();
        syncQuickRepliesBar(latest || []);
      } catch (e) {
        console.warn('[QuickMessages] Could not sync quick replies after delete:', e);
      }
      return true;
    } catch (error) {
      console.error('Lỗi xóa tin nhắn nhanh:', error);
      alert('Lỗi xóa tin nhắn: ' + error.message);
      return false;
    }
  };

  /**
   * Bắt đầu chỉnh sửa tin nhắn
   */
  const startEditMessage = (message) => {
    setEditingId(message.id);
    setEditingContent(message.content);
  };

  /**
   * Hủy chỉnh sửa
   */
  const cancelEdit = () => {
    setEditingId(null);
    setEditingContent('');
  };

  /**
   * Load tin nhắn nhanh khi component mount hoặc userId thay đổi
   */
  useEffect(() => {
    if (!userId) return;
    console.log('[QuickMessages] Component mounted with userId, loading quick messages...');
    (async () => {
      try {
        console.log('[QuickMessages] Fetching quick messages from API...');
        const messages = await quickMessageService.getMyQuickMessages();
        setQuickMessages(messages || []);
        console.log('[QuickMessages] Initial load quick messages:', messages);
        console.log('[QuickMessages] Syncing quick replies bar...');
        syncQuickRepliesBar(messages || []);
      } catch (error) {
        console.warn('[QuickMessages] Initial load failed:', error);
      }
    })();
  }, [userId]);

  return {
    // State
    quickMessages,
    setQuickMessages,
    editingId,
    editingContent,
    setEditingContent,
    isLoadingQuickMessages,
    isSavingQuickMessages,

    // Functions
    loadQuickMessages,
    saveQuickMessages,
    deleteQuickMessage,
    startEditMessage,
    cancelEdit,
    syncQuickRepliesBar,
    findQuickRepliesContainer,
  };
};
