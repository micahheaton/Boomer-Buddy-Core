import Tesseract from "tesseract.js";

export async function extractTextFromImage(imagePath: string): Promise<string> {
  try {
    const { data: { text } } = await Tesseract.recognize(imagePath, 'eng', {
      logger: m => console.log(m)
    });
    
    return text.trim();
  } catch (error) {
    console.error("OCR error:", error);
    throw new Error("Failed to extract text from image");
  }
}
