export class LimbStudio {
    constructor(rig, dataManager, onComplete) {
        this.rig = rig;
        this.dataManager = dataManager;
        this.onComplete = onComplete;

        this.steps = [
            { id: 'head',  label: 'Step 1/4: Draw the <strong>HEAD</strong> (Red dot = Neck Joint)' },
            { id: 'arm',   label: 'Step 2/4: Draw an <strong>ARM</strong> downwards (Red dot = Shoulder)' },
            { id: 'torso', label: 'Step 3/4: Draw the <strong>TORSO</strong> (Red dot = Core Center)' },
            { id: 'leg',   label: 'Step 4/4: Draw a <strong>LEG</strong> downwards (Red dot = Hip)' }
        ];
        this.currentStep = 0;

        this.canvas = document.getElementById('draw-canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.pivotMarker = document.getElementById('pivot-marker');
        this.promptEl = document.getElementById('step-prompt');
        this.sizeInput = document.getElementById('brush-size');
        this.sizeLabel = document.getElementById('size-label');
        this.styleSelect = document.getElementById('brush-style');
        this.fillShapeCheck = document.getElementById('fill-shape');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.undoBtn = document.getElementById('undo-btn');
        this.redoBtn = document.getElementById('redo-btn');

        this.primaryHex = '#111111';
        this.secondaryHex = '#ffffff';
        this.editingSlot = 'primary';
        this.hsv = { h: 0, s: 0, v: 7 };

        this.currentTool = 'brush';
        this.isDrawing = false;
        this.startPos = { x: 0, y: 0 };
        this.dragSnapshot = null;

        this.histories = {};
        this.steps.forEach(s => {
            this.histories[s.id] = { undo: [], redo: [] };
        });

        this.initColorSystem();
        this.bindEvents();
        this.initDraggableWindows();
        this.restoreSavedLimbsToHistory();
    }

    get activeColor() {
        return this.primaryHex;
    }

    // Allows both Character Editor Panel and Color Wheel Dock to be freely dragged around the screen
    initDraggableWindows() {
        const makeDraggable = (panelEl, handleEl) => {
            if (!panelEl || !handleEl) return;
            let isDragging = false;
            let startX = 0, startY = 0, origLeft = 0, origTop = 0;

            handleEl.addEventListener('pointerdown', (e) => {
                if (e.target.closest('button') || e.target.closest('input')) return;
                isDragging = true;
                const rect = panelEl.getBoundingClientRect();
                startX = e.clientX;
                startY = e.clientY;
                origLeft = rect.left;
                origTop = rect.top;
                panelEl.style.margin = '0';
                panelEl.style.left = `${origLeft}px`;
                panelEl.style.top = `${origTop}px`;
                handleEl.setPointerCapture(e.pointerId);
            });

            handleEl.addEventListener('pointermove', (e) => {
                if (!isDragging) return;
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                const nextLeft = Math.max(8, Math.min(window.innerWidth - 120, origLeft + dx));
                const nextTop = Math.max(56, Math.min(window.innerHeight - 80, origTop + dy));
                panelEl.style.left = `${nextLeft}px`;
                panelEl.style.top = `${nextTop}px`;
            });

            const stopDrag = () => { isDragging = false; };
            handleEl.addEventListener('pointerup', stopDrag);
            handleEl.addEventListener('pointercancel', stopDrag);
        };

        makeDraggable(document.getElementById('studio-overlay'), document.getElementById('studio-drag-handle'));
        makeDraggable(document.getElementById('pdn-color-dock'), document.getElementById('pdn-drag-handle'));
    }

    restoreSavedLimbsToHistory() {
        const savedLimbs = this.dataManager.state.limbs || {};
        const hasAnyLimb = Object.values(savedLimbs).some(Boolean);

        if (!hasAnyLimb) {
            this.steps.forEach(s => {
                this.histories[s.id] = { undo: [], redo: [] };
                this.rig.setLimbTexture(s.id, null);
            });
            this.loadStep(0);
            return;
        }

        let loadedCount = 0;
        const totalToLoad = Object.values(savedLimbs).filter(Boolean).length;

        this.steps.forEach(step => {
            const url = savedLimbs[step.id];
            if (url) {
                this.rig.setLimbTexture(step.id, url, (part, img) => {
                    const off = document.createElement('canvas');
                    off.width = this.canvas.width;
                    off.height = this.canvas.height;
                    const octx = off.getContext('2d');
                    octx.drawImage(img, 0, 0);
                    this.histories[part].undo = [octx.getImageData(0, 0, off.width, off.height)];
                    this.histories[part].redo = [];
                    loadedCount++;
                    if (loadedCount >= totalToLoad) {
                        this.loadStep(this.currentStep);
                    }
                });
            } else {
                this.histories[step.id] = { undo: [], redo: [] };
                this.rig.setLimbTexture(step.id, null);
            }
        });
    }

    saveAllLimbsToProfile() {
        const currentPart = this.steps[this.currentStep].id;
        if (this.histories[currentPart].undo.length === 0) {
            this.histories[currentPart].undo.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
        }

        const off = document.createElement('canvas');
        off.width = this.canvas.width;
        off.height = this.canvas.height;
        const octx = off.getContext('2d');

        this.steps.forEach(step => {
            const hist = this.histories[step.id];
            if (hist.undo.length > 0) {
                octx.clearRect(0, 0, off.width, off.height);
                octx.putImageData(hist.undo[hist.undo.length - 1], 0, 0);
                const dataUrl = off.toDataURL('image/webp', 0.88);
                this.rig.setLimbTexture(step.id, dataUrl);
                this.dataManager.state.limbs[step.id] = dataUrl;
            }
        });
        this.dataManager.saveToStorage();
    }

    initColorSystem() {
        const palette = [
            '#000000', '#404040', '#ff0000', '#ff6a00', '#ffd800', '#b6ff00', '#4cff00', '#00ff21',
            '#808080', '#c0c0c0', '#7f0000', '#7f3300', '#7f6a00', '#5b7f00', '#267f00', '#007f0e',
            '#ffffff', '#00ffff', '#0094ff', '#0026ff', '#4800ff', '#b200ff', '#ff00dc', '#ff006e',
            '#a0a0a0', '#007f7f', '#004a7f', '#00137f', '#21007f', '#57007f', '#7f006e', '#7f0037'
        ];

        const quickContainer = document.getElementById('color-swatches');
        const pdnGrid = document.getElementById('pdn-palette-grid');

        palette.forEach((hex, idx) => {
            const createSwatch = () => {
                const div = document.createElement('div');
                div.className = 'swatch';
                div.style.background = hex;
                div.addEventListener('click', () => {
                    this.setColorFromHex(hex);
                    if (this.currentTool === 'eraser') this.selectTool('brush');
                });
                return div;
            };
            if (idx < 10) quickContainer.appendChild(createSwatch());
            pdnGrid.appendChild(createSwatch());
        });

        this.wheelCanvas = document.getElementById('color-wheel-canvas');
        this.wheelCursor = document.getElementById('wheel-cursor');
        this.renderColorWheel();

        let draggingWheel = false;
        const pickWheel = (e) => {
            const rect = this.wheelCanvas.getBoundingClientRect();
            const cx = this.wheelCanvas.width / 2;
            const cy = this.wheelCanvas.height / 2;
            const dx = e.clientX - rect.left - cx;
            const dy = e.clientY - rect.top - cy;
            const radius = cx;
            const dist = Math.min(radius, Math.hypot(dx, dy));
            let angle = Math.atan2(dy, dx) * (180 / Math.PI);
            if (angle < 0) angle += 360;

            this.hsv.h = Math.round(angle);
            this.hsv.s = Math.round((dist / radius) * 100);
            if (this.hsv.v < 15) this.hsv.v = 100;
            this.syncFromHSV();
        };

        this.wheelCanvas.addEventListener('pointerdown', (e) => {
            draggingWheel = true;
            pickWheel(e);
        });
        window.addEventListener('pointermove', (e) => {
            if (draggingWheel) pickWheel(e);
        });
        window.addEventListener('pointerup', () => {
            draggingWheel = false;
        });

        const dock = document.getElementById('pdn-color-dock');
        document.getElementById('open-wheel-btn').addEventListener('click', () => dock.classList.toggle('open'));
        document.getElementById('toggle-color-dock').addEventListener('click', () => dock.classList.toggle('open'));
        document.getElementById('close-pdn-btn').addEventListener('click', () => dock.classList.remove('open'));

        const pBox = document.getElementById('pdn-primary-box');
        const sBox = document.getElementById('pdn-secondary-box');
        pBox.addEventListener('click', () => {
            this.editingSlot = 'primary';
            pBox.classList.add('active');
            sBox.classList.remove('active');
            this.setColorFromHex(this.primaryHex);
        });
        sBox.addEventListener('click', () => {
            this.editingSlot = 'secondary';
            sBox.classList.add('active');
            pBox.classList.remove('active');
            this.setColorFromHex(this.secondaryHex);
        });

        document.getElementById('pdn-swap-btn').addEventListener('click', () => {
            const temp = this.primaryHex;
            this.primaryHex = this.secondaryHex;
            this.secondaryHex = temp;
            this.setColorFromHex(this.editingSlot === 'primary' ? this.primaryHex : this.secondaryHex);
        });

        document.getElementById('pdn-reset-btn').addEventListener('click', () => {
            this.primaryHex = '#111111';
            this.secondaryHex = '#ffffff';
            this.setColorFromHex(this.editingSlot === 'primary' ? this.primaryHex : this.secondaryHex);
        });

        ['r', 'g', 'b'].forEach(ch => {
            const slider = document.getElementById(`${ch}-slider`);
            const num = document.getElementById(`${ch}-num`);
            const onRGB = (val) => {
                const clamped = Math.max(0, Math.min(255, Number(val) || 0));
                slider.value = clamped;
                num.value = clamped;
                const r = Number(document.getElementById('r-slider').value);
                const g = Number(document.getElementById('g-slider').value);
                const b = Number(document.getElementById('b-slider').value);
                this.hsv = this.rgbToHsv(r, g, b);
                this.syncFromHSV(false);
            };
            slider.addEventListener('input', () => onRGB(slider.value));
            num.addEventListener('input', () => onRGB(num.value));
        });

        ['h', 's', 'v'].forEach(ch => {
            const slider = document.getElementById(`${ch}-slider`);
            const num = document.getElementById(`${ch}-num`);
            const max = ch === 'h' ? 360 : 100;
            const onHSV = (val) => {
                const clamped = Math.max(0, Math.min(max, Number(val) || 0));
                this.hsv[ch] = clamped;
                this.syncFromHSV();
            };
            slider.addEventListener('input', () => onHSV(slider.value));
            num.addEventListener('input', () => onHSV(num.value));
        });

        const hexInput = document.getElementById('hex-input');
        hexInput.addEventListener('input', () => {
            const clean = hexInput.value.replace(/[^0-9a-fA-F]/g, '');
            if (clean.length === 6) {
                this.setColorFromHex(`#${clean}`, false);
            }
        });

        this.setColorFromHex('#111111');
    }

    renderColorWheel() {
        const ctx = this.wheelCanvas.getContext('2d');
        const w = this.wheelCanvas.width;
        const h = this.wheelCanvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const radius = cx;
        const imgData = ctx.createImageData(w, h);
        const data = imgData.data;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const dx = x - cx;
                const dy = y - cy;
                const dist = Math.hypot(dx, dy);
                if (dist <= radius) {
                    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
                    if (angle < 0) angle += 360;
                    const sat = (dist / radius) * 100;
                    const { r, g, b } = this.hsvToRgb(angle, sat, 100);
                    const idx = (y * w + x) * 4;
                    data[idx] = r;
                    data[idx + 1] = g;
                    data[idx + 2] = b;
                    data[idx + 3] = 255;
                }
            }
        }
        ctx.putImageData(imgData, 0, 0);
    }

    setColorFromHex(hex, updateHexField = true) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        this.hsv = this.rgbToHsv(r, g, b);
        this.syncFromHSV(true, updateHexField);
    }

    syncFromHSV(updateRgb = true, updateHexField = true) {
        const { h, s, v } = this.hsv;
        const { r, g, b } = this.hsvToRgb(h, s, v);
        const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');

        if (this.editingSlot === 'primary') {
            this.primaryHex = hex;
        } else {
            this.secondaryHex = hex;
        }

        document.getElementById('primary-preview').style.background = this.primaryHex;
        document.getElementById('secondary-preview').style.background = this.secondaryHex;
        document.getElementById('pdn-primary-box').style.background = this.primaryHex;
        document.getElementById('pdn-secondary-box').style.background = this.secondaryHex;

        const radius = this.wheelCanvas.width / 2;
        const rad = (h * Math.PI) / 180;
        const dist = (s / 100) * radius;
        this.wheelCursor.style.left = `${radius + Math.cos(rad) * dist}px`;
        this.wheelCursor.style.top = `${radius + Math.sin(rad) * dist}px`;

        if (updateRgb) {
            document.getElementById('r-slider').value = r;
            document.getElementById('r-num').value = r;
            document.getElementById('g-slider').value = g;
            document.getElementById('g-num').value = g;
            document.getElementById('b-slider').value = b;
            document.getElementById('b-num').value = b;
        }
        document.getElementById('h-slider').value = h;
        document.getElementById('h-num').value = h;
        document.getElementById('s-slider').value = s;
        document.getElementById('s-num').value = s;
        document.getElementById('v-slider').value = v;
        document.getElementById('v-num').value = v;

        if (updateHexField) {
            document.getElementById('hex-input').value = hex.slice(1).toUpperCase();
        }
    }

    hsvToRgb(h, s, v) {
        const hue = ((Number(h) % 360) + 360) % 360;
        const sat = Math.max(0, Math.min(1, Number(s) / 100));
        const val = Math.max(0, Math.min(1, Number(v) / 100));

        const f = (n) => {
            const k = (n + hue / 60) % 6;
            return val - val * sat * Math.max(0, Math.min(k, 4 - k, 1));
        };

        return {
            r: Math.round(f(5) * 255),
            g: Math.round(f(3) * 255),
            b: Math.round(f(1) * 255)
        };
    }

    rgbToHsv(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const d = max - min;
        let h = 0;
        const s = max === 0 ? 0 : d / max;
        const v = max;
        if (max !== min) {
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            v: Math.round(v * 100)
        };
    }

    selectTool(toolName) {
        this.currentTool = toolName;
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === toolName);
        });
    }

    bindEvents() {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectTool(btn.dataset.tool));
        });

        this.sizeInput.addEventListener('input', () => {
            this.sizeLabel.textContent = `${this.sizeInput.value}px`;
        });

        const start = (e) => {
            const pos = this.getPos(e);
            if (this.currentTool === 'bucket') {
                this.floodFill(Math.floor(pos.x), Math.floor(pos.y), this.activeColor);
                this.saveState();
                return;
            }
            if (this.currentTool === 'picker') {
                this.pickColor(Math.floor(pos.x), Math.floor(pos.y));
                return;
            }

            this.isDrawing = true;
            this.startPos = pos;
            this.dragSnapshot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, pos.y);
            if (this.currentTool === 'brush' || this.currentTool === 'eraser') {
                this.drawStroke(pos);
            }
        };

        const move = (e) => {
            if (!this.isDrawing) return;
            const pos = this.getPos(e);

            if (this.currentTool === 'brush' || this.currentTool === 'eraser') {
                this.drawStroke(pos);
                this.syncToRig(false);
            } else if (['line', 'rect', 'circle'].includes(this.currentTool)) {
                this.ctx.putImageData(this.dragSnapshot, 0, 0);
                this.drawShape(this.startPos, pos);
            }
        };

        const stop = () => {
            if (!this.isDrawing) return;
            this.isDrawing = false;
            this.ctx.globalCompositeOperation = 'source-over';
            this.saveState();
        };

        this.canvas.addEventListener('pointerdown', start);
        this.canvas.addEventListener('pointermove', move);
        window.addEventListener('pointerup', stop);

        this.undoBtn.addEventListener('click', () => this.undo());
        this.redoBtn.addEventListener('click', () => this.redo());

        document.getElementById('clear-btn').addEventListener('click', () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.saveState();
        });

        document.getElementById('save-char-btn').addEventListener('click', async () => {
            this.saveAllLimbsToProfile();
            await this.dataManager.saveCharacterToVault(
                this.dataManager.currentUser ? `${this.dataManager.currentUser.name}'s Husser` : 'Custom Husser'
            );
            const btn = document.getElementById('save-char-btn');
            const prevText = btn.textContent;
            btn.textContent = '✓ Saved!';
            setTimeout(() => { btn.textContent = prevText; }, 1400);
        });

        document.getElementById('preset-char-btn').addEventListener('click', () => {
            const generated = this.rig.generatePresetTextures();
            Object.entries(generated).forEach(([part, url]) => {
                this.dataManager.saveLimb(part, url);
            });
            this.restoreSavedLimbsToHistory();
        });

        window.addEventListener('keydown', (e) => {
            if (document.activeElement.tagName === 'INPUT') return;
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                e.shiftKey ? this.redo() : this.undo();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                this.redo();
            }
        });

        this.prevBtn.addEventListener('click', () => {
            if (this.currentStep > 0) this.loadStep(this.currentStep - 1);
        });

        this.nextBtn.addEventListener('click', () => {
            if (this.currentStep < this.steps.length - 1) {
                this.loadStep(this.currentStep + 1);
            }
        });
    }

    drawStroke(pos) {
        const size = Number(this.sizeInput.value);
        const style = this.styleSelect.value;

        this.ctx.globalCompositeOperation =
            this.currentTool === 'eraser' ? 'destination-out' : 'source-over';
        this.ctx.strokeStyle = this.activeColor;
        this.ctx.fillStyle = this.activeColor;
        this.ctx.lineWidth = size;

        if (this.currentTool === 'eraser' || style === 'round') {
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.lineTo(pos.x, pos.y);
            this.ctx.stroke();
        } else if (style === 'square') {
            this.ctx.lineCap = 'square';
            this.ctx.lineJoin = 'miter';
            this.ctx.lineTo(pos.x, pos.y);
            this.ctx.stroke();
        } else if (style === 'spray') {
            const density = size * 2;
            for (let i = 0; i < density; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * size;
                this.ctx.fillRect(
                    pos.x + Math.cos(angle) * radius,
                    pos.y + Math.sin(angle) * radius,
                    1.5, 1.5
                );
            }
        } else if (style === 'marker') {
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x - size * 0.6, pos.y + size * 0.6);
            this.ctx.lineTo(pos.x + size * 0.6, pos.y - size * 0.6);
            this.ctx.lineWidth = Math.max(2, size * 0.4);
            this.ctx.stroke();
        }
    }

    drawShape(start, end) {
        const size = Number(this.sizeInput.value);
        const shouldFill = this.fillShapeCheck.checked;

        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.strokeStyle = this.activeColor;
        this.ctx.fillStyle = this.activeColor;
        this.ctx.lineWidth = size;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.beginPath();
        if (this.currentTool === 'line') {
            this.ctx.moveTo(start.x, start.y);
            this.ctx.lineTo(end.x, end.y);
            this.ctx.stroke();
        } else if (this.currentTool === 'rect') {
            const w = end.x - start.x;
            const h = end.y - start.y;
            if (shouldFill) this.ctx.fillRect(start.x, start.y, w, h);
            this.ctx.strokeRect(start.x, start.y, w, h);
        } else if (this.currentTool === 'circle') {
            const rx = Math.abs(end.x - start.x) / 2;
            const ry = Math.abs(end.y - start.y) / 2;
            const cx = (start.x + end.x) / 2;
            const cy = (start.y + end.y) / 2;
            this.ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            if (shouldFill) this.ctx.fill();
            this.ctx.stroke();
        }
        this.syncToRig(false);
    }

    pickColor(x, y) {
        const pixel = this.ctx.getImageData(x, y, 1, 1).data;
        if (pixel[3] === 0) {
            this.setColorFromHex('#ffffff');
        } else {
            const hex = '#' + [pixel[0], pixel[1], pixel[2]]
                .map(v => v.toString(16).padStart(2, '0')).join('');
            this.setColorFromHex(hex);
        }
        this.selectTool('brush');
    }

    floodFill(startX, startY, hexColor) {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const imgData = this.ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        const fillR = parseInt(hexColor.slice(1, 3), 16);
        const fillG = parseInt(hexColor.slice(3, 5), 16);
        const fillB = parseInt(hexColor.slice(5, 7), 16);

        const startIdx = (startY * w + startX) * 4;
        const targetR = data[startIdx];
        const targetG = data[startIdx + 1];
        const targetB = data[startIdx + 2];
        const targetA = data[startIdx + 3];

        if (
            Math.abs(targetR - fillR) < 5 &&
            Math.abs(targetG - fillG) < 5 &&
            Math.abs(targetB - fillB) < 5 &&
            targetA === 255
        ) return;

        const tolerance = 35;
        const matches = (idx) => {
            return (
                Math.abs(data[idx] - targetR) <= tolerance &&
                Math.abs(data[idx + 1] - targetG) <= tolerance &&
                Math.abs(data[idx + 2] - targetB) <= tolerance &&
                Math.abs(data[idx + 3] - targetA) <= tolerance
            );
        };

        const visited = new Uint8Array(w * h);
        const stack = [startX + startY * w];
        visited[startX + startY * w] = 1;

        while (stack.length > 0) {
            const pos = stack.pop();
            const x = pos % w;
            const y = (pos - x) / w;
            const idx = pos * 4;

            data[idx] = fillR;
            data[idx + 1] = fillG;
            data[idx + 2] = fillB;
            data[idx + 3] = 255;

            const neighbors = [
                x > 0 ? pos - 1 : -1,
                x < w - 1 ? pos + 1 : -1,
                y > 0 ? pos - w : -1,
                y < h - 1 ? pos + w : -1
            ];

            for (const n of neighbors) {
                if (n !== -1 && !visited[n] && matches(n * 4)) {
                    visited[n] = 1;
                    stack.push(n);
                }
            }
        }

        this.ctx.putImageData(imgData, 0, 0);
    }

    saveState() {
        const part = this.steps[this.currentStep].id;
        const hist = this.histories[part];
        hist.undo.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
        if (hist.undo.length > 25) hist.undo.shift();
        hist.redo = [];
        this.updateHistoryButtons();
        this.syncToRig(true);
    }

    undo() {
        const part = this.steps[this.currentStep].id;
        const hist = this.histories[part];
        if (hist.undo.length <= 1) return;

        hist.redo.push(hist.undo.pop());
        const prev = hist.undo[hist.undo.length - 1];
        this.ctx.putImageData(prev, 0, 0);
        this.updateHistoryButtons();
        this.syncToRig(true);
    }

    redo() {
        const part = this.steps[this.currentStep].id;
        const hist = this.histories[part];
        if (hist.redo.length === 0) return;

        const next = hist.redo.pop();
        hist.undo.push(next);
        this.ctx.putImageData(next, 0, 0);
        this.updateHistoryButtons();
        this.syncToRig(true);
    }

    updateHistoryButtons() {
        const part = this.steps[this.currentStep].id;
        const hist = this.histories[part];
        this.undoBtn.disabled = hist.undo.length <= 1;
        this.redoBtn.disabled = hist.redo.length === 0;
    }

    getPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    loadStep(index) {
        this.currentStep = index;
        const step = this.steps[index];
        this.promptEl.innerHTML = step.label;

        const hist = this.histories[step.id];
        if (hist.undo.length === 0) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            hist.undo.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
        } else {
            this.ctx.putImageData(hist.undo[hist.undo.length - 1], 0, 0);
        }

        const pivot = this.rig.pivots[step.id];
        this.pivotMarker.style.left = `${pivot.x}px`;
        this.pivotMarker.style.top = `${pivot.y}px`;

        this.prevBtn.disabled = index === 0;
        this.nextBtn.disabled = index === this.steps.length - 1;
        this.nextBtn.innerHTML = 'Next Limb →';
        this.updateHistoryButtons();
    }

    syncToRig(persistToStorage = true) {
        const part = this.steps[this.currentStep].id;
        const dataUrl = this.canvas.toDataURL('image/webp', 0.85);
        this.rig.setLimbTexture(part, dataUrl);
        if (persistToStorage && this.dataManager) {
            this.dataManager.saveLimb(part, dataUrl);
        }
    }
}