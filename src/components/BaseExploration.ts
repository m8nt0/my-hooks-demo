export abstract class BaseExploration {
    protected container: HTMLElement;

    public constructor(containerId: string) {
        const container = document.getElementById(containerId);
        if (!container) throw new Error(`Container with id "${containerId}" not found`);
        this.container = container;
    }

    abstract initialize(): void;
    abstract cleanup(): void;
}