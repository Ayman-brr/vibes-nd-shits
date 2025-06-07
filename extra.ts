// extra.ts
// Helper functions for video processing

// Type definitions
type TextStyles = {
    fontSize: number;
    rotation: number;
    alignment: 'left' | 'center' | 'right';
    position: { x: number; y: number };
    size: { width: number; height: number };
};

/**
 * Generates a text image with the specified styles
 * @param text The text to render
 * @param styles Text styling options
 * @returns Uint8Array of the PNG image
 */
export async function generateTextImage(text: string, styles: TextStyles): Promise<Uint8Array> {
    // Create off-screen canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
        throw new Error('Could not create canvas context');
    }
    
    // Set canvas size (scaled for better quality)
    const scale = 2;
    canvas.width = 800 * scale;
    canvas.height = 600 * scale;
    ctx.scale(scale, scale);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set text styles
    ctx.font = `${styles.fontSize}px 'Roboto', sans-serif`;
    ctx.fillStyle = 'white';
    ctx.textAlign = styles.alignment;
    ctx.textBaseline = 'top';
    
    // Add text shadow for outline
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Wrap text and calculate dimensions
    const maxWidth = 600;
    const lines = wrapText(ctx, text, maxWidth);
    const lineHeight = styles.fontSize * 1.2;
    const textHeight = lines.length * lineHeight;
    
    // Draw text
    ctx.shadowColor = 'black';
    lines.forEach((line, i) => {
        ctx.fillText(line, 100, 100 + i * lineHeight);
    });
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Create new canvas for cropped text
    const textCanvas = document.createElement('canvas');
    const textCtx = textCanvas.getContext('2d');
    
    if (!textCtx) {
        throw new Error('Could not create text canvas context');
    }
    
    // Set dimensions for cropped text
    textCanvas.width = maxWidth + 40; // Add padding
    textCanvas.height = textHeight + 40;
    textCtx.putImageData(imageData, 20, 20);
    
    // Return as PNG
    return new Promise((resolve) => {
        textCanvas.toBlob((blob) => {
            if (!blob) {
                throw new Error('Failed to create text blob');
            }
            
            const reader = new FileReader();
            reader.onload = () => {
                resolve(new Uint8Array(reader.result as ArrayBuffer));
            };
            reader.readAsArrayBuffer(blob);
        }, 'image/png');
    });
}

/**
 * Wraps text to fit within a specified width
 * @param ctx Canvas context
 * @param text Text to wrap
 * @param maxWidth Maximum width in pixels
 * @returns Array of wrapped lines
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];
    
    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + ' ' + word).width;
        
        if (width < maxWidth) {
            currentLine += ' ' + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    
    lines.push(currentLine);
    return lines;
}
