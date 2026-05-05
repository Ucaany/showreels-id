'use client'

import { useState, useRef, FormEvent } from 'react'
import { v4 as uuidv4 } from 'uuid'

type IdempotentFormProps = {
  onSubmit: (data: Record<string, any>, idempotencyKey: string) => Promise<void>
  children: React.ReactNode
  className?: string
}

/**
 * Form component dengan automatic idempotency key generation
 * Prevents duplicate form submissions
 * 
 * @example
 * ```typescript
 * <IdempotentForm onSubmit={handleSubmit}>
 *   <input name="title" />
 *   <button type="submit">Submit</button>
 * </IdempotentForm>
 * ```
 */
export function IdempotentForm({ onSubmit, children, className }: IdempotentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const idempotencyKeyRef = useRef<string>(uuidv4())

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (isSubmitting) {
      console.log('Form already submitting')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      const data = Object.fromEntries(formData.entries())
      
      await onSubmit(data, idempotencyKeyRef.current)
      
      // Generate new key for next submission
      idempotencyKeyRef.current = uuidv4()
    } catch (error) {
      console.error('Form submission failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children}
      <input
        type="hidden"
        name="idempotencyKey"
        value={idempotencyKeyRef.current}
      />
    </form>
  )
}
