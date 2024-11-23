import { BaseExploration } from './BaseExploration';

// Types
interface StorageData {
    key: string;
    value: unknown;
    timestamp: number;
}

interface ObserverCallbacks {
    onIntersection?: (entry: IntersectionObserverEntry) => void;
    onMutation?: (mutation: MutationRecord) => void;
    onResize?: (entry: ResizeObserverEntry) => void;
}

export class BrowserAPIsExploration extends BaseExploration {
    private storageData: Map<string, StorageData> = new Map();
    private observers: {
        intersection?: IntersectionObserver;
        mutation?: MutationObserver;
        resize?: ResizeObserver;
    } = {};

    constructor(containerId: string) {
        super(containerId);
        
        this.initialize();
    }

    public initialize(): void {
        this.setupStorage();
        this.setupObservers();
        this.render();
        this.setupEventListenersForStorage();
    }

    private setupStorage(): void {
        // Load existing data from localStorage
        try {
            const storedData = localStorage.getItem('browserApiDemo');
            if (storedData) {
                const parsedData = JSON.parse(storedData);
                Object.entries(parsedData).forEach(([key, value]) => {
                    this.storageData.set(key, value as StorageData);
                });
            }
        } catch (error) {
            console.error('Error loading storage data:', error);
        }
    }

    private setupObservers(): void {
        // Intersection Observer
        this.observers.intersection = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        this.dispatchCustomEvent('elementVisible', { entry });
                    }
                });
            },
            { threshold: 0.1 }
        );

        // Mutation Observer
        this.observers.mutation = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                this.dispatchCustomEvent('domMutation', { mutation });
            });
        });

        // Resize Observer
        this.observers.resize = new ResizeObserver((entries) => {
            entries.forEach(entry => {
                this.dispatchCustomEvent('elementResized', {
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                });
            });
        });
    }

    private dispatchCustomEvent(name: string, detail: unknown): void {
        const event = new CustomEvent(name, { detail });
        this.container.dispatchEvent(event);
    }

    private setupEventListenersForStorage(): void {
        // Storage form handling
        const storageForm = document.getElementById('storage-form');
        storageForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const key = (form.querySelector('#storage-key') as HTMLInputElement).value;
            const valueInput = form.querySelector('#storage-value') as HTMLInputElement;
            const value = isNaN(Number(valueInput.value)) ? 
                console.error('Invalid value') : 
                Number(valueInput.value);

            this.setStorageItem(key, value);
            form.reset();
            this.updateStorageDisplay();
        });

        // Observer demo element handling
        const observerDemo = document.getElementById('observer-demo');
        if (observerDemo) {
            this.observers.intersection?.observe(observerDemo);
            this.observers.mutation?.observe(observerDemo, {
                attributes: true,
                childList: true,
                characterData: true
            });
            this.observers.resize?.observe(observerDemo);
        }

        // Custom event logging
        ['elementVisible', 'domMutation', 'elementResized'].forEach(eventName => {
            this.container.addEventListener(eventName, (e: Event) => {
                const customEvent = e as CustomEvent;
                this.logEvent(eventName, customEvent.detail);
            });
        });
    }

    private setStorageItem(key: string, value: unknown): void {
        const storageData: StorageData = {
            key,
            value,
            timestamp: Date.now()
        };

        this.storageData.set(key, storageData);
        localStorage.setItem('browserApiDemo', 
            JSON.stringify(Object.fromEntries(this.storageData))
        );
    }

    private updateStorageDisplay(): void {
        const storageDisplay = document.getElementById('storage-display');
        if (!storageDisplay) return;

        storageDisplay.innerHTML = Array.from(this.storageData.values())
            .map(item => `
                <div class="storage-item">
                    <strong>${item.key}:</strong> ${JSON.stringify(item.value)}
                    <small>(${new Date(item.timestamp).toLocaleString()})</small>
                </div>
            `).join('');
    }

    private logEvent(name: string, detail: unknown): void {
        const eventLog = document.getElementById('event-log');
        if (!eventLog) return;

        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.innerHTML = `
            <strong>${name}</strong>: ${JSON.stringify(detail)}
            <small>${new Date().toLocaleTimeString()}</small>
        `;

        eventLog.prepend(logEntry);
        if (eventLog.children.length > 10) {
            eventLog.lastElementChild?.remove();
        }
    }

    private render(): void {
        this.container.innerHTML = 
        `
            <div class="browser-apis-demo">
                <section class="storage-section">
                    <h2>Web Storage Demo</h2>
                    <form id="storage-form">
                        <input type="text" id="storage-key" placeholder="Key" required>
                        <input type="text" id="storage-value" placeholder="Value" required>
                        <button type="submit">Save</button>
                    </form>
                    <div id="storage-display"></div>
                </section>

                <section class="observers-section">
                    <h2>Observers Demo</h2>
                    <div id="observer-demo" class="observer-demo">
                        <p>This element is being observed for:</p>
                        <ul>
                            <li>Visibility (Intersection Observer)</li>
                            <li>Size Changes (Resize Observer)</li>
                            <li>DOM Mutations (Mutation Observer)</li>
                        </ul>
                    </div>
                </section>

                <section class="events-section">
                    <h2>Event Log</h2>
                    <div id="event-log" class="event-log"></div>
                </section>
            </div>
        `;

        this.updateStorageDisplay();
    }

    public cleanup(): void {
        this.observers.intersection?.disconnect();
        this.observers.mutation?.disconnect();
        this.observers.resize?.disconnect();
    }
}