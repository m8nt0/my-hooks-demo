import { BaseExploration } from './BaseExploration';

interface SecurityConfig {
    csrfToken: string;
    contentSecurityPolicy: boolean;
    xssProtection: boolean;
    httpsOnly: boolean;
}

interface SecurityVulnerability {
    type: 'XSS' | 'CSRF' | 'Injection' | 'Storage';
    severity: 'Low' | 'Medium' | 'High';
    description: string;
    timestamp: number;
}

export class SecurityExploration extends BaseExploration {
    
    private config: SecurityConfig = {
        csrfToken: crypto.randomUUID(),
        contentSecurityPolicy: true,
        xssProtection: true,
        httpsOnly: true
    };
    private vulnerabilities: SecurityVulnerability[] = [];

    constructor(containerId: string) {
        super(containerId);
        
        this.initialize();
    }

    public initialize(): void {
        this.setupSecurityHeaders();
        this.setupStyles();
        this.render();
        this.attachEventListeners();
    }

    private setupSecurityHeaders(): void {
        // Simulate security headers
        if (this.config.contentSecurityPolicy) {
            // In a real app, these would be HTTP headers
            console.info('Content-Security-Policy: default-src \'self\'; script-src \'self\'');
        }
        if (this.config.xssProtection) {
            console.info('X-XSS-Protection: 1; mode=block');
        }
    }

    private sanitizeInput(input: string): string {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    private validateFormData(data: FormData): boolean {
        const token = data.get('csrf-token');
        if (token !== this.config.csrfToken) {
            this.logVulnerability({
                type: 'CSRF',
                severity: 'High',
                description: 'Invalid CSRF token detected',
                timestamp: Date.now()
            });
            return false;
        }
        return true;
    }

    private simulateXSSAttack(input: string): void {
        const unsanitized = `<img src="x" onerror="alert('XSS')" />`;
        const sanitized = this.sanitizeInput(unsanitized);
        
        this.logVulnerability({
            type: 'XSS',
            severity: 'High',
            description: `Attempted XSS injection: ${input}`,
            timestamp: Date.now()
        });

        const demoElement = document.getElementById('xss-demo');
        if (demoElement) {
            demoElement.innerHTML = `
                <div>Original input: ${unsanitized}</div>
                <div>Sanitized input: ${sanitized}</div>
            `;
        }
    }

    private simulateStorageAttack(): void {
        const sensitiveData = {
            token: 'secret-token',
            userId: '12345'
        };

        // Demonstrate secure vs insecure storage
        localStorage.setItem('insecure-data', JSON.stringify(sensitiveData));
        
        // Secure storage simulation (in real apps, use encryption)
        const encryptedData = btoa(JSON.stringify(sensitiveData));
        sessionStorage.setItem('secure-data', encryptedData);

        this.logVulnerability({
            type: 'Storage',
            severity: 'Medium',
            description: 'Sensitive data storage detected',
            timestamp: Date.now()
        });
    }

    private logVulnerability(vulnerability: SecurityVulnerability): void {
        this.vulnerabilities.push(vulnerability);
        this.updateVulnerabilityLog();
    }

    private updateVulnerabilityLog(): void {
        const logElement = document.getElementById('vulnerability-log');
        if (!logElement) return;

        logElement.innerHTML = this.vulnerabilities
            .sort((a, b) => b.timestamp - a.timestamp)
            .map(vuln => `
                <div class="vulnerability-item ${vuln.severity.toLowerCase()}">
                    <div class="vuln-header">
                        <strong>${vuln.type}</strong>
                        <span class="severity">${vuln.severity}</span>
                    </div>
                    <div class="vuln-description">${vuln.description}</div>
                    <small>${new Date(vuln.timestamp).toLocaleString()}</small>
                </div>
            `).join('');
    }

    private attachEventListeners(): void {
        const securityForm = document.getElementById('security-form');
        securityForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const formData = new FormData(form);
            
            if (this.validateFormData(formData)) {
                const input = formData.get('user-input') as string;
                this.simulateXSSAttack(input);
            }
        });

        const storageButton = document.getElementById('storage-test');
        storageButton?.addEventListener('click', () => this.simulateStorageAttack());
    }

    private setupStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            .security-exploration {
                padding: 20px;
                max-width: 800px;
                margin: 0 auto;
            }

            .vulnerability-item {
                padding: 10px;
                margin: 5px 0;
                border-radius: 4px;
            }

            .vulnerability-item.high {
                background-color: #ffe6e6;
                border: 1px solid #ff9999;
            }

            .vulnerability-item.medium {
                background-color: #fff3e6;
                border: 1px solid #ffcc99;
            }

            .vulnerability-item.low {
                background-color: #e6ffe6;
                border: 1px solid #99ff99;
            }

            .vuln-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .severity {
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 0.8em;
                background: rgba(0, 0, 0, 0.1);
            }
        `;
        document.head.appendChild(style);
    }

    private render(): void {
        this.container.innerHTML = `
            <div class="security-exploration">
                <h2>Security Exploration</h2>
                
                <section class="security-demo">
                    <h3>Security Testing</h3>
                    <form id="security-form">
                        <input type="hidden" name="csrf-token" value="${this.config.csrfToken}">
                        <div>
                            <input 
                                type="text" 
                                name="user-input" 
                                placeholder="Enter text to test XSS protection"
                                required
                            >
                            <button type="submit">Test XSS Protection</button>
                        </div>
                    </form>
                    <div id="xss-demo"></div>
                    <button id="storage-test">Test Storage Security</button>
                </section>

                <section class="vulnerability-section">
                    <h3>Security Log</h3>
                    <div id="vulnerability-log"></div>
                </section>
            </div>
        `;
    }

    public cleanup(): void {
        sessionStorage.removeItem('secure-data');
        localStorage.removeItem('insecure-data');
    }
}