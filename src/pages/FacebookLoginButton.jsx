import { useEffect, useState } from 'react';

const FacebookLoginButton = () => {
  const [sdkReady, setSdkReady] = useState(false);

  // Load Facebook SDK
  useEffect(() => {
    if (window.FB) {
      setSdkReady(true);
      return;
    }

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: '1838308526739877', // 👉 Thay bằng App ID của bạn
        cookie: true,
        xfbml: true,
        version: 'v19.0',
      });
      setSdkReady(true);
    };

    const scriptId = 'facebook-jssdk';
    if (!document.getElementById(scriptId)) {
      const js = document.createElement('script');
      js.id = scriptId;
      js.src = 'https://connect.facebook.net/vi_VN/sdk.js';
      document.body.appendChild(js);
    }
  }, []);

  // Gửi accessToken đến backend
  const sendAccessTokenToBackend = async (accessToken) => {
    try {
      const res = await fetch('http://localhost:5133/api/emailverification/facebook-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('🎉 Đăng nhập thành công');
        console.log('Thông tin người dùng:', data);

        // Lưu token vào localStorage (tuỳ bạn)
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));

        // Ví dụ điều hướng sang trang chính (nếu dùng React Router)
        // navigate('/market');
      } else {
        alert(data.message || '❌ Đăng nhập thất bại');
      }
    } catch (error) {
      alert('❌ Lỗi kết nối tới server backend');
      console.error('Lỗi khi gọi API Facebook Login:', error);
    }
  };

  const handleFacebookLogin = () => {
    if (!window.FB) {
      alert('⚠️ Facebook SDK chưa sẵn sàng. Vui lòng thử lại sau.');
      return;
    }

    window.FB.login(
      function (response) {
        if (response.authResponse) {
          const accessToken = response.authResponse.accessToken;
          sendAccessTokenToBackend(accessToken);
        } else {
          alert('❌ Bạn đã huỷ đăng nhập.');
        }
      },
      { scope: 'email' }
    );
  };

  return (
    <button onClick={handleFacebookLogin} disabled={!sdkReady}>
      {sdkReady ? 'Đăng nhập bằng Facebook' : 'Đang tải Facebook...'}
    </button>
  );
};

export default FacebookLoginButton;
