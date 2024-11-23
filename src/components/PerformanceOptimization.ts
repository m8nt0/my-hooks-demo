// PerformanceOptimization.ts
import { BaseExploration } from './BaseExploration';

// --- Code Splitting Utility ---
export class ModuleLoader {
    private loadedModules: Map<string, any> = new Map();
    private loading: Map<string, Promise<any>> = new Map();

    async loadModule(path: string): Promise<any> {
        if (this.loadedModules.has(path)) {
            return this.loadedModules.get(path);
        }

        if (this.loading.has(path)) {
            return this.loading.get(path);
        }

        const loadPromise = import(path)
            .then(module => {
                this.loadedModules.set(path, module);
                this.loading.delete(path);
                return module;
            })
            .catch(error => {
                this.loading.delete(path);
                throw error;
            });

        this.loading.set(path, loadPromise);
        return loadPromise;
    }

    isModuleLoaded(path: string): boolean {
        return this.loadedModules.has(path);
    }

    clearCache(): void {
        this.loadedModules.clear();
        this.loading.clear();
    }
}

// --- Lazy Loading Manager ---
export class LazyLoadManager {
    private observer: IntersectionObserver;
    private callbacks: Map<Element, () => void> = new Map();

    constructor() {
        this.observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const callback = this.callbacks.get(entry.target);
                        if (callback) {
                            callback();
                            this.observer.unobserve(entry.target);
                            this.callbacks.delete(entry.target);
                        }
                    }
                });
            },
            { rootMargin: '50px' }
        );
    }

    observe(element: Element, callback: () => void): void {
        this.callbacks.set(element, callback);
        this.observer.observe(element);
    }

    unobserve(element: Element): void {
        this.observer.unobserve(element);
        this.callbacks.delete(element);
    }

    disconnect(): void {
        this.observer.disconnect();
        this.callbacks.clear();
    }
}

// --- Memoization Decorator ---
export function memoize(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const cache = new Map<string, any>();

    descriptor.value = function(...args: any[]) {
        const key = JSON.stringify(args);
        
        if (cache.has(key)) {
            return cache.get(key);
        }

        const result = originalMethod.apply(this, args);
        cache.set(key, result);
        return result;
    };

    return descriptor;
}

// --- Bundle Optimization ---
class BundleOptimizer {
    private static instance: BundleOptimizer;
    private chunksLoaded: Set<string> = new Set();

    private constructor() {}

    static getInstance(): BundleOptimizer {
        if (!BundleOptimizer.instance) {
            BundleOptimizer.instance = new BundleOptimizer();
        }
        return BundleOptimizer.instance;
    }

    async loadChunk(chunkName: string): Promise<void> {
        if (this.chunksLoaded.has(chunkName)) {
            return;
        }

        const script = document.createElement('script');
        script.src = `/chunks/${chunkName}.js`;
        
        await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });

        this.chunksLoaded.add(chunkName);
    }

    isChunkLoaded(chunkName: string): boolean {
        return this.chunksLoaded.has(chunkName);
    }
}

// --- Image Optimization ---
class ImageOptimizer {
    private static supportedFormats: string[] = ['webp', 'avif', 'jpeg'];

    static async getBestImageFormat(): Promise<string> {
        const canvas = document.createElement('canvas');
        for (const format of this.supportedFormats) {
            if (canvas.toDataURL(`image/${format}`).indexOf(`image/${format}`) > -1) {
                return format;
            }
        }
        return 'jpeg';
    }

    static generateSrcSet(imagePath: string, sizes: number[]): string {
        return sizes
            .map(size => `${imagePath}-${size}w.${this.supportedFormats[0]} ${size}w`)
            .join(', ');
    }

    static async optimizeImage(
        file: File,
        maxWidth: number = 1920,
        quality: number = 0.8
    ): Promise<Blob> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            img.onload = () => {
                const ratio = Math.min(1, maxWidth / img.width);
                canvas.width = img.width * ratio;
                canvas.height = img.height * ratio;

                if (ctx) {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob(
                        blob => {
                            if (blob) resolve(blob);
                            else reject(new Error('Failed to create blob'));
                        },
                        'image/jpeg',
                        quality
                    );
                } else {
                    reject(new Error('Failed to get canvas context'));
                }
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }
}

