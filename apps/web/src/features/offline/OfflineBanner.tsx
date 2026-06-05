import React from "react";
import { AlertTriangle } from "lucide-react";

interface OfflineBannerProps {
  isOnline: boolean;
  message: string;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOnline, message }) => {
  if (isOnline) return null;

  return (
    <div style={{
      backgroundColor: "#b91c1c",
      color: "#ffffff",
      padding: "10px 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      fontSize: "14px",
      fontWeight: "600",
      zIndex: 9999,
      position: "relative",
    }}>
      <AlertTriangle size={18} />
      <span>{message}</span>
    </div>
  );
};
