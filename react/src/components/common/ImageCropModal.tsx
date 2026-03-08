import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { X, ZoomIn } from "lucide-react";

interface Props {
  image: string;
  onCropComplete: (croppedImage: Blob) => void;
  onClose: () => void;
}

export default function ImageCropModal({
  image,
  onCropComplete,
  onClose
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropChange = (crop: { x: number; y: number }) => setCrop(crop);
  const onZoomChange = (zoom: number) => setZoom(zoom);

  const onCropCompleteInternal = useCallback(
    (_: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createCroppedImage = async () => {
    try {
      const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedBlob);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h3 className="text-sm font-bold text-zinc-400 tracking-widest">
            IMAGE SURGERY
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="text-zinc-500" size={20} />
          </button>
        </div>

        {/* クロップエリア */}
        <div className="relative h-80 w-full bg-zinc-950">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1} // 正方形固定
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={onZoomChange}
          />
        </div>

        {/* コントロール */}
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <ZoomIn size={18} className="text-zinc-500" />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={e => onZoomChange(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-zinc-800 text-zinc-400 font-bold hover:bg-zinc-700 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={createCroppedImage}
              className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
            >
              切り抜き完了
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- ユーティリティ関数 (Canvasを使って切り抜く) ---
async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise(resolve => (image.onload = resolve));

  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("No 2d context");

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise(resolve => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
    }, "image/jpeg");
  });
}
