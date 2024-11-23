import { BaseExploration } from './BaseExploration';

interface TestCase {
    name: string;
    fn: () => void | Promise<void>;
    async?: boolean;
}

interface TestSuite {
    name: string;
    tests: TestCase[];
}

interface TestResult {
    suiteName: string;
    testName: string;
    passed: boolean;
    error?: Error;
    duration: number;
}

export class TestingExploration extends BaseExploration {
    private testSuites: TestSuite[] = [];
    private results: TestResult[] = [];

    constructor(containerId: string) {
        super(containerId);
        this.initialize();
        this.setupExampleTests();
    }

    public initialize(): void {
        this.setupStyles();
        this.render();
        this.attachEventListeners();
    }

    // public cleanup(): void {
    //     localStorage.removeItem('test-key');
    // }

    private setupExampleTests(): void {
        // DOM Testing Suite
        this.addTestSuite('DOM Testing', [
            {
                name: 'Should create and append element',
                fn: () => {
                    const div = document.createElement('div');
                    div.id = 'test-div';
                    document.body.appendChild(div);
                    const element = document.getElementById('test-div');
                    if (!element) throw new Error('Element not found');
                    document.body.removeChild(div);
                }
            },
            {
                name: 'Should handle event listeners',
                fn: () => {
                    let clicked = false;
                    const button = document.createElement('button');
                    button.addEventListener('click', () => clicked = true);
                    button.click();
                    if (!clicked) throw new Error('Event not handled');
                }
            }
        ]);

        // Async Testing Suite
        this.addTestSuite('Async Testing', [
            {
                name: 'Should handle promises',
                fn: async () => {
                    const result = await Promise.resolve(42);
                    if (result !== 42) throw new Error('Promise resolution failed');
                },
                async: true
            },
            {
                name: 'Should handle timeouts',
                fn: () => new Promise<void>(resolve => {
                    setTimeout(() => resolve(), 100);
                }),
                async: true
            }
        ]);

        // Integration Testing Suite
        this.addTestSuite('Integration Testing', [
            {
                name: 'Should integrate with localStorage',
                fn: () => {
                    localStorage.setItem('test-key', 'test-value');
                    const value = localStorage.getItem('test-key');
                    if (value !== 'test-value') throw new Error('Storage integration failed');
                    localStorage.removeItem('test-key');
                }
            }
        ]);
    }

    public addTestSuite(name: string, tests: TestCase[]): void {
        this.testSuites.push({ name, tests });
        this.updateTestList();
    }

    private async runTest(suite: TestSuite, test: TestCase): Promise<TestResult> {
        const startTime = performance.now();
        try {
            if (test.async) {
                await test.fn();
            } else {
                test.fn();
            }
            return {
                suiteName: suite.name,
                testName: test.name,
                passed: true,
                duration: performance.now() - startTime
            };
        } catch (error) {
            return {
                suiteName: suite.name,
                testName: test.name,
                passed: false,
                error: error as Error,
                duration: performance.now() - startTime
            };
        }
    }

    private async runAllTests(): Promise<void> {
        this.results = [];
        for (const suite of this.testSuites) {
            for (const test of suite.tests) {
                const result = await this.runTest(suite, test);
                this.results.push(result);
                this.updateResults();
            }
        }
    }

    private updateTestList(): void {
        const testList = document.getElementById('test-list');
        if (!testList) return;

        testList.innerHTML = this.testSuites.map(suite => `
            <div class="test-suite">
                <h3>${suite.name}</h3>
                <ul>
                    ${suite.tests.map(test => `
                        <li>${test.name}</li>
                    `).join('')}
                </ul>
            </div>
        `).join('');
    }

    private updateResults(): void {
        const resultsList = document.getElementById('test-results');
        if (!resultsList) return;

        resultsList.innerHTML = this.results.map(result => `
            <div class="test-result ${result.passed ? 'passed' : 'failed'}">
                <div class="result-header">
                    <span class="suite-name">${result.suiteName}</span>
                    <span class="test-name">${result.testName}</span>
                </div>
                <div class="result-details">
                    <span class="status">${result.passed ? '✓ Passed' : '✗ Failed'}</span>
                    <span class="duration">${result.duration.toFixed(2)}ms</span>
                </div>
                ${result.error ? `
                    <div class="error-message">
                        ${result.error.message}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    private setupStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            .testing-exploration {
                padding: 20px;
                max-width: 800px;
                margin: 0 auto;
            }

            .test-suite {
                margin-bottom: 20px;
            }

            .test-result {
                padding: 10px;
                margin: 5px 0;
                border-radius: 4px;
            }

            .test-result.passed {
                background-color: #e6ffe6;
                border: 1px solid #99ff99;
            }

            .test-result.failed {
                background-color: #ffe6e6;
                border: 1px solid #ff9999;
            }

            .result-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
            }

            .error-message {
                margin-top: 5px;
                color: #ff0000;
                font-family: monospace;
            }
        `;
        document.head.appendChild(style);
    }

    private attachEventListeners(): void {
        const runButton = document.getElementById('run-tests');
        runButton?.addEventListener('click', () => this.runAllTests());
    }

    private render(): void {
        this.container.innerHTML = `
            <div class="testing-exploration">
                <h2>Testing Exploration</h2>
                <button id="run-tests">Run All Tests</button>
                <div id="test-list"></div>
                <div id="test-results"></div>
            </div>
        `;
        this.updateTestList();
    }

    public cleanup(): void {
        // Cleanup any test artifacts
        localStorage.removeItem('test-key');
    }
}