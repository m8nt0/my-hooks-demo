import { HooksExploration } from './components/HooksExploration';
import { BrowserAPIsExploration } from './components/BrowserAPIs';
import { SecurityExploration } from './components/SecurityExploration';
import { TestingExploration } from './components/TestingExploration';
import { BuildExploration } from './components/BuildExploration';
import { Router } from './components/ClientSideFeatures';
import { PerformanceMonitor, PerformanceOptimization } from './components/PerformanceOptimization';
import { BaseExploration } from './components/BaseExploration';


class App {
    private explorations: Map<string, BaseExploration> = new Map();
    private currentExploration: BaseExploration | null = null;
    private router: Router | null = null;
    private performanceMonitor: PerformanceMonitor;

    constructor() {
        this.performanceMonitor = PerformanceMonitor.getInstance();
        this.setupDOM();
        this.initializeExplorations();
        this.setupRouter();
        this.setupNavigation();
    }

    private setupDOM(): void {
        if (!document.getElementById('content')) {
            const content = document.createElement('div');
            content.id = 'content';
            document.body.appendChild(content);
        }

        if (!document.getElementById('nav')) {
            const nav = document.createElement('nav');
            nav.id = 'nav';
            document.body.insertBefore(nav, document.getElementById('content'));
        }
    }

    private initializeExplorations(): void {
        this.performanceMonitor.measureTime('initExplorations', () => {
            this.explorations.set('hooks', new HooksExploration('content'));
            this.explorations.set('browser-apis', new BrowserAPIsExploration('content'));
            this.explorations.set('security', new SecurityExploration('content'));
            this.explorations.set('testing', new TestingExploration('content'));
            this.explorations.set('build', new BuildExploration('content'));
            this.explorations.set('performance', new PerformanceOptimization('content'));
        });
    }

    private setupRouter(): void {
        this.router = new Router();
        
        this.explorations.forEach((_, key) => {
            this.router?.addRoute(`/${key}`, () => this.showExploration(key));
        });
    }

    private setupNavigation(): void {
        const nav = document.getElementById('nav');
        if (!nav) return;

        nav.innerHTML = Array.from(this.explorations.keys())
            .map(key => `
                <a href="/${key}" class="nav-link" data-path="${key}">
                    ${key.split('-').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                </a>
            `).join('');

        nav.addEventListener('click', (e) => {
            e.preventDefault();
            const link = (e.target as HTMLElement).closest('[data-path]');
            if (link) {
                const path = link.getAttribute('data-path');
                if (path) this.router?.navigate(`/${path}`);
            }
        });
    }

    private showExploration(key: string): void {
        if (this.currentExploration) {
            this.currentExploration.cleanup();
        }

        const exploration = this.explorations.get(key);
        if (exploration) {
            this.currentExploration = exploration;
            exploration.initialize();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});