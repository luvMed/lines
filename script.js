class MathematicalOutlineGenerator {
    constructor() {
        this.originalImage = null;
        this.edgeData = null;
        this.outlines = [];
        this.canvas = null;
        this.ctx = null;
        
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.imageInput = document.getElementById('imageInput');
        this.processingSection = document.getElementById('processingSection');
        this.resultsSection = document.getElementById('resultsSection');
        this.originalCanvas = document.getElementById('originalCanvas');
        this.edgesCanvas = document.getElementById('edgesCanvas');
        this.outlinesCanvas = document.getElementById('outlinesCanvas');
        this.formulaOutput = document.getElementById('formulaOutput');
        this.previewElement = document.getElementById('previewElement');
        this.blackOutlineCanvas = document.getElementById('blackOutlineCanvas');
        this.copyBtn = document.getElementById('copyBtn');
        this.processBtn = document.getElementById('processBtn');
        
        // Controls
        this.edgeThreshold = document.getElementById('edgeThreshold');
        this.smoothingFactor = document.getElementById('smoothingFactor');
        this.formulaComplexity = document.getElementById('formulaComplexity');
        this.thresholdValue = document.getElementById('thresholdValue');
        this.smoothingValue = document.getElementById('smoothingValue');
    }

    bindEvents() {
        // Upload events
        this.uploadArea.addEventListener('click', () => this.imageInput.click());
        this.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        this.imageInput.addEventListener('change', this.handleFileSelect.bind(this));
        
        // Control events
        this.edgeThreshold.addEventListener('input', () => {
            this.thresholdValue.textContent = this.edgeThreshold.value;
        });
        this.smoothingFactor.addEventListener('input', () => {
            this.smoothingValue.textContent = this.smoothingFactor.value;
        });
        
        // Process button
        this.processBtn.addEventListener('click', this.processImage.bind(this));
        
        // Copy button
        this.copyBtn.addEventListener('click', this.copyToClipboard.bind(this));
        
        // Tab switching
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', this.switchTab.bind(this));
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.loadImage(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.loadImage(file);
        }
    }

    loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                this.displayOriginalImage();
                this.processingSection.style.display = 'block';
                this.resultsSection.style.display = 'none';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    displayOriginalImage() {
        const canvas = this.originalCanvas;
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        const maxSize = 300;
        const scale = Math.min(maxSize / this.originalImage.width, maxSize / this.originalImage.height);
        canvas.width = this.originalImage.width * scale;
        canvas.height = this.originalImage.height * scale;
        
        // Draw image
        ctx.drawImage(this.originalImage, 0, 0, canvas.width, canvas.height);
    }

    async processImage() {
        this.processBtn.disabled = true;
        this.processBtn.innerHTML = '<span class="loading"></span> Processing...';
        
        try {
            // Step 1: Edge detection
            await this.detectEdges();
            
            // Step 2: Generate mathematical outlines
            this.generateMathematicalOutlines();
            
            // Step 3: Display results
            this.displayResults();
            
            // Step 4: Generate CSS
            this.generateCSS();
            
            this.resultsSection.style.display = 'block';
        } catch (error) {
            console.error('Error processing image:', error);
            alert('Error processing image. Please try again.');
        } finally {
            this.processBtn.disabled = false;
            this.processBtn.textContent = 'Generate Mathematical Outlines';
        }
    }

    async detectEdges() {
        try {
            const canvas = this.edgesCanvas;
            const ctx = canvas.getContext('2d');
            
            // Set canvas size same as original
            canvas.width = this.originalCanvas.width;
            canvas.height = this.originalCanvas.height;
            
            // Draw original image
            ctx.drawImage(this.originalImage, 0, 0, canvas.width, canvas.height);
            
            // Get image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Convert to grayscale and apply edge detection
            const grayscale = this.convertToGrayscale(data, canvas.width, canvas.height);
            const edges = this.applyCannyEdgeDetection(grayscale, canvas.width, canvas.height);
            
            // Display edges
            const edgeImageData = new ImageData(canvas.width, canvas.height);
            const edgeData = edgeImageData.data;
            
            for (let i = 0; i < edges.length; i++) {
                const value = edges[i];
                const pixelIndex = i * 4;
                edgeData[pixelIndex] = value;     // Red
                edgeData[pixelIndex + 1] = value; // Green
                edgeData[pixelIndex + 2] = value; // Blue
                edgeData[pixelIndex + 3] = 255;   // Alpha
            }
            
            ctx.putImageData(edgeImageData, 0, 0);
            
            this.edgeData = edges;
        } catch (error) {
            console.error('Error in detectEdges:', error);
            throw error;
        }
    }

    convertToGrayscale(data, width, height) {
        const grayscale = new Uint8ClampedArray(width * height);
        
        for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            grayscale[i / 4] = gray;
        }
        
        return grayscale;
    }

    applyCannyEdgeDetection(grayscale, width, height) {
        const threshold = parseInt(this.edgeThreshold.value);
        const smoothing = parseInt(this.smoothingFactor.value);
        
        // Apply Gaussian blur
        const blurred = this.applyGaussianBlur(grayscale, width, height, smoothing);
        
        // Apply Sobel operators
        const sobelX = this.applySobelX(blurred, width, height);
        const sobelY = this.applySobelY(blurred, width, height);
        
        // Calculate gradient magnitude and direction
        const magnitude = new Uint8ClampedArray(width * height);
        const direction = new Float32Array(width * height);
        
        for (let i = 0; i < width * height; i++) {
            const x = sobelX[i];
            const y = sobelY[i];
            magnitude[i] = Math.sqrt(x * x + y * y);
            direction[i] = Math.atan2(y, x);
        }
        
        // Non-maximum suppression
        const suppressed = this.nonMaximumSuppression(magnitude, direction, width, height);
        
        // Double thresholding
        const result = this.doubleThreshold(suppressed, width, height, threshold);
        
        return result;
    }

    applyGaussianBlur(data, width, height, sigma) {
        const kernel = this.createGaussianKernel(sigma);
        const kernelSize = kernel.length;
        const halfKernel = Math.floor(kernelSize / 2);
        
        const result = new Uint8ClampedArray(width * height);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let sum = 0;
                let weightSum = 0;
                
                for (let ky = 0; ky < kernelSize; ky++) {
                    for (let kx = 0; kx < kernelSize; kx++) {
                        const px = x + kx - halfKernel;
                        const py = y + ky - halfKernel;
                        
                        if (px >= 0 && px < width && py >= 0 && py < height) {
                            const weight = kernel[ky][kx];
                            sum += data[py * width + px] * weight;
                            weightSum += weight;
                        }
                    }
                }
                
                result[y * width + x] = sum / weightSum;
            }
        }
        
        return result;
    }

    createGaussianKernel(sigma) {
        const size = Math.ceil(sigma * 6);
        const kernel = [];
        const halfSize = Math.floor(size / 2);
        
        for (let y = 0; y < size; y++) {
            kernel[y] = [];
            for (let x = 0; x < size; x++) {
                const dx = x - halfSize;
                const dy = y - halfSize;
                const value = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
                kernel[y][x] = value;
            }
        }
        
        return kernel;
    }

    applySobelX(data, width, height) {
        const result = new Float32Array(width * height);
        const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let sum = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = (ky + 1) * 3 + (kx + 1);
                        sum += data[(y + ky) * width + (x + kx)] * sobelX[idx];
                    }
                }
                result[y * width + x] = sum;
            }
        }
        
        return result;
    }

    applySobelY(data, width, height) {
        const result = new Float32Array(width * height);
        const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let sum = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = (ky + 1) * 3 + (kx + 1);
                        sum += data[(y + ky) * width + (x + kx)] * sobelY[idx];
                    }
                }
                result[y * width + x] = sum;
            }
        }
        
        return result;
    }

    nonMaximumSuppression(magnitude, direction, width, height) {
        const result = new Uint8ClampedArray(width * height);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;
                const angle = direction[idx];
                const mag = magnitude[idx];
                
                // Quantize angle to 0, 45, 90, 135 degrees
                let angleDeg = (angle * 180 / Math.PI + 360) % 360;
                if (angleDeg < 0) angleDeg += 360;
                
                let r1, r2;
                
                if ((angleDeg >= 0 && angleDeg < 22.5) || (angleDeg >= 157.5 && angleDeg < 202.5) || (angleDeg >= 337.5 && angleDeg <= 360)) {
                    r1 = magnitude[idx + 1];
                    r2 = magnitude[idx - 1];
                } else if ((angleDeg >= 22.5 && angleDeg < 67.5) || (angleDeg >= 202.5 && angleDeg < 247.5)) {
                    r1 = magnitude[(y - 1) * width + (x + 1)];
                    r2 = magnitude[(y + 1) * width + (x - 1)];
                } else if ((angleDeg >= 67.5 && angleDeg < 112.5) || (angleDeg >= 247.5 && angleDeg < 292.5)) {
                    r1 = magnitude[(y - 1) * width + x];
                    r2 = magnitude[(y + 1) * width + x];
                } else {
                    r1 = magnitude[(y - 1) * width + (x - 1)];
                    r2 = magnitude[(y + 1) * width + (x + 1)];
                }
                
                result[idx] = (mag >= r1 && mag >= r2) ? mag : 0;
            }
        }
        
        return result;
    }

    doubleThreshold(data, width, height, threshold) {
        const highThreshold = threshold;
        const lowThreshold = threshold * 0.5;
        const result = new Uint8ClampedArray(width * height);
        
        for (let i = 0; i < width * height; i++) {
            if (data[i] >= highThreshold) {
                result[i] = 255;
            } else if (data[i] >= lowThreshold) {
                result[i] = 128;
            } else {
                result[i] = 0;
            }
        }
        
        return result;
    }

    generateMathematicalOutlines() {
        const canvas = this.outlinesCanvas;
        const ctx = canvas.getContext('2d');
        
        canvas.width = this.edgesCanvas.width;
        canvas.height = this.edgesCanvas.height;
        
        // Clear canvas
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Extract contours from edge data
        const contours = this.extractContours(this.edgeData, canvas.width, canvas.height);
        
        // Convert contours to mathematical formulas
        this.outlines = this.contoursToFormulas(contours);
        
        // Draw mathematical outlines
        this.drawMathematicalOutlines(ctx);
    }

    extractContours(edgeData, width, height) {
        const visited = new Set();
        const contours = [];
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                if (edgeData[idx] === 255 && !visited.has(idx)) {
                    const contour = this.traceContour(edgeData, width, height, x, y, visited);
                    if (contour.length > 10) { // Only keep significant contours
                        contours.push(contour);
                    }
                }
            }
        }
        
        return contours;
    }

    traceContour(edgeData, width, height, startX, startY, visited) {
        const contour = [];
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        let x = startX;
        let y = startY;
        
        do {
            contour.push({x, y});
            visited.add(y * width + x);
            
            let found = false;
            for (const [dx, dy] of directions) {
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const idx = ny * width + nx;
                    if (edgeData[idx] === 255 && !visited.has(idx)) {
                        x = nx;
                        y = ny;
                        found = true;
                        break;
                    }
                }
            }
            
            if (!found) break;
        } while (x !== startX || y !== startY);
        
        return contour;
    }

    contoursToFormulas(contours) {
        const complexity = this.formulaComplexity.value;
        const outlines = [];
        
        for (const contour of contours) {
            if (contour.length < 3) continue;
            
            let formula;
            switch (complexity) {
                case 'simple':
                    formula = this.generateLinearFormula(contour);
                    break;
                case 'medium':
                    formula = this.generateQuadraticFormula(contour);
                    break;
                case 'complex':
                    formula = this.generateSplineFormula(contour);
                    break;
                default:
                    formula = this.generateLinearFormula(contour);
            }
            
            outlines.push(formula);
        }
        
        return outlines;
    }

    generateLinearFormula(contour) {
        const points = this.simplifyContour(contour, 10);
        const segments = [];
        
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            if (length > 5) { // Only significant segments
                segments.push({
                    type: 'line',
                    x1: p1.x,
                    y1: p1.y,
                    x2: p2.x,
                    y2: p2.y,
                    length: length
                });
            }
        }
        
        return {
            type: 'linear',
            segments: segments,
            points: points
        };
    }

    generateQuadraticFormula(contour) {
        const points = this.simplifyContour(contour, 15);
        const curves = [];
        
        for (let i = 0; i < points.length - 2; i += 2) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[i + 2];
            
            // Generate quadratic Bezier curve
            curves.push({
                type: 'quadratic',
                x1: p1.x, y1: p1.y,
                x2: p2.x, y2: p2.y,
                x3: p3.x, y3: p3.y
            });
        }
        
        return {
            type: 'quadratic',
            curves: curves,
            points: points
        };
    }

    generateSplineFormula(contour) {
        const points = this.simplifyContour(contour, 20);
        const splines = [];
        
        for (let i = 0; i < points.length - 3; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[i + 2];
            const p4 = points[i + 3];
            
            // Generate cubic Bezier spline
            splines.push({
                type: 'cubic',
                x1: p1.x, y1: p1.y,
                x2: p2.x, y2: p2.y,
                x3: p3.x, y3: p3.y,
                x4: p4.x, y4: p4.y
            });
        }
        
        return {
            type: 'spline',
            splines: splines,
            points: points
        };
    }

    simplifyContour(contour, tolerance) {
        if (contour.length <= 2) return contour;
        
        const simplified = [contour[0]];
        let lastPoint = contour[0];
        
        for (let i = 1; i < contour.length - 1; i++) {
            const point = contour[i];
            const distance = Math.sqrt(
                Math.pow(point.x - lastPoint.x, 2) + 
                Math.pow(point.y - lastPoint.y, 2)
            );
            
            if (distance >= tolerance) {
                simplified.push(point);
                lastPoint = point;
            }
        }
        
        simplified.push(contour[contour.length - 1]);
        return simplified;
    }

    drawMathematicalOutlines(ctx) {
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        for (const outline of this.outlines) {
            switch (outline.type) {
                case 'linear':
                    this.drawLinearOutline(ctx, outline);
                    break;
                case 'quadratic':
                    this.drawQuadraticOutline(ctx, outline);
                    break;
                case 'spline':
                    this.drawSplineOutline(ctx, outline);
                    break;
            }
        }
    }

    drawLinearOutline(ctx, outline) {
        for (const segment of outline.segments) {
            ctx.beginPath();
            ctx.moveTo(segment.x1, segment.y1);
            ctx.lineTo(segment.x2, segment.y2);
            ctx.stroke();
        }
    }

    drawQuadraticOutline(ctx, outline) {
        for (const curve of outline.curves) {
            ctx.beginPath();
            ctx.moveTo(curve.x1, curve.y1);
            ctx.quadraticCurveTo(curve.x2, curve.y2, curve.x3, curve.y3);
            ctx.stroke();
        }
    }

    drawSplineOutline(ctx, outline) {
        for (const spline of outline.splines) {
            ctx.beginPath();
            ctx.moveTo(spline.x1, spline.y1);
            ctx.bezierCurveTo(spline.x2, spline.y2, spline.x3, spline.y3, spline.x4, spline.y4);
            ctx.stroke();
        }
    }

    displayResults() {
        // Results are already displayed in the canvas elements
        this.createBlackOutlinePreview();
    }
    
    switchTab(e) {
        const targetTab = e.target.dataset.tab;
        
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
        
        // Update active tab content
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        
        if (targetTab === 'animated') {
            document.getElementById('previewElement').classList.add('active');
        } else if (targetTab === 'black-outline') {
            document.getElementById('blackOutlinePreview').classList.add('active');
        }
    }
    
    createBlackOutlinePreview() {
        const canvas = this.blackOutlineCanvas;
        const ctx = canvas.getContext('2d');
        
        // Set canvas size same as original
        canvas.width = this.originalCanvas.width;
        canvas.height = this.originalCanvas.height;
        
        // Draw original image
        ctx.drawImage(this.originalImage, 0, 0, canvas.width, canvas.height);
        
        // Draw black outlines on top
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        for (const outline of this.outlines) {
            switch (outline.type) {
                case 'linear':
                    this.drawLinearOutline(ctx, outline);
                    break;
                case 'quadratic':
                    this.drawQuadraticOutline(ctx, outline);
                    break;
                case 'spline':
                    this.drawSplineOutline(ctx, outline);
                    break;
            }
        }
    }

    generateCSS() {
        let css = '/* Mathematical Outline CSS */\n';
        css += '.math-outline {\n';
        css += '  position: relative;\n';
        css += '  width: 100%;\n';
        css += '  height: 100%;\n';
        css += '}\n\n';
        
        for (let i = 0; i < this.outlines.length; i++) {
            const outline = this.outlines[i];
            css += `.outline-${i} {\n`;
            css += '  position: absolute;\n';
            css += '  pointer-events: none;\n';
            css += '}\n\n';
            
            css += `.outline-${i} path {\n`;
            css += '  fill: none;\n';
            css += '  stroke: #667eea;\n';
            css += '  stroke-width: 2;\n';
            css += '  stroke-linecap: round;\n';
            css += '  stroke-linejoin: round;\n';
            css += '}\n\n';
            
            css += `.outline-${i} svg {\n`;
            css += '  width: 100%;\n';
            css += '  height: 100%;\n';
            css += '}\n\n';
        }
        
        this.formulaOutput.textContent = css;
        this.createPreview();
    }

    createPreview() {
        this.previewElement.innerHTML = '';
        
        for (let i = 0; i < this.outlines.length; i++) {
            const outline = this.outlines[i];
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
            svg.classList.add(`outline-${i}`);
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            
            let pathData = '';
            switch (outline.type) {
                case 'linear':
                    pathData = this.generateLinearPathData(outline);
                    break;
                case 'quadratic':
                    pathData = this.generateQuadraticPathData(outline);
                    break;
                case 'spline':
                    pathData = this.generateSplinePathData(outline);
                    break;
            }
            
            path.setAttribute('d', pathData);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', '#667eea');
            path.setAttribute('stroke-width', '2');
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-linejoin', 'round');
            path.classList.add('animated');
            
            svg.appendChild(path);
            this.previewElement.appendChild(svg);
        }
    }

    generateLinearPathData(outline) {
        let pathData = '';
        for (const segment of outline.segments) {
            if (pathData === '') {
                pathData += `M ${segment.x1} ${segment.y1}`;
            }
            pathData += ` L ${segment.x2} ${segment.y2}`;
        }
        return pathData;
    }

    generateQuadraticPathData(outline) {
        let pathData = '';
        for (const curve of outline.curves) {
            if (pathData === '') {
                pathData += `M ${curve.x1} ${curve.y1}`;
            }
            pathData += ` Q ${curve.x2} ${curve.y2} ${curve.x3} ${curve.y3}`;
        }
        return pathData;
    }

    generateSplinePathData(outline) {
        let pathData = '';
        for (const spline of outline.splines) {
            if (pathData === '') {
                pathData += `M ${spline.x1} ${spline.y1}`;
            }
            pathData += ` C ${spline.x2} ${spline.y2} ${spline.x3} ${spline.y3} ${spline.x4} ${spline.y4}`;
        }
        return pathData;
    }

    async copyToClipboard() {
        try {
            await navigator.clipboard.writeText(this.formulaOutput.textContent);
            this.copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                this.copyBtn.textContent = 'Copy CSS';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = this.formulaOutput.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            this.copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                this.copyBtn.textContent = 'Copy CSS';
            }, 2000);
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new MathematicalOutlineGenerator();
});
