import toast from 'react-hot-toast';

// Style chung cho toast
const toastStyle = {
  fontSize: '16px',
  fontWeight: '600',
  padding: '16px 22px',
  borderRadius: '14px',
  boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
  border: '1px solid',
};

// Style cho Success
const successStyle = {
  ...toastStyle,
  background: '#fff9db', // Vàng kem
  color: '#3f3f3f',
  borderColor: '#fcd34d',
};

// Style cho Error
const errorStyle = {
  ...toastStyle,
  background: '#fef2f2', // Hồng nhạt
  color: '#991b1b',
  borderColor: '#fca5a5',
};

// Hàm thông báo thành công
export const notifySuccess = (message) => {
  toast.success(message, {
    duration: 4000,
    position: 'top-center',
    style: successStyle,
    icon: '🎉',
  });
};

// Hàm thông báo lỗi
export const notifyError = (message) => {
  toast.error(message, {
    duration: 4000,
    position: 'top-center',
    style: errorStyle,
    icon: '🚫',
  });
};

// Hàm thông báo cho Promise (Call API)
export const notifyPromise = (promise, { loading, success, error }) => {
  return toast.promise(
    promise,
    {
      loading: loading,
      success: (data) => {
        // Trả về message success, có thể từ data hoặc từ tham số
        return typeof success === 'function' ? success(data) : success;
      },
      error: (err) => {
         // Trả về message error, có thể từ err.response.data hoặc từ tham số
        return typeof error === 'function' ? error(err) : err.response?.data?.message || error;
      },
    },
    {
      loading: {
        style: { ...toastStyle, background: '#f0f4f8', color: '#333', borderColor: '#d0d8e0'},
      },
      success: {
        style: successStyle,
        icon: '🎉',
      },
      error: {
        style: errorStyle,
        icon: '🚫',
      },
    }
  );
};