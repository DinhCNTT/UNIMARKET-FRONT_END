//src/components/ChatBanHang/LocationPickerModal.jsx
import React, { useState, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import styles from "./ModuleChatCss/LocationPickerModal.module.css";

// --- Fix lỗi icon mặc định của Leaflet trong React ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Component xử lý việc click vào bản đồ để di chuyển ghim
function LocationMarker({ position, setPosition }) {
  const markerRef = useRef(null);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          setPosition(marker.getLatLng());
        }
      },
    }),
    [setPosition]
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    >
      <Popup>Kéo thả ghim hoặc click vào bản đồ để chọn vị trí chính xác.</Popup>
    </Marker>
  );
}

const LocationPickerModal = ({ initialPosition, onConfirm, onClose }) => {
  // State lưu vị trí ghim hiện tại (bắt đầu bằng vị trí gợi ý từ Wifi)
  const [position, setPosition] = useState(initialPosition || { lat: 10.762622, lng: 106.660172 });

  const handleConfirm = () => {
    onConfirm(position);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>📍 Xác nhận vị trí</h3>
          <p>Định vị tự động có thể chưa chính xác. Vui lòng kéo ghim đến đúng vị trí của bạn.</p>
        </div>

        <div className={styles.mapWrapper}>
          <MapContainer 
            center={position} 
            zoom={16} 
            scrollWheelZoom={true} 
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} setPosition={setPosition} />
          </MapContainer>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.btnCancel} onClick={onClose}>Hủy bỏ</button>
          <button className={styles.btnConfirm} onClick={handleConfirm}>Gửi vị trí này</button>
        </div>
      </div>
    </div>
  );
};

export default LocationPickerModal;
