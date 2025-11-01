// /hooks/useAvatar.js
import { useEffect, useState, useRef } from "react";

export function useAvatar(imagePath = "/avatar.png") {
  const [imageLoaded, setImageLoaded] = useState(false);
  const avatarImageRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.src = imagePath;
    img.onload = () => {
      avatarImageRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => {
      console.error("[useAvatar] Failed to load avatar image, using placeholder.");
      const canvas = document.createElement("canvas");
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#888";
      ctx.fillRect(0, 0, 100, 100);
      ctx.fillStyle = "#fff";
      ctx.font = "40px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("👤", 50, 50);
      const placeholderImg = new Image();
      placeholderImg.src = canvas.toDataURL();
      placeholderImg.onload = () => {
        avatarImageRef.current = placeholderImg;
        setImageLoaded(true);
      };
    };
  }, [imagePath]);

  return { avatarImageRef, imageLoaded };
}
