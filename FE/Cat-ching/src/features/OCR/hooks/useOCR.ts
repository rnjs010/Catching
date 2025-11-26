import { useState } from 'react'
import Tesseract from 'tesseract.js'

export const useOCR = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  
  const extractText = async (image: string | File) => {
    setIsProcessing(true)
    try {
      const result = await Tesseract.recognize(image, 'kor+eng')
      return result.data.text
    } finally {
      setIsProcessing(false)
    }
  }
  
  return { extractText, isProcessing }
}
