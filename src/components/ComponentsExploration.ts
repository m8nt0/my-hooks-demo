// ComponentsArchitecture.ts

// --- Component Interface Definitions ---
interface ComponentProps {
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

interface CompoundComponentProps extends ComponentProps {
    value: string;
    onChange: (value: string) => void;
}

// --- Base Component Class ---
abstract class BaseComponent<P extends ComponentProps = ComponentProps> {
    protected props: P;
    protected state: any;
    private mounted: boolean = false;

    constructor(props: P) {
        this.props = props;
        this.state = {};
    }

    protected setState(newState: Partial<typeof this.state>): void {
        this.state = { ...this.state, ...newState };
        if (this.mounted) {
            this.render();
        }
    }

    protected abstract render(): void;

    public mount(container: HTMLElement): void {
        this.mounted = true;
        this.render();
    }

    public unmount(): void {
        this.mounted = false;
    }
}

// --- Higher Order Component Pattern ---
function withLogging<T extends ComponentProps>(WrappedComponent: new (props: T) => BaseComponent<T>) {
    return class extends BaseComponent<T> {
        constructor(props: T) {
            super(props);
            console.log('Component constructed with props:', props);
        }

        protected render(): void {
            console.log('Component rendering');
            const component = new WrappedComponent(this.props);
            component.mount(document.createElement('div'));
        }
    };
}

// --- Compound Component Pattern ---
class Select extends BaseComponent<CompoundComponentProps> {
    private options: Array<{ value: string; label: string }> = [];

    public addOption(value: string, label: string): void {
        this.options.push({ value, label });
        this.render();
    }

    protected render(): void {
        const select = document.createElement('select');
        select.value = this.props.value;
        select.addEventListener('change', (e) => {
            this.props.onChange((e.target as HTMLSelectElement).value);
        });

        this.options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.label;
            select.appendChild(optionElement);
        });
    }
}

// --- Layout System ---
class Layout extends BaseComponent {
    private rows: Array<BaseComponent> = [];
    private columns: Array<BaseComponent> = [];
    private gap: number = 16;

    public addRow(component: BaseComponent): void {
        this.rows.push(component);
        this.render();
    }

    public addColumn(component: BaseComponent): void {
        this.columns.push(component);
        this.render();
    }

    public setGap(gap: number): void {
        this.gap = gap;
        this.render();
    }

    protected render(): void {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.flexDirection = this.rows.length > 0 ? 'column' : 'row';
        container.style.gap = `${this.gap}px`;

        const components = this.rows.length > 0 ? this.rows : this.columns;
        components.forEach(component => {
            const wrapper = document.createElement('div');
            component.mount(wrapper);
            container.appendChild(wrapper);
        });
    }
}

// --- Design System ---
class DesignSystem {
    private static instance: DesignSystem;
    private theme: Record<string, any> = {
        colors: {
            primary: '#007bff',
            secondary: '#6c757d',
            success: '#28a745',
            error: '#dc3545'
        },
        typography: {
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            sizes: {
                small: '0.875rem',
                medium: '1rem',
                large: '1.25rem'
            }
        },
        spacing: {
            small: '8px',
            medium: '16px',
            large: '24px'
        }
    };

    private constructor() {}

    public static getInstance(): DesignSystem {
        if (!DesignSystem.instance) {
            DesignSystem.instance = new DesignSystem();
        }
        return DesignSystem.instance;
    }

    public getTheme(): Record<string, any> {
        return { ...this.theme };
    }

    public setTheme(newTheme: Partial<Record<string, any>>): void {
        this.theme = { ...this.theme, ...newTheme };
    }

    public applyTheme(): void {
        const styles = document.createElement('style');
        styles.textContent = `
            :root {
                ${Object.entries(this.theme.colors)
                    .map(([key, value]) => `--color-${key}: ${value};`)
                    .join('\n')}
                
                ${Object.entries(this.theme.typography.sizes)
                    .map(([key, value]) => `--font-size-${key}: ${value};`)
                    .join('\n')}
                
                ${Object.entries(this.theme.spacing)
                    .map(([key, value]) => `--spacing-${key}: ${value};`)
                    .join('\n')}
                
                font-family: ${this.theme.typography.fontFamily};
            }
        `;
        document.head.appendChild(styles);
    }
}

// --- Micro-frontend Integration ---
class MicrofrontendContainer extends BaseComponent {
    private microApps: Map<string, BaseComponent> = new Map();

    public registerApp(name: string, app: BaseComponent): void {
        this.microApps.set(name, app);
    }

    public unregisterApp(name: string): void {
        this.microApps.delete(name);
    }

    protected render(): void {
        const container = document.createElement('div');
        this.microApps.forEach((app, name) => {
            const wrapper = document.createElement('div');
            wrapper.setAttribute('data-microfrontend', name);
            app.mount(wrapper);
            container.appendChild(wrapper);
        });
    }
}

export {
    BaseComponent,
    withLogging,
    Select,
    Layout,
    DesignSystem,
    MicrofrontendContainer,
    type ComponentProps,
    type CompoundComponentProps
};