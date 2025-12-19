/**
 * @file 文件处理工具函数
 * 
 * 提供了一组用于读取和处理不同类型文件（文本、图片、PDF）的工具函数。
 */

/**
 * 将文件作为纯文本读取
 * @param file - 要读取的文件对象
 * @returns 返回包含文件内容的 Promise<string>
 */
export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const result = reader.result;
        if (typeof result === "string" && result.length > 0) {
          resolve(result);
        } else {
          reject(new Error("Empty or invalid text file")); // 文件为空或无效
        }
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

/**
 * 将文件转换为 Base64 编码字符串
 * 常用于图片或二进制文件的传输
 * @param file - 要读取的文件对象
 * @returns 返回 Base64 字符串的 Promise<string>
 */
export const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        // 从 Data URL 中提取 Base64 部分 (data:*/*;base64,XXXXX)
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * 读取 PDF 文件并提取其中的文本内容
 * 该函数会动态加载 PDF.js 库来解析 PDF
 * @param file - PDF 文件对象
 * @returns 返回提取出的完整文本内容的 Promise<string>
 */
export const readFileAsPDFText = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 动态创建 script 标签加载 PDF.js
    const script = document.createElement("script");
    script.src = "//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";

    script.onload = async () => {
      try {
        // @ts-ignore - PDF.js adds this to window
        const pdfjsLib = window["pdfjs-dist/build/pdf"];
        // 指定 worker 路径
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let fullText = "";

        // 遍历所有页面提取文本
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();

          let lastY: number | null = null;
          let text = "";

          for (const item of textContent.items) {
            // 根据坐标判断是否需要换行
            if (lastY !== null && Math.abs(lastY - item.transform[5]) > 5) {
              text += "\n";
            } else if (lastY !== null && text.length > 0) {
              text += " ";
            }

            text += item.str;
            lastY = item.transform[5];
          }

          fullText += text + "\n\n";
        }

        // 清理 script 标签
        document.body.removeChild(script);
        resolve(fullText.trim());
      } catch (error) {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
        reject(error);
      }
    };

    script.onerror = () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      reject(new Error("Failed to load PDF.js library")); // 加载 PDF.js 库失败
    };

    document.body.appendChild(script);
  });
};

/**
 * 文件上传对象定义
 */
export interface FileUpload {
  /** 文件的 Base64 编码 */
  base64: string;
  /** 文件名 */
  fileName: string;
  /** MIME 类型 */
  mediaType: string;
  /** 是否为文本文件 */
  isText?: boolean;
  /** 文件大小（可选） */
  fileSize?: number;
}
