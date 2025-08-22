# Mathematical Outline Generator

A sophisticated web application that converts people in images into mathematical outline formulas. The application uses advanced computer vision techniques to detect edges and convert them into mathematical representations that can be used in other websites.

## Features

- **Image Upload**: Drag and drop or click to upload images
- **Edge Detection**: Advanced Canny edge detection algorithm
- **Mathematical Conversion**: Converts outlines to mathematical formulas using:
  - Linear segments (simple)
  - Quadratic Bezier curves (medium)
  - Cubic Bezier splines (complex)
- **Real-time Preview**: See the mathematical outlines as they're generated
- **CSS Generation**: Automatically generates copyable CSS code
- **Responsive Design**: Works on desktop and mobile devices

## How It Works

### 1. Image Processing
The application uses the Canny edge detection algorithm:
- **Gaussian Blur**: Reduces noise in the image
- **Sobel Operators**: Detects horizontal and vertical edges
- **Non-maximum Suppression**: Thins the edges
- **Double Thresholding**: Removes weak edges

### 2. Contour Extraction
- Traces connected edge pixels to form contours
- Filters out small, insignificant contours
- Simplifies contours to reduce complexity

### 3. Mathematical Conversion
Depending on the selected complexity:

**Simple (Linear)**:
- Breaks contours into straight line segments
- Uses linear interpolation between points
- Formula: `y = mx + b`

**Medium (Quadratic)**:
- Uses quadratic Bezier curves
- Provides smooth curves with control points
- Formula: `B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂`

**Complex (Splines)**:
- Uses cubic Bezier splines
- Maximum smoothness and accuracy
- Formula: `B(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃`

### 4. CSS Generation
The application generates CSS code that includes:
- SVG path definitions
- Styling properties
- Animation classes
- Responsive design considerations

## Usage

### 1. Upload an Image
- Drag and drop an image onto the upload area
- Or click the upload area to browse for files
- Supported formats: JPG, PNG, GIF, WebP

### 2. Adjust Settings
- **Edge Sensitivity**: Controls how sensitive the edge detection is (10-200)
- **Smoothing**: Reduces noise in the image (1-20)
- **Formula Complexity**: Choose the mathematical representation complexity

### 3. Generate Outlines
- Click "Generate Mathematical Outlines"
- The application will process the image and show:
  - Original image
  - Edge detection result
  - Mathematical outlines

### 4. Copy CSS
- Review the generated CSS code
- Click "Copy CSS" to copy to clipboard
- Use the CSS in your own website

## Technical Details

### Edge Detection Algorithm
```javascript
// Canny Edge Detection Steps:
1. Convert to grayscale
2. Apply Gaussian blur
3. Calculate gradients (Sobel operators)
4. Non-maximum suppression
5. Double thresholding
6. Edge tracking
```

### Mathematical Formulas
The application generates different types of mathematical representations:

**Linear Segments**:
```css
/* Example CSS for linear segments */
.outline-0 path {
  d: "M 100 100 L 150 120 L 200 110";
}
```

**Quadratic Curves**:
```css
/* Example CSS for quadratic curves */
.outline-0 path {
  d: "M 100 100 Q 125 90 150 120 Q 175 130 200 110";
}
```

**Cubic Splines**:
```css
/* Example CSS for cubic splines */
.outline-0 path {
  d: "M 100 100 C 125 90 175 130 200 110";
}
```

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Performance Considerations

- Large images are automatically scaled down for processing
- Edge detection is optimized for real-time performance
- Contour simplification reduces mathematical complexity
- CSS generation is optimized for web use

## Use Cases

1. **Web Design**: Create unique mathematical art for websites
2. **Logo Design**: Convert logos to mathematical representations
3. **Educational**: Teach mathematical concepts through visual examples
4. **Art Projects**: Generate mathematical art from photographs
5. **Animation**: Create animated mathematical outlines

## Future Enhancements

- Support for video processing
- More mathematical curve types (B-splines, NURBS)
- Export to different formats (SVG, PDF, etc.)
- Machine learning-based person detection
- Real-time webcam processing

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## Support

If you encounter any issues or have questions, please open an issue on the project repository.
