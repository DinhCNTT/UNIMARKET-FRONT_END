import { useEffect, useState } from 'react';
import { FaFacebookF } from 'react-icons/fa';
import './FacebookLoginButton.css';

const FacebookLoginButton = () => {
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    if (window.FB) {
      setSdkReady(true);
      return;
    }

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: '1838308526739877',
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
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
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
    <button
      onClick={handleFacebookLogin}
      disabled={!sdkReady}
      className="facebook-button"
    >
      <FaFacebookF className="facebook-icon" />
      {sdkReady ? 'Đăng nhập bằng Facebook' : 'Đang tải Facebook...'}
    </button>
  );
};

export default FacebookLoginButton;
