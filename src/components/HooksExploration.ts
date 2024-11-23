import { BaseExploration } from './BaseExploration';

// Types
interface Todo {
    id: number;
    text: string;
    completed: boolean;
}

interface Theme {
    isDark: boolean;
}

interface WindowSize {
    width: number;
    height: number;
}

type Subscriber = () => void;

// Base State Manager
class StateManager<T> {
    protected state: T;
    private subscribers: Subscriber[] = [];

    constructor(initialState: T) {
        this.state = initialState;
    }

    subscribe(callback: Subscriber): () => void {
        this.subscribers.push(callback);
        return () => {
            this.subscribers = this.subscribers.filter(sub => sub !== callback);
        };
    }

    protected notify(): void {
        this.subscribers.forEach(callback => callback());
    }
}

// Theme Manager
class ThemeManager extends StateManager<Theme> {
    constructor() {
        super({ isDark: false });
    }

    toggleTheme(): void {
        this.state = { isDark: !this.state.isDark };
        this.notify();
    }

    getTheme(): Theme {
        return this.state;
    }
}

// Todo Manager
class TodoManager extends StateManager<Todo[]> {
    private nextId: number = 1;

    constructor() {
        super([]);
    }

    addTodo(text: string): void {
        this.state = [...this.state, { id: this.nextId++, text, completed: false }];
        this.notify();
    }

    toggleTodo(id: number): void {
        this.state = this.state.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        );
        this.notify();
    }

    deleteTodo(id: number): void {
        this.state = this.state.filter(todo => todo.id !== id);
        this.notify();
    }

    getTodos(): Todo[] {
        return this.state;
    }
}

// Window Size Manager
class WindowSizeManager extends StateManager<WindowSize> {
    private resizeHandler: () => void;

    constructor() {
        super({
            width: window.innerWidth,
            height: window.innerHeight
        });

        this.resizeHandler = this.handleResize.bind(this);
        window.addEventListener('resize', this.resizeHandler);
    }

    private handleResize(): void {
        this.state = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        this.notify();
    }

    getSize(): WindowSize {
        return this.state;
    }

    cleanup(): void {
        window.removeEventListener('resize', this.resizeHandler);
    }
}

// Main Class
export class HooksExploration extends BaseExploration {
    private themeManager: ThemeManager;
    private todoManager: TodoManager;
    private windowSizeManager: WindowSizeManager;

    constructor(containerId: string = 'root') {
        super(containerId);

        this.themeManager = new ThemeManager();
        this.todoManager = new TodoManager();
        this.windowSizeManager = new WindowSizeManager();

        this.initialize();
    }

    public initialize(): void {
        this.setupDOM();
        this.setupSubscriptions();
        this.render();
    }

    private setupDOM(): void {
        const styleSheet = document.createElement('style');
        styleSheet.textContent = this.getStyles();
        document.head.appendChild(styleSheet);
        this.container!.className = 'hooks-exploration';
    }

    private setupSubscriptions(): void {
        this.themeManager.subscribe(() => this.render());
        this.todoManager.subscribe(() => this.renderTodoList());
        this.windowSizeManager.subscribe(() => this.renderWindowSize());
    }

    private attachEventListeners(): void {
        const themeToggle = document.getElementById('theme-toggle');
        const todoForm = document.getElementById('todo-form');
        const todoList = document.getElementById('todo-list');

        themeToggle?.addEventListener('click', () => {
            this.themeManager.toggleTheme();
        });

        todoForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('todo-input') as HTMLInputElement;
            if (input.value.trim()) {
                this.todoManager.addTodo(input.value.trim());
                input.value = '';
            }
        });

        todoList?.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const todoId = target.closest('.todo-item')?.getAttribute('data-id');
            
            if (todoId) {
                if (target.classList.contains('todo-toggle')) {
                    this.todoManager.toggleTodo(Number(todoId));
                } else if (target.classList.contains('todo-delete')) {
                    this.todoManager.deleteTodo(Number(todoId));
                }
            }
        });
    }

    private renderTodoList(): void {
        const todoList = document.getElementById('todo-list');
        const todoStats = document.getElementById('todo-stats');
        if (!todoList || !todoStats) return;

        const todos = this.todoManager.getTodos();
        
        todoList.innerHTML = todos.map(todo => `
            <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <span class="todo-text">${todo.text}</span>
                <div class="todo-actions">
                    <button class="todo-toggle">${todo.completed ? 'Undo' : 'Complete'}</button>
                    <button class="todo-delete">Delete</button>
                </div>
            </li>
        `).join('');

        const completedCount = todos.filter(todo => todo.completed).length;
        todoStats.textContent = `${completedCount} of ${todos.length} tasks completed`;
    }

    private renderWindowSize(): void {
        const windowSizeElement = document.getElementById('window-size');
        if (!windowSizeElement) return;

        const size = this.windowSizeManager.getSize();
        windowSizeElement.textContent = `Window Size: ${size.width}px × ${size.height}px`;
    }

    private getStyles(): string {
        return `
            .hooks-exploration {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                min-height: 100vh;
                transition: all 0.3s ease;
            }

            .dark-theme { background-color: #1a1a1a; color: #ffffff; }
            .light-theme { background-color: #ffffff; color: #000000; }

            .todo-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px;
                margin: 4px 0;
                border-radius: 4px;
                background-color: rgba(0, 0, 0, 0.1);
            }

            .todo-item.completed .todo-text {
                text-decoration: line-through;
                opacity: 0.7;
            }

            .window-size {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 8px;
                border-radius: 4px;
                background-color: rgba(0, 0, 0, 0.1);
            }

            button {
                padding: 4px 8px;
                margin: 0 4px;
                border-radius: 4px;
                border: 1px solid currentColor;
                background: transparent;
                color: inherit;
                cursor: pointer;
            }

            button:hover {
                opacity: 0.8;
            }

            .todo-form {
                display: flex;
                gap: 8px;
                margin-bottom: 16px;
            }

            .todo-input {
                flex: 1;
                padding: 8px;
                border-radius: 4px;
                border: 1px solid currentColor;
                background: transparent;
                color: inherit;
            }
        `;
    }

    private render(): void {
        if (!this.container) return;

        const theme = this.themeManager.getTheme();
        this.container.className = `hooks-exploration ${theme.isDark ? 'dark-theme' : 'light-theme'}`;
        
        this.container.innerHTML = `
            <div class="app-container">
                <header class="app-header">
                    <h1>TypeScript Hooks Exploration</h1>
                    <button id="theme-toggle">Toggle Theme</button>
                </header>

                <main class="app-main">
                    <section class="todo-section">
                        <h2>Todo List</h2>
                        <div class="todo-container">
                            <form id="todo-form" class="todo-form">
                                <input 
                                    type="text" 
                                    id="todo-input" 
                                    placeholder="What needs to be done?"
                                    class="todo-input"
                                >
                                <button type="submit">Add Todo</button>
                            </form>
                            <ul id="todo-list" class="todo-list"></ul>
                            <div id="todo-stats" class="todo-stats"></div>
                        </div>
                    </section>

                    <section class="window-size-section">
                        <div id="window-size" class="window-size"></div>
                    </section>
                </main>
            </div>
        `;

        this.attachEventListeners();
        this.renderTodoList();
        this.renderWindowSize();
    }

    public cleanup(): void {
        this.windowSizeManager.cleanup();
    }
}