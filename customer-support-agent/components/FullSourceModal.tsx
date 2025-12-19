/**
 * @file 完整源内容模态框组件
 * 
 * 该组件用于在对话中显示 RAG（检索增强生成）引用的完整原始文本内容。
 */
import React from "react";
import ReactMarkdown from "react-markdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RAGSource } from "@/app/lib/utils";

/**
 * 完整源内容模态框属性定义
 */
interface FullSourceModalProps {
  /** 模态框是否处于打开状态 */
  isOpen: boolean;
  /** 关闭模态框的回调函数 */
  onClose: () => void;
  /** 当前选中的 RAG 源数据 */
  source: RAGSource | null;
}

/**
 * 完整源内容模态框组件
 * 
 * @param props - 组件属性
 */
const FullSourceModal: React.FC<FullSourceModalProps> = ({
  isOpen,
  onClose,
  source,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{source?.fileName || "完整内容预览"}</DialogTitle>
        </DialogHeader>
        {source ? (
          <>
            <div className="mb-4">
              <span className="font-bold">匹配分数: </span>
              {(source.score * 100).toFixed(2)}%
            </div>
            {/* 使用 ReactMarkdown 渲染片段，支持格式化显示 */}
            <ReactMarkdown className="max-h-[60vh] overflow-y-auto mb-4">
              {source.snippet}
            </ReactMarkdown>
          </>
        ) : (
          <p>未选择任何源内容</p>
        )}
        <Button onClick={onClose}>关闭</Button>
      </DialogContent>
    </Dialog>
  );
};

export default FullSourceModal;
