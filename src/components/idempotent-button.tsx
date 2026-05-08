'use client'

import { useState } from 'react'
import { Button, ButtonProps } from '@/components/ui/button'

type IdempotentButtonProps = ButtonProps & {
  onClick: () => Promise<void> | void
  cooldown?: number // Cooldown in ms
  processingText?: string
}

/**
 * Button component dengan idempotency protection
 * Prevents double-clicks dan rapid submissions
 * 
 * @example
 * ```typescript
 * <IdempotentButton 
 *   onClick={handlePayment}
 *   cooldown={3000}
 *   processingText="Processing..."
 * >
 *   Bayar Sekarang
 * </IdempotentButton>
 * ```
 */
export function IdempotentButton({
  onClick,
  children,
  cooldown = 2000,
  processingText = 'Processing...',
  disabled,
  ...props
}: IdempotentButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastClickTime, setLastClickTime] = useState(0)

  const handleClick = async () => {
    const now = Date.now()
    
    // Check cooldown
    if (now - lastClickTime < cooldown) {
      return
    }
    
    if (isProcessing) {
      return
    }

    setIsProcessing(true)
    setLastClickTime(now)

    try {
      await onClick()
    } catch (error) {
      console.error('Button action failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Button
      {...props}
      onClick={handleClick}
      disabled={disabled || isProcessing}
    >
      {isProcessing ? processingText : children}
    </Button>
  )
}