// --- Performance Monitoring ---
export class PerformanceMonitor {
    private static instance: PerformanceMonitor;
    private metrics: Map<string, number[]> = new Map();

    private constructor() {
        this.setupPerformanceObserver();
    }

    static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }

    private setupPerformanceObserver(): void {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                this.recordMetric(entry.name, entry.duration);
            }
        });

        observer.observe({ entryTypes: ['measure', 'paint', 'largest-contentful-paint'] });
    }

    measureTime(name: string, fn: () => void): void {
        const start = performance.now();
        fn();
        const duration = performance.now() - start;
        this.recordMetric(name, duration);
    }

    async measureAsyncTime(name: string, fn: () => Promise<void>): Promise<void> {
        const start = performance.now();
        await fn();
        const duration = performance.now() - start;
        this.recordMetric(name, duration);
    }

    private recordMetric(name: string, duration: number): void {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        this.metrics.get(name)?.push(duration);
    }

    getMetrics(): Record<string, { avg: number; min: number; max: number }> {
        const result: Record<string, { avg: number; min: number; max: number }> = {};

        this.metrics.forEach((durations, name) => {
            result[name] = {
                avg: durations.reduce((a, b) => a + b, 0) / durations.length,
                min: Math.min(...durations),
                max: Math.max(...durations)
            };
        });

        return result;
    }

    clearMetrics(): void {
        this.metrics.clear();
    }
}

export class PerformanceOptimization extends BaseExploration {
    private performanceMonitor: PerformanceMonitor;
    private moduleLoader: ModuleLoader;
    private lazyLoadManager: LazyLoadManager;

    constructor(containerId: string) {
        super(containerId);
        this.performanceMonitor = PerformanceMonitor.getInstance();
        this.moduleLoader = new ModuleLoader();
        this.lazyLoadManager = new LazyLoadManager();
    }

    public initialize(): void {
        this.render();
    }

    public cleanup(): void {
        // TODO: Implement
        this.lazyLoadManager.disconnect();
    }

    private render(): void {
        const metrics = this.performanceMonitor.getMetrics();

        
        this.container.innerHTML = `
            <div class="performance-exploration">
                <h2>Performance Optimization</h2>
                
                <section class="metrics-section">
                    <h3>Performance Metrics</h3>
                    <div class="metrics-container">
                        ${Object.entries(metrics).map(([name, stats]) => `
                            <div class="metric-item">
                                <h4>${name}</h4>
                                <ul>
                                    <li>Average: ${stats.avg.toFixed(2)}ms</li>
                                    <li>Min: ${stats.min.toFixed(2)}ms</li>
                                    <li>Max: ${stats.max.toFixed(2)}ms</li>
                                </ul>
                            </div>
                        `).join('')}
                    </div>
                    <button id="clear-metrics">Clear Metrics</button>
                </section>
    
                <section class="optimization-tools">
                    <h3>Optimization Tools</h3>
                    <div class="tool-buttons">
                        <button id="test-lazy-loading">Test Lazy Loading</button>
                        <button id="test-code-splitting">Test Code Splitting</button>
                        <button id="test-image-optimization">Test Image Optimization</button>
                    </div>
                    <div id="optimization-results"></div>
                </section>
            </div>
        `;
    
        this.attachEventListeners();
    }
    
    private attachEventListeners(): void {
        const clearMetricsBtn = document.getElementById('clear-metrics');
        clearMetricsBtn?.addEventListener('click', () => {
            this.performanceMonitor.clearMetrics();
            this.moduleLoader.clearCache();
            this.render();
        });
    
        const lazyLoadBtn = document.getElementById('test-lazy-loading');
        lazyLoadBtn?.addEventListener('click', async () => {
            const resultsDiv = document.getElementById('optimization-results');
            if (!resultsDiv) return;
    
            await this.performanceMonitor.measureAsyncTime('Lazy Loading Test', async () => {
                // Simulate lazy loading
                await new Promise(resolve => setTimeout(resolve, 1));
                resultsDiv.textContent = 'Lazy loading test completed!';
            });
            this.render();
        });
    
        // Similar event listeners for code splitting and image optimization tests
    }
}

export {
    BundleOptimizer,
    ImageOptimizer,

};