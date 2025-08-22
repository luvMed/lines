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
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
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
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            
            // Set canvas size same as original
            canvas.width = this.originalCanvas.width;
            canvas.height = this.originalCanvas.height;
            
            // Draw original image
            ctx.drawImage(this.originalImage, 0, 0, canvas.width, canvas.height);
            
            // Get image data once and cache it
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Convert to grayscale and apply edge detection
            const grayscale = this.convertToGrayscale(data, canvas.width, canvas.height);
            const edges = this.applyCannyEdgeDetection(grayscale, canvas.width, canvas.height);
            
            // Detect skin tones using the same cached image data
            const skinMask = this.detectSkinTones(data, canvas.width, canvas.height);
            
            // Combine edge detection with skin tone information
            const enhancedEdges = this.enhanceEdgesWithSkinTones(edges, skinMask, canvas.width, canvas.height);
            
            // Display edges efficiently
            this.displayEdges(ctx, enhancedEdges, canvas.width, canvas.height);
            
            this.edgeData = enhancedEdges;
        } catch (error) {
            console.error('Error in detectEdges:', error);
            throw error;
        }
    }

    displayEdges(ctx, edges, width, height) {
        // Create ImageData once and reuse
        const edgeImageData = new ImageData(width, height);
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
    }

    enhanceEdgesWithSkinTones(edges, skinMask, width, height) {
        const enhanced = new Uint8ClampedArray(width * height);
        
        for (let i = 0; i < width * height; i++) {
            if (edges[i] > 0) {
                // If edge pixel is near skin tone, enhance it
                const x = i % width;
                const y = Math.floor(i / width);
                
                let skinNeighbors = 0;
                let totalNeighbors = 0;
                
                // Check 5x5 neighborhood for skin tones
                for (let dy = -2; dy <= 2; dy++) {
                    for (let dx = -2; dx <= 2; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const nIdx = ny * width + nx;
                            if (skinMask[nIdx] > 0) {
                                skinNeighbors++;
                            }
                            totalNeighbors++;
                        }
                    }
                }
                
                const skinRatio = skinNeighbors / totalNeighbors;
                
                // Enhance edges near skin tones
                if (skinRatio > 0.1) {
                    enhanced[i] = Math.min(255, edges[i] * (1 + skinRatio));
                } else {
                    enhanced[i] = edges[i];
                }
            } else {
                enhanced[i] = 0;
            }
        }
        
        return enhanced;
    }

    enhancePersonEdges(edges, width, height) {
        const enhanced = new Uint8ClampedArray(width * height);
        
        // Create a person probability map
        const personMap = this.createPersonProbabilityMap(edges, width, height);
        
        // Apply HOG-like feature detection
        const hogFeatures = this.extractHOGFeatures(edges, width, height);
        
        // Apply body part detection
        const bodyParts = this.detectBodyParts(edges, width, height);
        
        for (let i = 0; i < width * height; i++) {
            if (edges[i] > 0) {
                const x = i % width;
                const y = Math.floor(i / width);
                
                // Get person probability for this region
                const personProb = this.getPersonProbability(personMap, x, y, width, height);
                
                // Get HOG feature strength
                const hogStrength = this.getHOGStrength(hogFeatures, x, y, width, height);
                
                // Get body part probability
                const bodyPartProb = this.getBodyPartProbability(bodyParts, x, y, width, height);
                
                // Combine all probabilities
                const combinedProb = (personProb * 0.4 + hogStrength * 0.3 + bodyPartProb * 0.3);
                
                // Enhance edges in person-like regions
                if (combinedProb > 0.2) {
                    enhanced[i] = Math.min(255, edges[i] * (1 + combinedProb));
                } else {
                    enhanced[i] = edges[i];
                }
            } else {
                enhanced[i] = 0;
            }
        }
        
        return enhanced;
    }

    extractHOGFeatures(edges, width, height) {
        const hogFeatures = new Float32Array(width * height);
        const cellSize = 8;
        const blockSize = 16;
        
        for (let y = 0; y < height; y += cellSize) {
            for (let x = 0; x < width; x += cellSize) {
                const gradients = this.calculateCellGradients(edges, x, y, cellSize, width, height);
                const histogram = this.createGradientHistogram(gradients);
                
                // Apply histogram to the cell
                for (let cy = 0; cy < cellSize && y + cy < height; cy++) {
                    for (let cx = 0; cx < cellSize && x + cx < width; cx++) {
                        const idx = (y + cy) * width + (x + cx);
                        hogFeatures[idx] = this.getHistogramValue(histogram, cx, cy, cellSize);
                    }
                }
            }
        }
        
        return hogFeatures;
    }

    calculateCellGradients(edges, startX, startY, cellSize, width, height) {
        const gradients = [];
        
        for (let y = startY; y < startY + cellSize && y < height; y++) {
            for (let x = startX; x < startX + cellSize && x < width; x++) {
                if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
                    const idx = y * width + x;
                    const gx = edges[idx + 1] - edges[idx - 1];
                    const gy = edges[(y + 1) * width + x] - edges[(y - 1) * width + x];
                    
                    gradients.push({
                        magnitude: Math.sqrt(gx * gx + gy * gy),
                        angle: Math.atan2(gy, gx)
                    });
                }
            }
        }
        
        return gradients;
    }

    createGradientHistogram(gradients) {
        const bins = 9; // 9 orientation bins
        const histogram = new Array(bins).fill(0);
        
        for (const gradient of gradients) {
            const angle = gradient.angle;
            const magnitude = gradient.magnitude;
            
            // Convert angle to bin index
            let binIndex = Math.floor(((angle + Math.PI) / (2 * Math.PI)) * bins);
            binIndex = Math.max(0, Math.min(bins - 1, binIndex));
            
            histogram[binIndex] += magnitude;
        }
        
        return histogram;
    }

    getHistogramValue(histogram, x, y, cellSize) {
        // Simple interpolation based on position within cell
        const total = histogram.reduce((sum, val) => sum + val, 0);
        return total / (cellSize * cellSize);
    }

    getHOGStrength(hogFeatures, x, y, width, height) {
        let totalStrength = 0;
        let count = 0;
        
        // Average HOG features in 5x5 neighborhood
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const idx = ny * width + nx;
                    totalStrength += hogFeatures[idx];
                    count++;
                }
            }
        }
        
        return count > 0 ? totalStrength / count : 0;
    }

    detectBodyParts(edges, width, height) {
        const bodyParts = {
            head: this.detectHeadRegion(edges, width, height),
            torso: this.detectTorsoRegion(edges, width, height),
            arms: this.detectArmRegions(edges, width, height),
            legs: this.detectLegRegions(edges, width, height)
        };
        
        return bodyParts;
    }

    detectHeadRegion(edges, width, height) {
        const headMap = new Float32Array(width * height);
        const headHeight = Math.floor(height * 0.15); // Head is typically 15% of body height
        
        for (let y = 0; y < headHeight; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                if (edges[idx] > 0) {
                    // Check for circular/oval patterns typical of heads
                    const circularity = this.checkCircularity(edges, x, y, width, height, 10);
                    headMap[idx] = circularity;
                }
            }
        }
        
        return headMap;
    }

    detectTorsoRegion(edges, width, height) {
        const torsoMap = new Float32Array(width * height);
        const torsoStart = Math.floor(height * 0.15);
        const torsoEnd = Math.floor(height * 0.6);
        
        for (let y = torsoStart; y < torsoEnd; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                if (edges[idx] > 0) {
                    // Check for vertical line patterns typical of torso
                    const verticality = this.checkVerticalPattern(edges, x, y, width, height);
                    torsoMap[idx] = verticality;
                }
            }
        }
        
        return torsoMap;
    }

    detectArmRegions(edges, width, height) {
        const armMap = new Float32Array(width * height);
        const armStart = Math.floor(height * 0.2);
        const armEnd = Math.floor(height * 0.7);
        
        for (let y = armStart; y < armEnd; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                if (edges[idx] > 0) {
                    // Check for horizontal extensions typical of arms
                    const armExtension = this.checkArmExtension(edges, x, y, width, height);
                    armMap[idx] = armExtension;
                }
            }
        }
        
        return armMap;
    }

    detectLegRegions(edges, width, height) {
        const legMap = new Float32Array(width * height);
        const legStart = Math.floor(height * 0.6);
        
        for (let y = legStart; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                if (edges[idx] > 0) {
                    // Check for vertical line patterns typical of legs
                    const verticality = this.checkVerticalPattern(edges, x, y, width, height);
                    legMap[idx] = verticality;
                }
            }
        }
        
        return legMap;
    }

    checkCircularity(edges, x, y, width, height, radius) {
        let edgeCount = 0;
        let totalPoints = 0;
        
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= radius) {
                    const nx = x + dx;
                    const ny = y + dy;
                    
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        const idx = ny * width + nx;
                        if (edges[idx] > 0) {
                            edgeCount++;
                        }
                        totalPoints++;
                    }
                }
            }
        }
        
        return totalPoints > 0 ? edgeCount / totalPoints : 0;
    }

    checkArmExtension(edges, x, y, width, height) {
        let horizontalEdges = 0;
        let totalEdges = 0;
        
        // Check for horizontal extensions
        for (let dx = -10; dx <= 10; dx++) {
            const nx = x + dx;
            if (nx >= 0 && nx < width) {
                const idx = y * width + nx;
                if (edges[idx] > 0) {
                    horizontalEdges++;
                }
                totalEdges++;
            }
        }
        
        return totalEdges > 0 ? horizontalEdges / totalEdges : 0;
    }

    getBodyPartProbability(bodyParts, x, y, width, height) {
        const idx = y * width + x;
        const headProb = bodyParts.head[idx] || 0;
        const torsoProb = bodyParts.torso[idx] || 0;
        const armProb = bodyParts.arms[idx] || 0;
        const legProb = bodyParts.legs[idx] || 0;
        
        // Weight different body parts
        return headProb * 0.3 + torsoProb * 0.4 + armProb * 0.2 + legProb * 0.1;
    }

    createPersonProbabilityMap(edges, width, height) {
        const personMap = new Float32Array(width * height);
        
        // Analyze edge patterns that are typical of human shapes
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                
                if (edges[idx] > 0) {
                    // Check for vertical edge patterns (typical of human body)
                    const verticalScore = this.checkVerticalPattern(edges, x, y, width, height);
                    
                    // Check for horizontal edge patterns (typical of human features)
                    const horizontalScore = this.checkHorizontalPattern(edges, x, y, width, height);
                    
                    // Check for curved edge patterns (typical of human contours)
                    const curvedScore = this.checkCurvedPattern(edges, x, y, width, height);
                    
                    // Combine scores
                    personMap[idx] = (verticalScore + horizontalScore + curvedScore) / 3;
                }
            }
        }
        
        return personMap;
    }

    checkVerticalPattern(edges, x, y, width, height) {
        let verticalEdges = 0;
        let totalEdges = 0;
        
        // Check vertical line pattern
        for (let dy = -5; dy <= 5; dy++) {
            const ny = y + dy;
            if (ny >= 0 && ny < height) {
                const idx = ny * width + x;
                if (edges[idx] > 0) {
                    verticalEdges++;
                }
                totalEdges++;
            }
        }
        
        return totalEdges > 0 ? verticalEdges / totalEdges : 0;
    }

    checkHorizontalPattern(edges, x, y, width, height) {
        let horizontalEdges = 0;
        let totalEdges = 0;
        
        // Check horizontal line pattern
        for (let dx = -5; dx <= 5; dx++) {
            const nx = x + dx;
            if (nx >= 0 && nx < width) {
                const idx = y * width + nx;
                if (edges[idx] > 0) {
                    horizontalEdges++;
                }
                totalEdges++;
            }
        }
        
        return totalEdges > 0 ? horizontalEdges / totalEdges : 0;
    }

    checkCurvedPattern(edges, x, y, width, height) {
        let curvedEdges = 0;
        let totalEdges = 0;
        
        // Check for curved patterns (arc-like structures)
        for (let dy = -3; dy <= 3; dy++) {
            for (let dx = -3; dx <= 3; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const idx = ny * width + nx;
                    if (edges[idx] > 0) {
                        // Check if this forms part of a curve
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance > 0 && distance <= 3) {
                            curvedEdges++;
                        }
                        totalEdges++;
                    }
                }
            }
        }
        
        return totalEdges > 0 ? curvedEdges / totalEdges : 0;
    }

    getPersonProbability(personMap, x, y, width, height) {
        let totalProb = 0;
        let count = 0;
        
        // Average probability in 7x7 neighborhood
        for (let dy = -3; dy <= 3; dy++) {
            for (let dx = -3; dx <= 3; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const idx = ny * width + nx;
                    totalProb += personMap[idx];
                    count++;
                }
            }
        }
        
        return count > 0 ? totalProb / count : 0;
    }

    convertToGrayscale(data, width, height) {
        const grayscale = new Uint8ClampedArray(width * height);
        
        for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            grayscale[i / 4] = gray;
        }
        
        return grayscale;
    }

    detectSkinTones(data, width, height) {
        const skinMask = new Uint8ClampedArray(width * height);
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Skin tone detection using multiple color space rules
            const isSkin = this.isSkinTone(r, g, b);
            skinMask[i / 4] = isSkin ? 255 : 0;
        }
        
        return skinMask;
    }

    isSkinTone(r, g, b) {
        // RGB skin tone detection rules
        const rule1 = r > 95 && g > 40 && b > 20 && 
                     Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
                     Math.abs(r - g) > 15 && r > g && r > b;
        
        // YCrCb skin tone detection
        const y = 0.299 * r + 0.587 * g + 0.114 * b;
        const cr = 0.713 * (r - y) + 128;
        const cb = 0.564 * (b - y) + 128;
        
        const rule2 = cr >= 133 && cr <= 173 && cb >= 77 && cb <= 127;
        
        // HSV skin tone detection
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        
        let h = 0;
        if (delta !== 0) {
            if (max === r) h = ((g - b) / delta) % 6;
            else if (max === g) h = (b - r) / delta + 2;
            else h = (r - g) / delta + 4;
            h *= 60;
            if (h < 0) h += 360;
        }
        
        const s = max === 0 ? 0 : delta / max;
        const v = max;
        
        const rule3 = h >= 0 && h <= 50 && s >= 0.1 && s <= 0.8 && v >= 0.2;
        
        return rule1 || rule2 || rule3;
    }

    applyCannyEdgeDetection(grayscale, width, height) {
        const threshold = parseInt(this.edgeThreshold.value);
        const smoothing = parseInt(this.smoothingFactor.value);
        
        // Apply Gaussian blur
        const blurred = this.applyGaussianBlur(grayscale, width, height, smoothing);
        
        // Apply multiple edge detection operators for better accuracy
        const sobelX = this.applySobelX(blurred, width, height);
        const sobelY = this.applySobelY(blurred, width, height);
        const prewittX = this.applyPrewittX(blurred, width, height);
        const prewittY = this.applyPrewittY(blurred, width, height);
        const cannyX = this.applyCannyX(blurred, width, height);
        const cannyY = this.applyCannyY(blurred, width, height);
        const laplacian = this.applyLaplacian(blurred, width, height);
        
        // Calculate gradient magnitude and direction using combined operators
        const magnitude = new Uint8ClampedArray(width * height);
        const direction = new Float32Array(width * height);
        
        for (let i = 0; i < width * height; i++) {
            // Combine multiple operators for better edge detection
            const sobelMag = Math.sqrt(sobelX[i] * sobelX[i] + sobelY[i] * sobelY[i]);
            const prewittMag = Math.sqrt(prewittX[i] * prewittX[i] + prewittY[i] * prewittY[i]);
            const cannyMag = Math.sqrt(cannyX[i] * cannyX[i] + cannyY[i] * cannyY[i]);
            const laplacianMag = Math.abs(laplacian[i]);
            
            // Weighted combination with emphasis on person-specific features
            magnitude[i] = 0.3 * sobelMag + 0.2 * prewittMag + 0.3 * cannyMag + 0.2 * laplacianMag;
            direction[i] = Math.atan2(sobelY[i], sobelX[i]);
        }
        
        // Apply morphological operations to clean up edges
        const cleaned = this.morphologicalCleanup(magnitude, width, height);
        
        // Non-maximum suppression with improved algorithm
        const suppressed = this.improvedNonMaximumSuppression(cleaned, direction, width, height);
        
        // Adaptive double thresholding
        const result = this.adaptiveDoubleThreshold(suppressed, width, height, threshold);
        
        // Final cleanup with connected component analysis
        const cleanedResult = this.connectedComponentCleanup(result, width, height);
        
        // Apply person-specific edge enhancement
        return this.enhancePersonEdges(cleanedResult, width, height);
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

    applyPrewittX(data, width, height) {
        const result = new Float32Array(width * height);
        const prewittX = [-1, 0, 1, -1, 0, 1, -1, 0, 1];
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let sum = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = (ky + 1) * 3 + (kx + 1);
                        sum += data[(y + ky) * width + (x + kx)] * prewittX[idx];
                    }
                }
                result[y * width + x] = sum;
            }
        }
        
        return result;
    }

    applyPrewittY(data, width, height) {
        const result = new Float32Array(width * height);
        const prewittY = [-1, -1, -1, 0, 0, 0, 1, 1, 1];
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let sum = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = (ky + 1) * 3 + (kx + 1);
                        sum += data[(y + ky) * width + (x + kx)] * prewittY[idx];
                    }
                }
                result[y * width + x] = sum;
            }
        }
        
        return result;
    }

    applyCannyX(data, width, height) {
        const result = new Float32Array(width * height);
        const cannyX = [-1, -1, -1, 0, 0, 0, 1, 1, 1];
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let sum = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = (ky + 1) * 3 + (kx + 1);
                        sum += data[(y + ky) * width + (x + kx)] * cannyX[idx];
                    }
                }
                result[y * width + x] = sum;
            }
        }
        
        return result;
    }

    applyCannyY(data, width, height) {
        const result = new Float32Array(width * height);
        const cannyY = [-1, 0, 1, -1, 0, 1, -1, 0, 1];
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let sum = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = (ky + 1) * 3 + (kx + 1);
                        sum += data[(y + ky) * width + (x + kx)] * cannyY[idx];
                    }
                }
                result[y * width + x] = sum;
            }
        }
        
        return result;
    }

    applyLaplacian(data, width, height) {
        const laplacian = [
            [-1, -1, -1],
            [-1,  8, -1],
            [-1, -1, -1]
        ];
        
        const result = new Uint8ClampedArray(width * height);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let sum = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const value = data[(y + ky) * width + (x + kx)];
                        sum += laplacian[ky + 1][kx + 1] * value;
                    }
                }
                result[y * width + x] = Math.min(255, Math.max(0, sum));
            }
        }
        
        return result;
    }

    morphologicalCleanup(data, width, height) {
        // Erosion followed by dilation to remove noise
        const eroded = this.erode(data, width, height);
        return this.dilate(eroded, width, height);
    }

    erode(data, width, height) {
        const result = new Uint8ClampedArray(width * height);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let min = 255;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const value = data[(y + ky) * width + (x + kx)];
                        if (value < min) min = value;
                    }
                }
                result[y * width + x] = min;
            }
        }
        
        return result;
    }

    dilate(data, width, height) {
        const result = new Uint8ClampedArray(width * height);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let max = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const value = data[(y + ky) * width + (x + kx)];
                        if (value > max) max = value;
                    }
                }
                result[y * width + x] = max;
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

    improvedNonMaximumSuppression(magnitude, direction, width, height) {
        const result = new Uint8ClampedArray(width * height);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;
                const angle = direction[idx];
                const mag = magnitude[idx];
                
                // More precise angle quantization
                let angleDeg = (angle * 180 / Math.PI + 360) % 360;
                if (angleDeg < 0) angleDeg += 360;
                
                let r1, r2;
                let weight1, weight2;
                
                // Interpolate between neighboring pixels for more accurate suppression
                if ((angleDeg >= 0 && angleDeg < 22.5) || (angleDeg >= 157.5 && angleDeg < 202.5) || (angleDeg >= 337.5 && angleDeg <= 360)) {
                    r1 = magnitude[idx + 1];
                    r2 = magnitude[idx - 1];
                    weight1 = 1.0;
                    weight2 = 1.0;
                } else if ((angleDeg >= 22.5 && angleDeg < 67.5) || (angleDeg >= 202.5 && angleDeg < 247.5)) {
                    r1 = magnitude[(y - 1) * width + (x + 1)];
                    r2 = magnitude[(y + 1) * width + (x - 1)];
                    weight1 = 0.707;
                    weight2 = 0.707;
                } else if ((angleDeg >= 67.5 && angleDeg < 112.5) || (angleDeg >= 247.5 && angleDeg < 292.5)) {
                    r1 = magnitude[(y - 1) * width + x];
                    r2 = magnitude[(y + 1) * width + x];
                    weight1 = 1.0;
                    weight2 = 1.0;
                } else {
                    r1 = magnitude[(y - 1) * width + (x - 1)];
                    r2 = magnitude[(y + 1) * width + (x + 1)];
                    weight1 = 0.707;
                    weight2 = 0.707;
                }
                
                // Apply weighted comparison
                const threshold1 = r1 * weight1;
                const threshold2 = r2 * weight2;
                
                result[idx] = (mag >= threshold1 && mag >= threshold2) ? mag : 0;
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

    adaptiveDoubleThreshold(data, width, height, baseThreshold) {
        // Calculate adaptive thresholds based on image statistics
        let sum = 0;
        let count = 0;
        for (let i = 0; i < width * height; i++) {
            if (data[i] > 0) {
                sum += data[i];
                count++;
            }
        }
        
        const mean = count > 0 ? sum / count : 0;
        // Lower thresholds to capture more edges
        const highThreshold = Math.max(baseThreshold * 0.5, mean * 1.0);
        const lowThreshold = Math.max(baseThreshold * 0.1, mean * 0.3);
        
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

    connectedComponentCleanup(data, width, height) {
        // Find connected components and remove small ones (noise)
        const visited = new Set();
        const components = [];
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                if ((data[idx] === 255 || data[idx] === 128) && !visited.has(idx)) {
                    const component = this.findConnectedComponentEnhanced(data, width, height, x, y, visited);
                    if (component.length > 10) { // Lower threshold to keep more components
                        components.push(component);
                    }
                }
            }
        }
        
        // Reconstruct the image with only significant components
        const result = new Uint8ClampedArray(width * height);
        for (const component of components) {
            for (const idx of component) {
                result[idx] = 255;
            }
        }
        
        // Apply region growing to fill gaps
        return this.regionGrowing(result, width, height);
    }

    findConnectedComponentEnhanced(data, width, height, startX, startY, visited) {
        const component = [];
        const stack = [{x: startX, y: startY}];
        
        while (stack.length > 0) {
            const {x, y} = stack.pop();
            const idx = y * width + x;
            
            if (x < 0 || x >= width || y < 0 || y >= height || 
                (data[idx] !== 255 && data[idx] !== 128) || visited.has(idx)) {
                continue;
            }
            
            visited.add(idx);
            component.push(idx);
            
            // Add 8-connected neighbors
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    stack.push({x: x + dx, y: y + dy});
                }
            }
        }
        
        return component;
    }

    regionGrowing(data, width, height) {
        const result = new Uint8ClampedArray(data);
        const visited = new Set();
        
        // Find seed points (strong edges)
        const seeds = [];
        for (let i = 0; i < width * height; i++) {
            if (data[i] === 255) {
                seeds.push(i);
            }
        }
        
        // Grow regions from seeds
        for (const seed of seeds) {
            if (!visited.has(seed)) {
                this.growRegion(result, width, height, seed, visited);
            }
        }
        
        return result;
    }

    growRegion(data, width, height, startIdx, visited) {
        const stack = [startIdx];
        
        while (stack.length > 0) {
            const idx = stack.pop();
            
            if (visited.has(idx)) continue;
            visited.add(idx);
            
            const x = idx % width;
            const y = Math.floor(idx / width);
            
            // Check 8-connected neighbors
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    
                    const nx = x + dx;
                    const ny = y + dy;
                    
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        const nIdx = ny * width + nx;
                        
                        // Grow to weak edges and nearby pixels
                        if (!visited.has(nIdx) && (data[nIdx] === 128 || data[nIdx] > 0)) {
                            data[nIdx] = 255;
                            stack.push(nIdx);
                        }
                    }
                }
            }
        }
    }

    generateMathematicalOutlines() {
        const canvas = this.outlinesCanvas;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
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
        
        // Use multiple passes with different thresholds to capture full person outline
        const edgeThresholds = [255, 128, 64]; // High, medium, low thresholds
        
        for (const threshold of edgeThresholds) {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = y * width + x;
                    if (edgeData[idx] >= threshold && !visited.has(idx)) {
                        const contour = this.traceContourEnhanced(edgeData, width, height, x, y, visited, threshold);
                        if (contour.length > 20) { // Increased minimum length
                            contours.push(contour);
                        }
                    }
                }
            }
        }
        
        // Filter contours to focus on person-like shapes
        const personContours = this.filterPersonContours(contours, width, height);
        
        // Apply advanced person detection with feature analysis
        return this.advancedPersonDetection(personContours, edgeData, width, height);
    }

    traceContourEnhanced(edgeData, width, height, startX, startY, visited, threshold) {
        const contour = [];
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        let x = startX;
        let y = startY;
        let consecutiveFailures = 0;
        const maxFailures = 5;
        
        do {
            contour.push({x, y});
            visited.add(y * width + x);
            
            let found = false;
            for (const [dx, dy] of directions) {
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const idx = ny * width + nx;
                    if (edgeData[idx] >= threshold && !visited.has(idx)) {
                        x = nx;
                        y = ny;
                        found = true;
                        consecutiveFailures = 0;
                        break;
                    }
                }
            }
            
            if (!found) {
                consecutiveFailures++;
                // Try with lower threshold if we can't find next point
                if (consecutiveFailures < maxFailures) {
                    for (const [dx, dy] of directions) {
                        const nx = x + dx;
                        const ny = y + dy;
                        
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const idx = ny * width + nx;
                            if (edgeData[idx] > 0 && !visited.has(idx)) {
                                x = nx;
                                y = ny;
                                found = true;
                                break;
                            }
                        }
                    }
                }
            }
            
            if (!found || consecutiveFailures >= maxFailures) break;
        } while (x !== startX || y !== startY);
        
        return contour;
    }

    advancedPersonDetection(contours, edgeData, width, height) {
        const detectedPersons = [];
        
        for (const contour of contours) {
            // Calculate person confidence score
            const confidence = this.calculatePersonConfidence(contour, edgeData, width, height);
            
            if (confidence > 0.5) { // Lower confidence threshold
                detectedPersons.push(contour);
            }
        }
        
        // If no high-confidence persons found, try with even lower threshold
        if (detectedPersons.length === 0) {
            for (const contour of contours) {
                const confidence = this.calculatePersonConfidence(contour, edgeData, width, height);
                if (confidence > 0.3) { // Much lower threshold
                    detectedPersons.push(contour);
                }
            }
        }
        
        // If still no persons found, include the largest contour
        if (detectedPersons.length === 0 && contours.length > 0) {
            let largestContour = contours[0];
            let maxArea = this.calculateArea(contours[0]);
            
            for (const contour of contours) {
                const area = this.calculateArea(contour);
                if (area > maxArea) {
                    maxArea = area;
                    largestContour = contour;
                }
            }
            
            detectedPersons.push(largestContour);
        }
        
        return detectedPersons;
    }

    calculatePersonConfidence(contour, edgeData, width, height) {
        let confidence = 0;
        
        // Basic shape analysis (25% weight)
        const shapeScore = this.analyzeShape(contour);
        confidence += shapeScore * 0.25;
        
        // Edge density analysis (20% weight)
        const edgeDensityScore = this.analyzeEdgeDensity(contour, edgeData, width, height);
        confidence += edgeDensityScore * 0.2;
        
        // Feature detection (25% weight)
        const featureScore = this.detectHumanFeatures(contour, edgeData, width, height);
        confidence += featureScore * 0.25;
        
        // Spatial distribution (15% weight)
        const spatialScore = this.analyzeSpatialDistribution(contour, width, height);
        confidence += spatialScore * 0.15;
        
        // Pose estimation (15% weight)
        const poseScore = this.estimatePose(contour, edgeData, width, height);
        confidence += poseScore * 0.15;
        
        return confidence;
    }

    estimatePose(contour, edgeData, width, height) {
        // Estimate human pose by analyzing body proportions and joint positions
        let poseScore = 0;
        
        // Calculate bounding box
        let minX = width, maxX = 0, minY = height, maxY = 0;
        for (const point of contour) {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
        }
        
        const bboxWidth = maxX - minX;
        const bboxHeight = maxY - minY;
        
        // Check for typical human pose proportions
        const aspectRatio = bboxHeight / bboxWidth;
        if (aspectRatio > 1.5 && aspectRatio < 3.0) {
            poseScore += 0.3; // Good height-to-width ratio
        }
        
        // Detect potential joint positions
        const joints = this.detectJoints(contour, edgeData, width, height);
        poseScore += joints.score * 0.4;
        
        // Check for standing pose (vertical alignment)
        const verticalAlignment = this.checkVerticalAlignment(contour);
        poseScore += verticalAlignment * 0.3;
        
        return poseScore;
    }

    detectJoints(contour, edgeData, width, height) {
        const joints = {
            head: null,
            neck: null,
            shoulders: [],
            elbows: [],
            hips: [],
            knees: [],
            score: 0
        };
        
        // Find potential head position (top of contour)
        const sortedPoints = contour.sort((a, b) => a.y - b.y);
        const headCandidates = sortedPoints.slice(0, Math.floor(contour.length * 0.1));
        
        if (headCandidates.length > 0) {
            const headCenter = this.findCenter(headCandidates);
            joints.head = headCenter;
            joints.score += 0.2;
        }
        
        // Find potential shoulder positions
        const shoulderY = Math.floor(height * 0.2);
        const shoulderCandidates = contour.filter(p => Math.abs(p.y - shoulderY) < 10);
        if (shoulderCandidates.length > 0) {
            joints.shoulders = this.findShoulderPair(shoulderCandidates);
            joints.score += 0.2;
        }
        
        // Find potential hip positions
        const hipY = Math.floor(height * 0.6);
        const hipCandidates = contour.filter(p => Math.abs(p.y - hipY) < 10);
        if (hipCandidates.length > 0) {
            joints.hips = this.findHipPair(hipCandidates);
            joints.score += 0.2;
        }
        
        return joints;
    }

    findCenter(points) {
        let sumX = 0, sumY = 0;
        for (const point of points) {
            sumX += point.x;
            sumY += point.y;
        }
        return {
            x: sumX / points.length,
            y: sumY / points.length
        };
    }

    findShoulderPair(candidates) {
        // Find two points that could represent shoulders
        const sorted = candidates.sort((a, b) => a.x - b.x);
        if (sorted.length >= 2) {
            return [sorted[0], sorted[sorted.length - 1]];
        }
        return [];
    }

    findHipPair(candidates) {
        // Find two points that could represent hips
        const sorted = candidates.sort((a, b) => a.x - b.x);
        if (sorted.length >= 2) {
            return [sorted[0], sorted[sorted.length - 1]];
        }
        return [];
    }

    checkVerticalAlignment(contour) {
        // Check if the contour is vertically aligned (typical of standing pose)
        let verticalSegments = 0;
        let totalSegments = 0;
        
        for (let i = 0; i < contour.length - 1; i++) {
            const p1 = contour[i];
            const p2 = contour[i + 1];
            
            const dx = Math.abs(p2.x - p1.x);
            const dy = Math.abs(p2.y - p1.y);
            
            if (dy > dx) { // More vertical than horizontal
                verticalSegments++;
            }
            totalSegments++;
        }
        
        return totalSegments > 0 ? verticalSegments / totalSegments : 0;
    }

    detectHumanFeatures(contour, edgeData, width, height) {
        // Look for human-specific features like head, shoulders, etc.
        let featureScore = 0;
        
        // Check for head-like region (circular/oval shape at top)
        const headScore = this.detectHeadRegion(contour);
        featureScore += headScore * 0.3;
        
        // Check for shoulder-like regions (horizontal lines)
        const shoulderScore = this.detectShoulderRegions(contour, edgeData, width, height);
        featureScore += shoulderScore * 0.25;
        
        // Check for arm-like extensions
        const armScore = this.detectArmExtensions(contour);
        featureScore += armScore * 0.25;
        
        // Check for facial features
        const facialScore = this.detectFacialFeatures(contour, edgeData, width, height);
        featureScore += facialScore * 0.2;
        
        return featureScore;
    }

    detectFacialFeatures(contour, edgeData, width, height) {
        // Look for facial features like eyes, nose, mouth
        let facialScore = 0;
        
        // Find the top portion of the contour (potential face region)
        const topPoints = contour.slice(0, Math.floor(contour.length * 0.2));
        
        if (topPoints.length > 5) {
            // Check for symmetry in the face region
            const symmetry = this.checkFacialSymmetry(topPoints);
            facialScore += symmetry * 0.5;
            
            // Check for horizontal features (eyes, mouth)
            const horizontalFeatures = this.detectHorizontalFeatures(topPoints, edgeData, width, height);
            facialScore += horizontalFeatures * 0.5;
        }
        
        return facialScore;
    }

    checkFacialSymmetry(points) {
        if (points.length < 3) return 0;
        
        // Find the center line
        const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
        
        let symmetricPairs = 0;
        let totalPoints = 0;
        
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            const distanceFromCenter = Math.abs(point.x - centerX);
            
            // Look for a corresponding point on the other side
            const oppositeX = centerX + (centerX - point.x);
            const oppositeY = point.y;
            
            // Check if there's a point near the opposite position
            let foundOpposite = false;
            for (const otherPoint of points) {
                const dx = Math.abs(otherPoint.x - oppositeX);
                const dy = Math.abs(otherPoint.y - oppositeY);
                
                if (dx < 5 && dy < 5) { // 5 pixel tolerance
                    foundOpposite = true;
                    break;
                }
            }
            
            if (foundOpposite) {
                symmetricPairs++;
            }
            totalPoints++;
        }
        
        return totalPoints > 0 ? symmetricPairs / totalPoints : 0;
    }

    detectHorizontalFeatures(points, edgeData, width, height) {
        // Look for horizontal lines that could be eyes or mouth
        let horizontalFeatures = 0;
        
        for (const point of points) {
            const x = Math.floor(point.x);
            const y = Math.floor(point.y);
            
            if (x >= 2 && x < width - 2 && y >= 0 && y < height) {
                // Check for horizontal edge patterns
                let horizontalCount = 0;
                for (let dx = -2; dx <= 2; dx++) {
                    const nx = x + dx;
                    const idx = y * width + nx;
                    if (edgeData[idx] > 0) {
                        horizontalCount++;
                    }
                }
                
                if (horizontalCount >= 3) { // At least 3 horizontal edges
                    horizontalFeatures++;
                }
            }
        }
        
        return points.length > 0 ? horizontalFeatures / points.length : 0;
    }

    analyzeShape(contour) {
        if (contour.length < 10) return 0;
        
        // Calculate shape characteristics
        const perimeter = this.calculatePerimeter(contour);
        const area = this.calculateArea(contour);
        const compactness = (perimeter * perimeter) / (4 * Math.PI * area);
        
        // Human shapes are typically not too compact (not circular)
        const compactnessScore = Math.max(0, 1 - (compactness - 1) / 2);
        
        // Check for elongation (humans are typically elongated)
        const elongation = this.calculateElongation(contour);
        const elongationScore = Math.min(1, elongation / 2);
        
        return (compactnessScore + elongationScore) / 2;
    }

    calculatePerimeter(contour) {
        let perimeter = 0;
        for (let i = 0; i < contour.length - 1; i++) {
            const dx = contour[i + 1].x - contour[i].x;
            const dy = contour[i + 1].y - contour[i].y;
            perimeter += Math.sqrt(dx * dx + dy * dy);
        }
        return perimeter;
    }

    calculateArea(contour) {
        let area = 0;
        for (let i = 0; i < contour.length; i++) {
            const j = (i + 1) % contour.length;
            area += contour[i].x * contour[j].y;
            area -= contour[j].x * contour[i].y;
        }
        return Math.abs(area) / 2;
    }

    calculateElongation(contour) {
        // Calculate the ratio of major to minor axis
        let sumX = 0, sumY = 0, sumXX = 0, sumYY = 0, sumXY = 0;
        
        for (const point of contour) {
            sumX += point.x;
            sumY += point.y;
            sumXX += point.x * point.x;
            sumYY += point.y * point.y;
            sumXY += point.x * point.y;
        }
        
        const n = contour.length;
        const meanX = sumX / n;
        const meanY = sumY / n;
        
        const varX = (sumXX / n) - (meanX * meanX);
        const varY = (sumYY / n) - (meanY * meanY);
        const covXY = (sumXY / n) - (meanX * meanY);
        
        const discriminant = Math.sqrt((varX - varY) * (varX - varY) + 4 * covXY * covXY);
        const majorAxis = (varX + varY + discriminant) / 2;
        const minorAxis = (varX + varY - discriminant) / 2;
        
        return majorAxis > 0 && minorAxis > 0 ? majorAxis / minorAxis : 1;
    }

    analyzeEdgeDensity(contour, edgeData, width, height) {
        // Check if the contour has high edge density (typical of detailed human features)
        let edgeCount = 0;
        let totalPixels = 0;
        
        // Sample points along the contour
        for (let i = 0; i < contour.length; i += 2) {
            const point = contour[i];
            const x = Math.floor(point.x);
            const y = Math.floor(point.y);
            
            if (x >= 0 && x < width && y >= 0 && y < height) {
                const idx = y * width + x;
                if (edgeData[idx] > 0) {
                    edgeCount++;
                }
                totalPixels++;
            }
        }
        
        return totalPixels > 0 ? edgeCount / totalPixels : 0;
    }

    detectHeadRegion(contour) {
        // Find the top portion of the contour and check if it's roughly circular
        const topPoints = contour.slice(0, Math.floor(contour.length * 0.3));
        
        if (topPoints.length < 5) return 0;
        
        // Calculate the bounding box of the top region
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const point of topPoints) {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
        }
        
        const width = maxX - minX;
        const height = maxY - minY;
        const aspectRatio = width / height;
        
        // Head should be roughly circular (aspect ratio close to 1)
        return Math.max(0, 1 - Math.abs(aspectRatio - 1));
    }

    detectShoulderRegions(contour, edgeData, width, height) {
        // Look for horizontal edge patterns in the upper-middle region
        const middleStart = Math.floor(contour.length * 0.2);
        const middleEnd = Math.floor(contour.length * 0.5);
        const middlePoints = contour.slice(middleStart, middleEnd);
        
        let horizontalEdges = 0;
        let totalEdges = 0;
        
        for (const point of middlePoints) {
            const x = Math.floor(point.x);
            const y = Math.floor(point.y);
            
            if (x >= 1 && x < width - 1 && y >= 0 && y < height) {
                // Check for horizontal edge patterns
                const left = edgeData[y * width + (x - 1)];
                const center = edgeData[y * width + x];
                const right = edgeData[y * width + (x + 1)];
                
                if (left > 0 && center > 0 && right > 0) {
                    horizontalEdges++;
                }
                totalEdges++;
            }
        }
        
        return totalEdges > 0 ? horizontalEdges / totalEdges : 0;
    }

    detectArmExtensions(contour) {
        // Look for protrusions that could be arms
        let extensions = 0;
        
        for (let i = 1; i < contour.length - 1; i++) {
            const prev = contour[i - 1];
            const curr = contour[i];
            const next = contour[i + 1];
            
            // Calculate if this point forms an extension
            const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
            const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
            const angleDiff = Math.abs(angle1 - angle2);
            
            // Extensions have sharp angle changes
            if (angleDiff > Math.PI / 2) {
                extensions++;
            }
        }
        
        return Math.min(1, extensions / 10); // Normalize to 0-1
    }

    analyzeSpatialDistribution(contour, width, height) {
        // Check if the contour is positioned in a typical human location
        let centerX = 0, centerY = 0;
        
        for (const point of contour) {
            centerX += point.x;
            centerY += point.y;
        }
        
        centerX /= contour.length;
        centerY /= contour.length;
        
        // Humans are typically centered horizontally and in the middle-lower part vertically
        const horizontalCenter = 1 - Math.abs(centerX - width / 2) / (width / 2);
        const verticalPosition = centerY / height; // 0 = top, 1 = bottom
        
        // Prefer middle-lower vertical position
        const verticalScore = verticalPosition > 0.3 && verticalPosition < 0.8 ? 1 : 0.5;
        
        return (horizontalCenter + verticalScore) / 2;
    }

    filterPersonContours(contours, width, height) {
        const personContours = [];
        
        for (const contour of contours) {
            if (this.isPersonLike(contour, width, height)) {
                personContours.push(contour);
            }
        }
        
        // Only keep the most significant person contours (max 3)
        return this.selectMostSignificantContours(personContours, 3);
    }

    selectMostSignificantContours(contours, maxCount) {
        if (contours.length <= maxCount) return contours;
        
        // Sort contours by significance (area and complexity)
        const scoredContours = contours.map(contour => ({
            contour: contour,
            score: this.calculateContourSignificance(contour)
        }));
        
        scoredContours.sort((a, b) => b.score - a.score);
        
        // Return only the most significant contours
        return scoredContours.slice(0, maxCount).map(item => item.contour);
    }

    calculateContourSignificance(contour) {
        const area = this.calculateArea(contour);
        const perimeter = this.calculatePerimeter(contour);
        const complexity = contour.length;
        
        // Combine area, perimeter, and complexity for significance score
        return area * 0.5 + perimeter * 0.3 + complexity * 0.2;
    }

    isPersonLike(contour, width, height) {
        if (contour.length < 15) return false; // Lower minimum length
        
        // Calculate bounding box
        let minX = width, maxX = 0, minY = height, maxY = 0;
        for (const point of contour) {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
        }
        
        const bboxWidth = maxX - minX;
        const bboxHeight = maxY - minY;
        const aspectRatio = bboxHeight / bboxWidth;
        
        // Person-like characteristics:
        // 1. Height should be greater than width (aspect ratio > 1.0) - more lenient
        // 2. Should be reasonably sized (not too small or too large)
        // 3. Should have some complexity (not just a simple shape)
        // 4. Should have human-like proportions
        
        const minSize = Math.min(width, height) * 0.05; // Lower minimum size (5% of image)
        const maxSize = Math.min(width, height) * 0.9; // Higher maximum size (90% of image)
        
        const size = Math.max(bboxWidth, bboxHeight);
        const complexity = contour.length / (bboxWidth + bboxHeight);
        
        // Check for human-like proportions
        const humanProportions = this.checkHumanProportions(contour, bboxWidth, bboxHeight);
        
        // Check for symmetry (human faces/bodies are generally symmetrical)
        const symmetry = this.checkSymmetry(contour, minX, maxX, minY, maxY);
        
        // Check for smoothness (human contours are generally smooth)
        const smoothness = this.checkSmoothness(contour);
        
        // More lenient thresholds
        return aspectRatio > 1.0 && 
               size >= minSize && 
               size <= maxSize && 
               complexity > 0.3 && // Lower complexity threshold
               humanProportions > 0.4 && // Lower proportion threshold
               symmetry > 0.2 && // Lower symmetry threshold
               smoothness > 0.2; // Lower smoothness threshold
    }

    checkHumanProportions(contour, bboxWidth, bboxHeight) {
        // Check if the contour has human-like proportions
        // Humans typically have head, torso, and legs in specific ratios
        
        const points = contour;
        const centerX = bboxWidth / 2;
        const centerY = bboxHeight / 2;
        
        let headRegion = 0;
        let torsoRegion = 0;
        let legRegion = 0;
        
        for (const point of points) {
            const relativeY = (point.y - centerY) / bboxHeight;
            
            if (relativeY < -0.3) {
                headRegion++; // Upper region (head)
            } else if (relativeY < 0.2) {
                torsoRegion++; // Middle region (torso)
            } else {
                legRegion++; // Lower region (legs)
            }
        }
        
        const total = headRegion + torsoRegion + legRegion;
        if (total === 0) return 0;
        
        // Ideal human proportions: head ~15%, torso ~35%, legs ~50%
        const headRatio = headRegion / total;
        const torsoRatio = torsoRegion / total;
        const legRatio = legRegion / total;
        
        const idealHead = 0.15;
        const idealTorso = 0.35;
        const idealLeg = 0.50;
        
        const headScore = 1 - Math.abs(headRatio - idealHead) / idealHead;
        const torsoScore = 1 - Math.abs(torsoRatio - idealTorso) / idealTorso;
        const legScore = 1 - Math.abs(legRatio - idealLeg) / idealLeg;
        
        return (headScore + torsoScore + legScore) / 3;
    }

    checkSymmetry(contour, minX, maxX, minY, maxY) {
        // Check for vertical symmetry (typical of human faces/bodies)
        const centerX = (minX + maxX) / 2;
        const symmetryTolerance = (maxX - minX) * 0.1; // 10% tolerance
        
        let symmetricPoints = 0;
        let totalPoints = 0;
        
        for (const point of contour) {
            const distanceFromCenter = Math.abs(point.x - centerX);
            
            // Look for a corresponding point on the other side
            const oppositeX = centerX + (centerX - point.x);
            const oppositeY = point.y;
            
            // Check if there's a point near the opposite position
            let foundOpposite = false;
            for (const otherPoint of contour) {
                const dx = Math.abs(otherPoint.x - oppositeX);
                const dy = Math.abs(otherPoint.y - oppositeY);
                
                if (dx < symmetryTolerance && dy < symmetryTolerance) {
                    foundOpposite = true;
                    break;
                }
            }
            
            if (foundOpposite) {
                symmetricPoints++;
            }
            totalPoints++;
        }
        
        return totalPoints > 0 ? symmetricPoints / totalPoints : 0;
    }

    checkSmoothness(contour) {
        // Check how smooth the contour is (human contours are generally smooth)
        if (contour.length < 3) return 0;
        
        let smoothSegments = 0;
        let totalSegments = 0;
        
        for (let i = 1; i < contour.length - 1; i++) {
            const prev = contour[i - 1];
            const curr = contour[i];
            const next = contour[i + 1];
            
            // Calculate angles between consecutive segments
            const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
            const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
            
            const angleDiff = Math.abs(angle1 - angle2);
            const angleDiffDegrees = angleDiff * 180 / Math.PI;
            
            // Smooth segments have small angle differences
            if (angleDiffDegrees < 45) { // Less than 45 degrees
                smoothSegments++;
            }
            totalSegments++;
        }
        
        return totalSegments > 0 ? smoothSegments / totalSegments : 0;
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
            if (contour.length < 5) continue; // Skip very small contours
            
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
            
            // Only add if formula was generated successfully
            if (formula) {
                outlines.push(formula);
            }
        }
        
        // Limit total number of outlines to keep equations manageable
        return outlines.slice(0, 5); // Maximum 5 outlines
    }

    generateLinearFormula(contour) {
        // Use the actual contour points, not simplified ones
        const points = contour;
        const segments = [];
        
        // Create segments that follow the actual contour
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            // Include all significant segments that are part of the actual outline
            if (length > 5) { // Lower threshold to capture more detail
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
        
        // Connect the last point to the first to close the outline
        if (points.length > 2) {
            const first = points[0];
            const last = points[points.length - 1];
            const dx = last.x - first.x;
            const dy = last.y - first.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            if (length > 5) {
                segments.push({
                    type: 'line',
                    x1: last.x,
                    y1: last.y,
                    x2: first.x,
                    y2: first.y,
                    length: length
                });
            }
        }
        
        // Only return if we have meaningful segments
        if (segments.length === 0) return null;
        
        return {
            type: 'linear',
            segments: segments,
            points: points
        };
    }

    generateQuadraticFormula(contour) {
        // Use the actual contour points for better representation
        const points = contour;
        const curves = [];
        
        // Create curves that follow the actual contour shape
        for (let i = 0; i < points.length - 2; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[i + 2];
            
            // Calculate the actual curve that passes through these three points
            const length1 = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
            const length2 = Math.sqrt((p3.x - p2.x) ** 2 + (p3.y - p2.y) ** 2);
            
            // Only include curves that represent significant shape changes
            if (length1 > 8 && length2 > 8) {
                curves.push({
                    type: 'quadratic',
                    x1: p1.x, y1: p1.y,
                    x2: p2.x, y2: p2.y,
                    x3: p3.x, y3: p3.y
                });
            }
        }
        
        // Only return if we have meaningful curves
        if (curves.length === 0) return null;
        
        return {
            type: 'quadratic',
            curves: curves,
            points: points
        };
    }

    generateSplineFormula(contour) {
        // Use the actual contour points for accurate representation
        const points = contour;
        const splines = [];
        
        // Create splines that follow the actual contour shape
        for (let i = 0; i < points.length - 3; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[i + 2];
            const p4 = points[i + 3];
            
            // Calculate the actual spline that passes through these four points
            const totalLength = this.calculateSegmentLength([p1, p2, p3, p4]);
            
            // Only include splines that represent significant shape changes
            if (totalLength > 12) {
                splines.push({
                    type: 'cubic',
                    x1: p1.x, y1: p1.y,
                    x2: p2.x, y2: p2.y,
                    x3: p3.x, y3: p3.y,
                    x4: p4.x, y4: p4.y
                });
            }
        }
        
        // Only return if we have meaningful splines
        if (splines.length === 0) return null;
        
        return {
            type: 'spline',
            splines: splines,
            points: points
        };
    }

    calculateSegmentLength(points) {
        let totalLength = 0;
        for (let i = 0; i < points.length - 1; i++) {
            const dx = points[i + 1].x - points[i].x;
            const dy = points[i + 1].y - points[i].y;
            totalLength += Math.sqrt(dx * dx + dy * dy);
        }
        return totalLength;
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
        
                 if (targetTab === 'formulas') {
             document.getElementById('previewElement').classList.add('active');
         } else if (targetTab === 'black-outline') {
             document.getElementById('blackOutlinePreview').classList.add('active');
         }
    }
    
    createBlackOutlinePreview() {
        const canvas = this.blackOutlineCanvas;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
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
        let formulas = '/* Mathematical Formulas for Desmos */\n';
        formulas += '/* Copy and paste these into Desmos Graphing Calculator */\n\n';
        
        for (let i = 0; i < this.outlines.length; i++) {
            const outline = this.outlines[i];
            formulas += `/* Outline ${i + 1} */\n`;
            
            switch (outline.type) {
                case 'linear':
                    formulas += this.generateLinearFormulas(outline, i);
                    break;
                case 'quadratic':
                    formulas += this.generateQuadraticFormulas(outline, i);
                    break;
                case 'spline':
                    formulas += this.generateSplineFormulas(outline, i);
                    break;
            }
            formulas += '\n';
        }
        
        this.formulaOutput.textContent = formulas;
        this.createMathematicalPreview();
    }
    
    createMathematicalPreview() {
        this.previewElement.innerHTML = '';
        
        // Create a canvas to draw the mathematical formulas
        const canvas = document.createElement('canvas');
        canvas.width = this.originalCanvas.width;
        canvas.height = this.originalCanvas.height;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.border = '1px solid #e5e7eb';
        canvas.style.borderRadius = '4px';
        
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        // Clear canvas with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw all mathematical formulas
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        for (const outline of this.outlines) {
            switch (outline.type) {
                case 'linear':
                    this.drawLinearFormulas(ctx, outline);
                    break;
                case 'quadratic':
                    this.drawQuadraticFormulas(ctx, outline);
                    break;
                case 'spline':
                    this.drawSplineFormulas(ctx, outline);
                    break;
            }
        }
        
        this.previewElement.appendChild(canvas);
    }
    
    drawLinearFormulas(ctx, outline) {
        // Draw all segments to represent the complete outline
        for (const segment of outline.segments) {
            // Handle vertical lines
            if (Math.abs(segment.x2 - segment.x1) < 0.1) {
                ctx.beginPath();
                ctx.moveTo(segment.x1, segment.y1);
                ctx.lineTo(segment.x2, segment.y2);
                ctx.stroke();
            } else {
                // Regular line equation y = mx + c
                const m = (segment.y2 - segment.y1) / (segment.x2 - segment.x1);
                const c = segment.y1 - m * segment.x1;
                
                const xMin = Math.min(segment.x1, segment.x2);
                const xMax = Math.max(segment.x1, segment.x2);
                
                // Draw the line segment using the formula y = mx + c
                ctx.beginPath();
                ctx.moveTo(xMin, m * xMin + c);
                ctx.lineTo(xMax, m * xMax + c);
                ctx.stroke();
            }
        }
    }
    
    drawQuadraticFormulas(ctx, outline) {
        // Draw all curves to represent the complete outline
        for (const curve of outline.curves) {
            const x1 = curve.x1, y1 = curve.y1;
            const x2 = curve.x2, y2 = curve.y2;
            const x3 = curve.x3, y3 = curve.y3;
            
            // Solve for quadratic coefficients
            const det = (x1 - x2) * (x2 - x3) * (x3 - x1);
            if (Math.abs(det) > 0.001) {
                const a = ((y1 - y2) * (x2 - x3) - (y2 - y3) * (x1 - x2)) / det;
                const b = ((y1 - y2) * (x2 * x2 - x3 * x3) - (y2 - y3) * (x1 * x1 - x2 * x2)) / det;
                const c = y1 - a * x1 * x1 - b * x1;
                
                const xMin = Math.min(x1, x2, x3);
                const xMax = Math.max(x1, x2, x3);
                
                // Draw the quadratic curve using the formula y = ax² + bx + c
                ctx.beginPath();
                ctx.moveTo(xMin, a * xMin * xMin + b * xMin + c);
                
                for (let x = xMin; x <= xMax; x += 0.5) {
                    const y = a * x * x + b * x + c;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            } else {
                // Fallback to linear if quadratic fails
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x3, y3);
                ctx.stroke();
            }
        }
    }
    
    drawSplineFormulas(ctx, outline) {
        // Draw all splines to represent the complete outline
        for (const spline of outline.splines) {
            const x1 = spline.x1, y1 = spline.y1;
            const x2 = spline.x2, y2 = spline.y2;
            const x3 = spline.x3, y3 = spline.y3;
            const x4 = spline.x4, y4 = spline.y4;
            
            // Draw the cubic Bezier curve using parametric equations
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            
            for (let t = 0; t <= 1; t += 0.01) {
                const x = Math.pow(1-t, 3) * x1 + 3 * Math.pow(1-t, 2) * t * x2 + 3 * (1-t) * t * t * x3 + t * t * t * x4;
                const y = Math.pow(1-t, 3) * y1 + 3 * Math.pow(1-t, 2) * t * y2 + 3 * (1-t) * t * t * y3 + t * t * t * y4;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    }
    
    generateLinearFormulas(outline, index) {
        let formulas = '';
        const segments = outline.segments;
        
        // Include all segments to represent the complete outline
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            
            // Handle vertical lines (infinite slope)
            if (Math.abs(segment.x2 - segment.x1) < 0.1) {
                const x = segment.x1;
                const yMin = Math.min(segment.y1, segment.y2);
                const yMax = Math.max(segment.y1, segment.y2);
                formulas += `x = ${x.toFixed(1)} \\{${yMin.toFixed(1)} < y < ${yMax.toFixed(1)}\\}\n`;
            } else {
                // Regular line equation y = mx + c
                const m = (segment.y2 - segment.y1) / (segment.x2 - segment.x1);
                const c = segment.y1 - m * segment.x1;
                
                // Convert to Desmos format with range
                const xMin = Math.min(segment.x1, segment.x2);
                const xMax = Math.max(segment.x1, segment.x2);
                
                formulas += `y = ${m.toFixed(3)}x + ${c.toFixed(3)} \\{${xMin.toFixed(1)} < x < ${xMax.toFixed(1)}\\}\n`;
            }
        }
        
        return formulas;
    }
    
    generateQuadraticFormulas(outline, index) {
        let formulas = '';
        const curves = outline.curves;
        
        // Include all curves to represent the complete outline
        for (let i = 0; i < curves.length; i++) {
            const curve = curves[i];
            
            // Convert quadratic Bezier to standard quadratic form: y = ax² + bx + c
            // Using the three points to solve for a, b, c
            const x1 = curve.x1, y1 = curve.y1;
            const x2 = curve.x2, y2 = curve.y2;
            const x3 = curve.x3, y3 = curve.y3;
            
            // Solve system of equations:
            // y1 = ax1^2 + bx1 + c
            // y2 = ax2^2 + bx2 + c  
            // y3 = ax3^2 + bx3 + c
            
            const det = (x1 - x2) * (x2 - x3) * (x3 - x1);
            if (Math.abs(det) > 0.001) { // Avoid division by zero
                const a = ((y1 - y2) * (x2 - x3) - (y2 - y3) * (x1 - x2)) / det;
                const b = ((y1 - y2) * (x2 * x2 - x3 * x3) - (y2 - y3) * (x1 * x1 - x2 * x2)) / det;
                const c = y1 - a * x1 * x1 - b * x1;
                
                const xMin = Math.min(x1, x2, x3);
                const xMax = Math.max(x1, x2, x3);
                
                formulas += `y = ${a.toFixed(3)}x^2 + ${b.toFixed(3)}x + ${c.toFixed(3)} \\{${xMin.toFixed(1)} < x < ${xMax.toFixed(1)}\\}\n`;
            } else {
                // Fallback to linear if quadratic fails
                const m = (y3 - y1) / (x3 - x1);
                const c = y1 - m * x1;
                const xMin = Math.min(x1, x3);
                const xMax = Math.max(x1, x3);
                formulas += `y = ${m.toFixed(3)}x + ${c.toFixed(3)} \\{${xMin.toFixed(1)} < x < ${xMax.toFixed(1)}\\}\n`;
            }
        }
        
        return formulas;
    }
    
    generateSplineFormulas(outline, index) {
        let formulas = '';
        const splines = outline.splines;
        
        // Include all splines to represent the complete outline
        for (let i = 0; i < splines.length; i++) {
            const spline = splines[i];
            
            // For cubic splines, we'll use parametric equations
            // x(t) = (1-t)^3 * x1 + 3(1-t)^2 * t * x2 + 3(1-t) * t^2 * x3 + t^3 * x4
            // y(t) = (1-t)^3 * y1 + 3(1-t)^2 * t * y2 + 3(1-t) * t^2 * y3 + t^3 * y4
            
            const x1 = spline.x1, y1 = spline.y1;
            const x2 = spline.x2, y2 = spline.y2;
            const x3 = spline.x3, y3 = spline.y3;
            const x4 = spline.x4, y4 = spline.y4;
            
            // Parametric equations for Desmos
            formulas += `x(t) = (1-t)^3 * ${x1.toFixed(1)} + 3(1-t)^2 * t * ${x2.toFixed(1)} + 3(1-t) * t^2 * ${x3.toFixed(1)} + t^3 * ${x4.toFixed(1)}\n`;
            formulas += `y(t) = (1-t)^3 * ${y1.toFixed(1)} + 3(1-t)^2 * t * ${y2.toFixed(1)} + 3(1-t) * t^2 * ${y3.toFixed(1)} + t^3 * ${y4.toFixed(1)} \\{0 < t < 1\\}\n`;
        }
        
        return formulas;
    }



    async copyToClipboard() {
        try {
            await navigator.clipboard.writeText(this.formulaOutput.textContent);
            this.copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                this.copyBtn.textContent = 'Copy Desmos Formulas';
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
                this.copyBtn.textContent = 'Copy Desmos Formulas';
            }, 2000);
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new MathematicalOutlineGenerator();
});
