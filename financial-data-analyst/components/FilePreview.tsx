/**
 * @file 文件预览组件
 * 
 * 该组件用于在上传前或聊天界面中显示选定文件的预览。
 * 支持图片预览和非图片文件（如文本、PDF等）的占位符显示。
 */
import React from "react";
import { X, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

/**
 * 文件预览组件的属性
 */
interface FilePreviewProps {
  /** 文件对象信息 */
  file: {
    /** 文件的 base64 编码数据 */
    base64: string;
    /** 文件名 */
    fileName: string;
    /** 文件的媒体类型 (MIME type) */
    mediaType: string;
    /** 是否为文本文件 */
    isText?: boolean;
  };
  /** 点击移除按钮时的回调函数 */
  onRemove?: () => void;
  /** 预览图的大小 */
  size?: "small" | "large";
}

/**
 * 文件预览组件
 * 
 * @param props - 组件属性
 */
const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  onRemove,
  size = "large",
}) => {
  /** 是否为图片文件 */
  const isImage = file.mediaType.startsWith("image/");
  /** 获取文件后缀名 */
  const fileExtension = file.fileName.split(".").pop()?.toLowerCase() || "";

  /** 截断文件名，以便在小尺寸下显示 */
  const truncatedName =
    file.fileName.length > 7
      ? `${file.fileName.slice(0, 7)}...${file.fileName.slice(
          file.fileName.lastIndexOf("."),
        )}`
      : file.fileName;

  /** 图片的 Data URL */
  const imageUrl = isImage
    ? `data:${file.mediaType};base64,${file.base64}`
    : "";

  // 渲染小尺寸预览（徽章样式）
  if (size === "small") {
    return (
      <Badge variant="secondary" className="gap-2 py-1 px-3">
        {isImage ? (
          <div className="relative w-4 h-4">
            <Image
              src={imageUrl}
              alt={file.fileName}
              className="object-cover rounded"
              fill
              sizes="16px"
              unoptimized
            />
          </div>
        ) : (
          <FileText className="w-4 h-4" />
        )}
        <span className="text-xs">{truncatedName}</span>
      </Badge>
    );
  }

  // 渲染大尺寸预览（方块卡片样式）
  return (
    <div className="relative inline-flex items-center rounded-lg border bg-card text-card-foreground shadow-sm w-16 h-16">
      {isImage ? (
        <div className="relative w-full h-full">
          <Image
            src={imageUrl}
            alt={file.fileName}
            className="object-cover rounded-lg"
            fill
            sizes="64px"
            unoptimized
          />
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-muted rounded-lg">
          <FileText className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium uppercase">{fileExtension}</span>
        </div>
      )}
      {onRemove && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onRemove();
          }}
          className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};

export default FilePreview;
