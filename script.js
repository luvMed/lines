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
        
        // Initialize mathematical outlines array
        this.mathematicalOutlines = [];
        
        // Verify all required elements exist
        this.verifyElements();
    }

    verifyElements() {
        const requiredElements = [
            'uploadArea', 'imageInput', 'processingSection', 'resultsSection',
            'originalCanvas', 'edgesCanvas', 'outlinesCanvas', 'formulaOutput',
            'previewElement', 'blackOutlineCanvas', 'copyBtn', 'processBtn'
        ];
        
        for (const elementName of requiredElements) {
            if (!this[elementName]) {
                console.error(`Required element not found: ${elementName}`);
                throw new Error(`Required element not found: ${elementName}`);
            }
        }
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
        if (!this.originalCanvas) {
            console.error('Original canvas not found');
            return;
        }
        
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
            if (!this.edgesCanvas) {
                throw new Error('Edges canvas not found');
            }
            
            const canvas = this.edgesCanvas;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            
            // Set canvas size same as original
            if (!this.originalCanvas) {
                throw new Error('Original canvas not found');
            }
            
            canvas.width = this.originalCanvas.width;
            canvas.height = this.originalCanvas.height;
            
            // Draw original image
            ctx.drawImage(this.originalImage, 0, 0, canvas.width, canvas.height);
            
            // Get image data once and cache it
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Convert to grayscale and apply edge detection
            const grayscale = this.convertToGrayscale(data, canvas.width, canvas.height);
            const edges = this.applyCannyEdgeDetection(imageData);
            
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

    applyCannyEdgeDetection(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        
        // Convert to grayscale and enhance for fine details like hair
        const grayscale = new Uint8Array(width * height);
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            grayscale[i / 4] = 0.299 * r + 0.587 * g + 0.114 * b;
        }
        
        // Apply Gaussian blur with smaller kernel for fine detail preservation
        const blurred = this.applyGaussianBlur(grayscale, width, height, 1.0);
        
        // Apply multiple edge detection operators for comprehensive detection
        const sobelX = this.applySobelX(blurred, width, height);
        const sobelY = this.applySobelY(blurred, width, height);
        const prewittX = this.applyPrewittX(blurred, width, height);
        const prewittY = this.applyPrewittY(blurred, width, height);
        const laplacian = this.applyLaplacian(blurred, width, height);
        
        // Enhanced edge detection with higher sensitivity for fine details
        const edges = new Uint8Array(width * height);
        for (let i = 0; i < edges.length; i++) {
            const sobelMag = Math.sqrt(sobelX[i] * sobelX[i] + sobelY[i] * sobelY[i]);
            const prewittMag = Math.sqrt(prewittX[i] * prewittX[i] + prewittY[i] * prewittY[i]);
            const laplacianMag = Math.abs(laplacian[i]);
            
            // Weighted combination with higher sensitivity for fine details
            const combined = (0.3 * sobelMag + 0.3 * prewittMag + 0.4 * laplacianMag);
            
            // Lower threshold for better hair detection
            edges[i] = combined > 15 ? 255 : 0; // Lowered from 20 to 15
        }
        
        // Apply morphological operations to enhance fine details
        const enhanced = this.morphologicalCleanup(edges, width, height);
        
        // Apply non-maximum suppression with higher sensitivity
        const suppressed = this.improvedNonMaximumSuppression(enhanced, width, height);
        
        // Apply adaptive double thresholding with lower thresholds for hair
        const thresholded = this.adaptiveDoubleThreshold(suppressed, width, height);
        
        // Apply connected component analysis with enhanced hair detection
        const cleaned = this.connectedComponentCleanup(thresholded, width, height);
        
        // Apply region growing to fill gaps in hair and fine features
        const filled = this.regionGrowing(cleaned, width, height);
        
        // Enhance edges with texture analysis for hair detection
        const textureEnhanced = this.enhanceEdgesWithTexture(filled, grayscale, width, height);
        
        return textureEnhanced;
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

    adaptiveDoubleThreshold(data, width, height) {
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
        const highThreshold = Math.max(mean * 0.6, 30); // Lowered from 0.8 to 0.6
        const lowThreshold = Math.max(mean * 0.2, 10);  // Lowered from 0.3 to 0.2
        
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
        const result = new Uint8ClampedArray(data.length);
        const visited = new Uint8ClampedArray(data.length);
        
        // Include both strong and weak edges for better hair detection
        for (let i = 0; i < data.length; i++) {
            if (data[i] >= 128 && !visited[i]) { // Include weak edges (128)
                const component = this.findConnectedComponentEnhanced(data, visited, i, width, height);
                
                // Lower threshold for hair components
                if (component.length >= 5) { // Lowered from 10 to 5
                    for (const index of component) {
                        result[index] = data[index];
                    }
                }
            }
        }
        
        return result;
    }

    findConnectedComponentEnhanced(data, visited, startIndex, width, height) {
        const component = [];
        const stack = [startIndex];
        
        while (stack.length > 0) {
            const index = stack.pop();
            
            if (visited[index] || data[index] < 128) continue; // Include weak edges
            
            visited[index] = 1;
            component.push(index);
            
            const x = index % width;
            const y = Math.floor(index / width);
            
            // 8-connectivity for better hair detection
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    
                    const nx = x + dx;
                    const ny = y + dy;
                    const neighborIndex = ny * width + nx;
                    
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height &&
                        !visited[neighborIndex] && data[neighborIndex] >= 128) {
                        stack.push(neighborIndex);
                    }
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
        // Generate mathematical outlines from detected edges
        if (!this.edgeData) {
            console.error('No edge data available');
            return;
        }
        
        // Extract contours from edge data
        const contours = this.extractContours(this.edgeData, this.originalCanvas.width, this.originalCanvas.height);
        
        // Detect person contours
        const personContours = this.advancedPersonDetection(contours);
        
        // Generate mathematical outlines for each person contour
        this.mathematicalOutlines = [];
        for (const contour of personContours) {
            // Generate different types of mathematical representations
            const linearOutline = this.generateLinearFormula(contour);
            if (linearOutline) {
                this.mathematicalOutlines.push(linearOutline);
            }
            
            const quadraticOutline = this.generateQuadraticFormula(contour);
            if (quadraticOutline) {
                this.mathematicalOutlines.push(quadraticOutline);
            }
            
            const splineOutline = this.generateSplineFormula(contour);
            if (splineOutline) {
                this.mathematicalOutlines.push(splineOutline);
            }
        }
        
        // Limit total outlines to prevent overwhelming output
        this.mathematicalOutlines = this.mathematicalOutlines.slice(0, 5);
    }

    drawLinearFormulas(ctx, outline) {
        // Draw only the outline boundary segments
        ctx.beginPath();
        for (let i = 0; i < outline.segments.length; i++) {
            const segment = outline.segments[i];
            
            if (i === 0) {
                ctx.moveTo(segment.x1, segment.y1);
            }
            ctx.lineTo(segment.x2, segment.y2);
        }
        ctx.stroke();
    }
    
    drawQuadraticFormulas(ctx, outline) {
        // Draw only the outline boundary curves
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
                
                // Draw the outline curve
                ctx.beginPath();
                ctx.moveTo(xMin, a * xMin * xMin + b * xMin + c);
                
                for (let x = xMin; x <= xMax; x += 0.5) {
                    const y = a * x * x + b * x + c;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            } else {
                // Fallback to linear outline
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x3, y3);
                ctx.stroke();
            }
        }
    }
    
    drawSplineFormulas(ctx, outline) {
        // Draw only the outline boundary splines
        for (const spline of outline.splines) {
            const x1 = spline.x1, y1 = spline.y1;
            const x2 = spline.x2, y2 = spline.y2;
            const x3 = spline.x3, y3 = spline.y3;
            const x4 = spline.x4, y4 = spline.y4;
            
            // Draw the outline spline
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
        if (!this.blackOutlineCanvas) {
            console.error('Black outline canvas not found');
            return;
        }
        
        const canvas = this.blackOutlineCanvas;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        // Set canvas size same as original
        if (!this.originalCanvas) {
            console.error('Original canvas not found');
            return;
        }
        
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
        if (!this.previewElement) {
            console.error('Preview element not found');
            return;
        }
        
        this.previewElement.innerHTML = '';
        
        // Create a canvas to draw the mathematical formulas
        const canvas = document.createElement('canvas');
        
        if (!this.originalCanvas) {
            console.error('Original canvas not found');
            return;
        }
        
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
        
        // Set outline drawing style - black outline only
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
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
        // Draw only the outline boundary segments
        ctx.beginPath();
        for (let i = 0; i < outline.segments.length; i++) {
            const segment = outline.segments[i];
            
            if (i === 0) {
                ctx.moveTo(segment.x1, segment.y1);
            }
            ctx.lineTo(segment.x2, segment.y2);
        }
        ctx.stroke();
    }
    
    drawQuadraticFormulas(ctx, outline) {
        // Draw only the outline boundary curves
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
                
                // Draw the outline curve
                ctx.beginPath();
                ctx.moveTo(xMin, a * xMin * xMin + b * xMin + c);
                
                for (let x = xMin; x <= xMax; x += 0.5) {
                    const y = a * x * x + b * x + c;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            } else {
                // Fallback to linear outline
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x3, y3);
                ctx.stroke();
            }
        }
    }
    
    drawSplineFormulas(ctx, outline) {
        // Draw only the outline boundary splines
        for (const spline of outline.splines) {
            const x1 = spline.x1, y1 = spline.y1;
            const x2 = spline.x2, y2 = spline.y2;
            const x3 = spline.x3, y3 = spline.y3;
            const x4 = spline.x4, y4 = spline.y4;
            
            // Draw the outline spline
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

    enhanceEdgesWithTexture(edges, grayscale, width, height) {
        const enhanced = new Uint8Array(edges.length);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const index = y * width + x;
                
                if (edges[index] > 0) {
                    enhanced[index] = edges[index];
                    continue;
                }
                
                // Check for texture patterns that indicate hair or fine details
                const textureScore = this.calculateTextureScore(grayscale, x, y, width);
                const localVariance = this.calculateLocalVariance(grayscale, x, y, width);
                
                // If high texture variance (indicating hair or fine details), enhance the edge
                if (textureScore > 0.3 || localVariance > 500) {
                    enhanced[index] = 128; // Medium strength edge
                } else {
                    enhanced[index] = 0;
                }
            }
        }
        
        return enhanced;
    }

    calculateTextureScore(grayscale, x, y, width) {
        // Calculate texture score based on local gradient patterns
        let score = 0;
        const radius = 2;
        
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                const index = ny * width + nx;
                
                if (nx >= 0 && nx < width && ny >= 0 && ny < grayscale.length / width) {
                    const diff = Math.abs(grayscale[y * width + x] - grayscale[index]);
                    score += diff;
                }
            }
        }
        
        return score / ((2 * radius + 1) * (2 * radius + 1) - 1);
    }

    calculateLocalVariance(grayscale, x, y, width) {
        // Calculate local variance to detect fine texture patterns
        const radius = 3;
        let sum = 0;
        let sumSq = 0;
        let count = 0;
        
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                const index = ny * width + nx;
                
                if (nx >= 0 && nx < width && ny >= 0 && ny < grayscale.length / width) {
                    const value = grayscale[index];
                    sum += value;
                    sumSq += value * value;
                    count++;
                }
            }
        }
        
        if (count === 0) return 0;
        
        const mean = sum / count;
        const variance = (sumSq / count) - (mean * mean);
        return variance;
    }

    adaptiveDoubleThreshold(edges, width, height) {
        const result = new Uint8Array(edges.length);
        
        // Calculate adaptive thresholds based on image statistics
        let sum = 0;
        let count = 0;
        for (let i = 0; i < edges.length; i++) {
            if (edges[i] > 0) {
                sum += edges[i];
                count++;
            }
        }
        
        const mean = count > 0 ? sum / count : 0;
        
        // Lower thresholds for better hair detection
        const highThreshold = Math.max(mean * 0.6, 30); // Lowered from 0.8 to 0.6
        const lowThreshold = Math.max(mean * 0.2, 10);  // Lowered from 0.3 to 0.2
        
        for (let i = 0; i < edges.length; i++) {
            if (edges[i] >= highThreshold) {
                result[i] = 255; // Strong edge
            } else if (edges[i] >= lowThreshold) {
                result[i] = 128; // Weak edge - important for hair
            } else {
                result[i] = 0;
            }
        }
        
        return result;
    }

    connectedComponentCleanup(edges, width, height) {
        const result = new Uint8Array(edges.length);
        const visited = new Uint8Array(edges.length);
        
        // Include both strong and weak edges for better hair detection
        for (let i = 0; i < edges.length; i++) {
            if (edges[i] >= 128 && !visited[i]) { // Include weak edges (128)
                const component = this.findConnectedComponentEnhanced(edges, visited, i, width, height);
                
                // Lower threshold for hair components
                if (component.length >= 5) { // Lowered from 10 to 5
                    for (const index of component) {
                        result[index] = edges[index];
                    }
                }
            }
        }
        
        return result;
    }

    findConnectedComponentEnhanced(edges, visited, startIndex, width, height) {
        const component = [];
        const stack = [startIndex];
        
        while (stack.length > 0) {
            const index = stack.pop();
            
            if (visited[index] || edges[index] < 128) continue; // Include weak edges
            
            visited[index] = 1;
            component.push(index);
            
            const x = index % width;
            const y = Math.floor(index / width);
            
            // 8-connectivity for better hair detection
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    
                    const nx = x + dx;
                    const ny = y + dy;
                    const neighborIndex = ny * width + nx;
                    
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height &&
                        !visited[neighborIndex] && edges[neighborIndex] >= 128) {
                        stack.push(neighborIndex);
                    }
                }
            }
        }
        
        return component;
    }

    regionGrowing(edges, width, height) {
        const result = new Uint8Array(edges.length);
        
        // Copy strong edges
        for (let i = 0; i < edges.length; i++) {
            if (edges[i] === 255) {
                result[i] = 255;
            }
        }
        
        // Grow regions from strong edges to include hair and fine details
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const index = y * width + x;
                
                if (result[index] === 255) {
                    this.growRegionEnhanced(result, edges, x, y, width, height);
                }
            }
        }
        
        return result;
    }

    growRegionEnhanced(result, edges, startX, startY, width, height) {
        const queue = [{x: startX, y: startY}];
        
        while (queue.length > 0) {
            const {x, y} = queue.shift();
            const index = y * width + x;
            
            // Check 8-connectivity for better hair detection
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    
                    const nx = x + dx;
                    const ny = y + dy;
                    const neighborIndex = ny * width + nx;
                    
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height &&
                        result[neighborIndex] === 0 && edges[neighborIndex] >= 64) { // Lower threshold for hair
                        result[neighborIndex] = 255;
                        queue.push({x: nx, y: ny});
                    }
                }
            }
        }
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

    advancedPersonDetection(contours) {
        const personContours = [];
        
        for (const contour of contours) {
            const confidence = this.calculatePersonConfidence(contour);
            
            // Lower confidence thresholds for better hair detection
            if (confidence > 0.3) { // Lowered from 0.5
                personContours.push({
                    contour: contour,
                    confidence: confidence
                });
            }
        }
        
        // Sort by confidence and select the best matches
        personContours.sort((a, b) => b.confidence - a.confidence);
        
        // Include more contours for better hair coverage
        const selectedContours = personContours.slice(0, 5); // Increased from 3
        
        // If no high-confidence contours found, include the largest contour
        if (selectedContours.length === 0 && contours.length > 0) {
            const largestContour = contours.reduce((largest, current) => {
                return this.calculateArea(current) > this.calculateArea(largest) ? current : largest;
            });
            
            selectedContours.push({
                contour: largestContour,
                confidence: 0.2
            });
        }
        
        return selectedContours.map(item => item.contour);
    }

    calculatePersonConfidence(contour) {
        if (contour.length < 10) return 0;
        
        const area = this.calculateArea(contour);
        const perimeter = this.calculatePerimeter(contour);
        const aspectRatio = this.calculateAspectRatio(contour);
        const complexity = this.calculateComplexity(contour);
        const humanProportions = this.checkHumanProportions(contour);
        const symmetry = this.checkSymmetry(contour);
        const smoothness = this.checkSmoothness(contour);
        const pose = this.estimatePose(contour);
        const features = this.detectHumanFeatures(contour);
        
        // Enhanced weighting for fine features like hair
        const weights = {
            area: 0.15,           // Reduced from 0.2
            aspectRatio: 0.1,     // Reduced from 0.15
            complexity: 0.2,      // Increased from 0.15 - important for hair
            humanProportions: 0.1, // Reduced from 0.15
            symmetry: 0.1,        // Reduced from 0.15
            smoothness: 0.1,      // Reduced from 0.15
            pose: 0.1,            // Reduced from 0.15
            features: 0.15        // Increased from 0.1 - important for hair
        };
        
        const combinedProb = 
            weights.area * area +
            weights.aspectRatio * aspectRatio +
            weights.complexity * complexity +
            weights.humanProportions * humanProportions +
            weights.symmetry * symmetry +
            weights.smoothness * smoothness +
            weights.pose * pose +
            weights.features * features;
        
        return Math.min(combinedProb, 1.0);
    }

    isPersonLike(contour) {
        if (contour.length < 10) return false; // Lowered from 15
        
        const area = this.calculateArea(contour);
        const perimeter = this.calculatePerimeter(contour);
        const aspectRatio = this.calculateAspectRatio(contour);
        const complexity = this.calculateComplexity(contour);
        
        // More lenient criteria for hair detection
        const minArea = 50;       // Lowered from 100
        const maxArea = 50000;    // Increased from 30000
        const minAspectRatio = 0.3; // Lowered from 0.5
        const maxAspectRatio = 5.0; // Increased from 3.0
        const minComplexity = 0.1;  // Lowered from 0.2
        const maxComplexity = 2.0;  // Increased from 1.5
        
        return area >= minArea && area <= maxArea &&
               aspectRatio >= minAspectRatio && aspectRatio <= maxAspectRatio &&
               complexity >= minComplexity && complexity <= maxComplexity;
    }

    detectHumanFeatures(contour) {
        const features = this.detectFacialFeatures(contour);
        const bodyParts = this.detectBodyParts(contour);
        const hairFeatures = this.detectHairFeatures(contour); // New hair detection
        
        // Enhanced weighting for hair features
        return 0.3 * features + 0.4 * bodyParts + 0.3 * hairFeatures;
    }

    detectHairFeatures(contour) {
        // Detect hair-like features in the upper portion of the contour
        const bounds = this.getBoundingBox(contour);
        const upperRegion = bounds.y + bounds.height * 0.3; // Upper 30% of contour
        
        let hairPoints = 0;
        let totalUpperPoints = 0;
        
        for (const point of contour) {
            if (point.y <= upperRegion) {
                totalUpperPoints++;
                
                // Check for fine texture patterns that indicate hair
                const textureScore = this.calculatePointTexture(point, contour);
                if (textureScore > 0.4) { // Lower threshold for hair detection
                    hairPoints++;
                }
            }
        }
        
        if (totalUpperPoints === 0) return 0;
        
        const hairRatio = hairPoints / totalUpperPoints;
        return Math.min(hairRatio * 2, 1.0); // Boost hair detection score
    }

    calculatePointTexture(point, contour) {
        // Calculate texture around a point to detect hair-like patterns
        const radius = 3;
        let textureVariance = 0;
        let neighborCount = 0;
        
        for (const neighbor of contour) {
            const distance = Math.sqrt((point.x - neighbor.x) ** 2 + (point.y - neighbor.y) ** 2);
            if (distance <= radius && distance > 0) {
                textureVariance += distance;
                neighborCount++;
            }
        }
        
        if (neighborCount === 0) return 0;
        
        return textureVariance / neighborCount;
    }

    getBoundingBox(contour) {
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        for (const point of contour) {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
        }
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new MathematicalOutlineGenerator();
});
