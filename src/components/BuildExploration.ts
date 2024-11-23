import { BaseExploration } from './BaseExploration';

interface BuildConfig {
    mode: 'development' | 'production';
    sourceMap: boolean;
    minify: boolean;
    environment: Record<string, string>;
    hotReload: boolean;
    port: number;
    [key: string]: string | number | boolean | Record<string, string>;
}

interface BuildStats {
    startTime: number;
    endTime: number;
    duration: number;
    errors: string[];
    warnings: string[];
    bundleSize?: string;
    hotReloadStatus?: boolean;
}

export class BuildExploration extends BaseExploration {
    private config: BuildConfig = {
        mode: 'development',
        sourceMap: true,
        minify: false,
        environment: {
            NODE_ENV: 'development',
            API_URL: 'http://localhost:3000'
        },
        hotReload: true,
        port: 8080
    };

    private buildStats: BuildStats = {
        startTime: 0,
        endTime: 0,
        duration: 0,
        errors: [],
        warnings: [],
        bundleSize: '0 KB',
        hotReloadStatus: false
    };

    private devServer: WebSocket | null = null;

    constructor(containerId: string) {
        super(containerId);
        this.initialize();
    }

    public initialize(): void {
        this.setupStyles();
        this.setupDevTools();
        this.render();
        this.attachEventListeners();
    }

    public cleanup(): void {
        window.onerror = null;
        this.devServer?.close();
        const buildStyles = document.querySelector('style[data-build-styles]');
        buildStyles?.remove();
    }

    private setupDevTools(): void {
        console.debug('Source maps enabled for debugging');
        
        if (this.config.mode === 'development') {
            console.log('%c Build Tools Demo ', 'background: #222; color: #bada55');
        }

        window.onerror = (message, source, line, column) => {
            this.buildStats.errors.push(`${message} at ${source}:${line}:${column}`);
            this.updateBuildStats();
            return false;
        };
    }


    private updateBuildStats(): void {
        const statsElement = document.getElementById('build-stats');
        if (!statsElement) return;

        statsElement.innerHTML = `
            <div class="stats-item">
                <strong>Mode:</strong> ${this.config.mode}
            </div>
            <div class="stats-item">
                <strong>Duration:</strong> ${this.buildStats.duration}ms
            </div>
            <div class="stats-item">
                <strong>Source Maps:</strong> ${this.config.sourceMap ? 'Enabled' : 'Disabled'}
            </div>
            <div class="stats-item">
                <strong>Minification:</strong> ${this.config.minify ? 'Enabled' : 'Disabled'}
            </div>
            ${this.buildStats.warnings.length > 0 ? `
                <div class="warnings">
                    <strong>Warnings:</strong>
                    <ul>
                        ${this.buildStats.warnings.map(w => `<li>${w}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            ${this.buildStats.errors.length > 0 ? `
                <div class="errors">
                    <strong>Errors:</strong>
                    <ul>
                        ${this.buildStats.errors.map(e => `<li>${e}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
    }

    // Add the simulateBuild method
    private async simulateBuild(): Promise<void> {
        this.buildStats = {
            ...this.buildStats,
            startTime: Date.now(),
            errors: [],
            warnings: []
        };

        // Simulate build process
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        this.buildStats.endTime = Date.now();
        this.buildStats.duration = this.buildStats.endTime - this.buildStats.startTime;
        this.buildStats.bundleSize = '156 KB';

        if (this.config.mode === 'development') {
            this.buildStats.warnings.push('Unused variable detected');
            this.buildStats.warnings.push('Missing type annotation');
        }

        this.updateBuildStats();
    }

    private attachEventListeners(): void {
        const buildButton = document.getElementById('start-build');
        buildButton?.addEventListener('click', () => this.simulateBuild());

        const configForm = document.getElementById('build-config') as HTMLFormElement;
        configForm?.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            if (target.type === 'checkbox') {
                this.config[target.name as keyof BuildConfig] = target.checked;
            } else if (target.type === 'radio') {
                this.config.mode = target.value as 'development' | 'production';
            }
            this.updateBuildStats();
        });
    }

    private setupStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            .build-exploration {
                padding: 20px;
                max-width: 800px;
                margin: 0 auto;
            }

            .config-section, .stats-section {
                margin: 20px 0;
                padding: 15px;
                border-radius: 4px;
                background: #f5f5f5;
            }

            .stats-item {
                margin: 10px 0;
            }

            .warnings {
                color: #856404;
                background-color: #fff3cd;
                padding: 10px;
                border-radius: 4px;
                margin: 10px 0;
            }

            .errors {
                color: #721c24;
                background-color: #f8d7da;
                padding: 10px;
                border-radius: 4px;
                margin: 10px 0;
            }

            .config-form {
                display: grid;
                gap: 10px;
            }
        `;
        document.head.appendChild(style);
    }

    private render(): void {
        this.container.innerHTML = `
            <div class="build-exploration">
                <h2>Build & Development Tools</h2>
                
                <section class="config-section">
                    <h3>Build Configuration</h3>
                    <form id="build-config" class="config-form">
                        <div>
                            <label>
                                <input type="radio" name="mode" value="development" 
                                    ${this.config.mode === 'development' ? 'checked' : ''}>
                                Development Mode
                            </label>
                            <label>
                                <input type="radio" name="mode" value="production"
                                    ${this.config.mode === 'production' ? 'checked' : ''}>
                                Production Mode
                            </label>
                        </div>
                        <label>
                            <input type="checkbox" name="sourceMap" 
                                ${this.config.sourceMap ? 'checked' : ''}>
                            Enable Source Maps
                        </label>
                        <label>
                            <input type="checkbox" name="minify" 
                                ${this.config.minify ? 'checked' : ''}>
                            Enable Minification
                        </label>
                    </form>
                    <button id="start-build">Start Build</button>
                </section>

                <section class="stats-section">
                    <h3>Build Statistics</h3>
                    <div id="build-stats"></div>
                </section>
            </div>
        `;
        this.updateBuildStats();
    }


}