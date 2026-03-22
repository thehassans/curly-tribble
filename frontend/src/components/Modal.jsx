import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function Modal({
  title,
  open,
  onClose,
  children,
  footer,
  width,
  maxWidth,
  dialogStyle,
  bodyStyle,
  footerStyle,
}) {
  useEffect(() => {
    if (open) {
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      document.body.classList.add('modal-open')
      return () => {
        document.body.style.overflow = prevOverflow
        document.body.classList.remove('modal-open')
      }
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ width, maxWidth, ...(dialogStyle || {}) }}
      >
        <div className="header">
          <h3>{title}</h3>
          <button className="btn secondary" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="modal-body" style={bodyStyle}>{children}</div>
        <div className="modal-footer" style={footerStyle}>{footer}</div>
      </div>
    </div>,
    document.body
  )
}
