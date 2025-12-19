/**
 * @file Toast 通知 Hook
 * 
 * 该 Hook 负责管理应用程序中的 Toast 通知状态（添加、更新、关闭、移除）。
 * 受 react-hot-toast 启发，采用了简单的状态分发机制。
 */
"use client"

import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

/** 同时显示的 Toast 数量限制 */
const TOAST_LIMIT = 1
/** Toast 移除的延迟时间（毫秒） */
const TOAST_REMOVE_DELAY = 1000000

/**
 * Toast 对象的完整定义
 */
type ToasterToast = ToastProps & {
  /** 唯一标识符 */
  id: string
  /** 标题 */
  title?: React.ReactNode
  /** 描述内容 */
  description?: React.ReactNode
  /** 操作按钮元素 */
  action?: ToastActionElement
}

/**
 * 状态操作类型
 */
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

/** 用于生成唯一 ID 的计数器 */
let count = 0

/**
 * 生成唯一的 ID 字符串
 * @returns 唯一的 ID
 */
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

/**
 * Reducer 动作类型定义
 */
type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

/**
 * 状态接口定义
 */
interface State {
  /** 当前显示的 Toast 列表 */
  toasts: ToasterToast[]
}

/** 存储 Toast 移除定时器的映射 */
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

/**
 * 将 Toast 添加到移除队列中
 * @param toastId - 要移除的 Toast ID
 */
const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

/**
 * Toast 状态管理的 Reducer 函数
 * @param state - 当前状态
 * @param action - 触发的动作
 * @returns 新的状态
 */
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // 处理关闭后的副作用：加入移除队列
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

/** 状态变化监听器列表 */
const listeners: Array<(state: State) => void> = []

/** 内存中的状态存储 */
let memoryState: State = { toasts: [] }

/**
 * 分发动作并通知所有监听器
 * @param action - 要分发的动作
 */
function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

/**
 * 创建一个 Toast 通知
 * @param props - Toast 属性
 * @returns 包含 id 和操作方法的对象
 */
function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

/**
 * 用于在组件中访问 Toast 状态和方法的自定义 Hook
 */
function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
