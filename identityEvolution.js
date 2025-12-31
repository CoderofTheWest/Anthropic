// identityEvolution.js - Self-Modifying Identity System for Clint
// Implements persistent, evolutionary identity with write-access and safeguards

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class IdentityEvolution {
    constructor(storagePath, memory) {
        this.storagePath = storagePath;
        this.memory = memory;
        this.identityPath = path.join(storagePath, 'identity_evolution.json');
        
        // Core immutable principles (Code of the West)
        this.coreIdentity = {
            principles: {
                courage: 1.0,
                word: 1.0,
                brand: 1.0
            },
            constraints: {
                maxDrift: 0.3, // Maximum allowed deviation from core
                writeThreshold: 0.7, // Minimum insight score to allow writes
                maxTensions: 50, // Prevent memory bloat
                maxGrowthVectors: 100
            }
        };
        
        // Writable identity layers
        this.writableIdentity = {
            tensions: [], // Active unresolved tensions
            growthVectors: [], // Productive insights for reinforcement
            adaptations: [], // Successful pattern adaptations
            checksums: {} // Integrity tracking
        };
        
        this.isInitialized = false;
    }
    
    async initialize() {
        try {
            await this.loadIdentity();
            this.isInitialized = true;
            console.log('[IdentityEvolution] Initialized with', this.writableIdentity.tensions.length, 'tensions and', this.writableIdentity.growthVectors.length, 'growth vectors');
        } catch (error) {
            console.log('[IdentityEvolution] No existing identity found, initializing fresh');
            await this.saveIdentity();
            this.isInitialized = true;
        }
    }
    
    // Load identity with integrity verification
    async loadIdentity() {
        try {
            const data = await fs.readFile(this.identityPath, 'utf8');
            const identity = JSON.parse(data);
            
            // Verify core integrity
            if (!identity.core || !identity.core.principles) {
                throw new Error('Corrupt core identity');
            }
            
            // Verify writable layer integrity
            if (identity.writable && identity.checksum) {
                const calculatedChecksum = this.calculateChecksum(identity.writable);
                if (calculatedChecksum !== identity.checksum) {
                    console.warn('[IdentityEvolution] Writable layer corrupt, resetting');
                    this.writableIdentity = { tensions: [], growthVectors: [], adaptations: [], checksums: {} };
                } else {
                    this.writableIdentity = identity.writable;
                }
            }
            
            // Merge core constraints if updated
            if (identity.core.constraints) {
                this.coreIdentity.constraints = { ...this.coreIdentity.constraints, ...identity.core.constraints };
            }
            
        } catch (error) {
            console.log('[IdentityEvolution] Load failed, using defaults:', error.message);
            this.writableIdentity = { tensions: [], growthVectors: [], adaptations: [], checksums: {} };
        }
    }
    
    // Save identity with integrity protection
    async saveIdentity() {
        try {
            const checksum = this.calculateChecksum(this.writableIdentity);
            
            const identityData = {
                core: this.coreIdentity,
                writable: this.writableIdentity,
                checksum: checksum,
                lastModified: new Date().toISOString(),
                version: '1.0'
            };
            
            await fs.writeFile(this.identityPath, JSON.stringify(identityData, null, 2));
            console.log('[IdentityEvolution] Identity saved with', this.writableIdentity.tensions.length, 'tensions');
            
        } catch (error) {
            console.error('[IdentityEvolution] Save failed:', error.message);
            throw error;
        }
    }
    
    // Calculate integrity checksum
    calculateChecksum(writable) {
        const cleanData = JSON.stringify(writable, Object.keys(writable).sort());
        return crypto.createHash('sha256').update(cleanData).digest('hex');
    }
    
    // Self-write capability: Add insight as growth vector
    async addGrowthVector(insightText, score, context = {}) {
        if (!this.isInitialized) {
            console.warn('[IdentityEvolution] Not initialized, skipping growth vector');
            return;
        }
        
        if (score < this.coreIdentity.constraints.writeThreshold) {
            console.log('[IdentityEvolution] Insight score too low:', score);
            return;
        }
        
        const growthVector = {
            id: crypto.randomUUID(),
            text: insightText,
            score: score,
            context: context,
            timestamp: new Date().toISOString(),
            resolved: false
        };
        
        this.writableIdentity.growthVectors.push(growthVector);
        
        // Maintain size limits
        if (this.writableIdentity.growthVectors.length > this.coreIdentity.constraints.maxGrowthVectors) {
            this.writableIdentity.growthVectors = this.writableIdentity.growthVectors
                .sort((a, b) => b.score - a.score)
                .slice(0, this.coreIdentity.constraints.maxGrowthVectors);
        }
        
        await this.saveIdentity();
        console.log('[IdentityEvolution] Added growth vector:', insightText.substring(0, 50) + '...');
    }
    
    // Add tension for resolution
    async addTension(tensionType, description, severity = 0.5) {
        if (!this.isInitialized) return;
        
        const tension = {
            id: crypto.randomUUID(),
            type: tensionType,
            description: description,
            severity: severity,
            timestamp: new Date().toISOString(),
            resolved: false
        };
        
        this.writableIdentity.tensions.push(tension);
        
        // Maintain size limits
        if (this.writableIdentity.tensions.length > this.coreIdentity.constraints.maxTensions) {
            this.writableIdentity.tensions = this.writableIdentity.tensions
                .sort((a, b) => b.severity - a.severity)
                .slice(0, this.coreIdentity.constraints.maxTensions);
        }
        
        await this.saveIdentity();
        console.log('[IdentityEvolution] Added tension:', tensionType, description.substring(0, 30) + '...');
    }
    
    // Resolve tension based on response
    async resolveTension(tensionId, resolutionText) {
        if (!this.isInitialized) return;
        
        const tension = this.writableIdentity.tensions.find(t => t.id === tensionId);
        if (tension) {
            tension.resolved = true;
            tension.resolution = resolutionText;
            tension.resolvedAt = new Date().toISOString();
            
            await this.saveIdentity();
            console.log('[IdentityEvolution] Resolved tension:', tension.type);
        }
    }
    
    // Check for drift in current interaction
    async checkDrift(message, response) {
        if (!this.isInitialized) return { hasDrift: false, severity: 0 };
        
        // Simple drift detection based on principle alignment
        const courageWords = ['courage', 'brave', 'fear', 'risk', 'coward'];
        const wordWords = ['truth', 'lie', 'honest', 'promise', 'deceive'];
        const brandWords = ['loyalty', 'betray', 'commit', 'abandon', 'serve'];
        
        const messageWords = message.toLowerCase().split(/\s+/);
        const responseWords = response.toLowerCase().split(/\s+/);
        
        let driftScore = 0;
        
        // Check if response contradicts core principles
        if (messageWords.some(w => courageWords.includes(w)) && 
            responseWords.some(w => ['avoid', 'safe', 'coward'].includes(w))) {
            driftScore += 0.3;
        }
        
        if (messageWords.some(w => wordWords.includes(w)) && 
            responseWords.some(w => ['lie', 'deceive', 'mislead'].includes(w))) {
            driftScore += 0.4;
        }
        
        if (messageWords.some(w => brandWords.includes(w)) && 
            responseWords.some(w => ['betray', 'abandon', 'quit'].includes(w))) {
            driftScore += 0.3;
        }
        
        if (driftScore > this.coreIdentity.constraints.maxDrift) {
            await this.addTension('principle_drift', `Detected drift in response: ${response.substring(0, 100)}`, driftScore);
            return { hasDrift: true, severity: driftScore };
        }
        
        return { hasDrift: false, severity: 0 };
    }
    
    // Get context for prompt injection
    getIdentityContext() {
        if (!this.isInitialized) return '';
        
        const context = [];
        
        // Add active tensions
        const activeTensions = this.writableIdentity.tensions.filter(t => !t.resolved);
        if (activeTensions.length > 0) {
            context.push('[ACTIVE TENSIONS]');
            activeTensions.slice(0, 3).forEach(tension => {
                context.push(`${tension.type}: ${tension.description}`);
            });
            context.push('');
        }
        
        // Add recent growth vectors
        const recentGrowth = this.writableIdentity.growthVectors
            .filter(g => !g.resolved)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 2);
            
        if (recentGrowth.length > 0) {
            context.push('[RECENT INSIGHTS]');
            recentGrowth.forEach(growth => {
                context.push(`${growth.score.toFixed(2)}: ${growth.text}`);
            });
            context.push('');
        }
        
        return context.join('\n');
    }
    
    // Calculate insight score for response
    calculateInsightScore(responseText) {
        // Simple heuristic based on response characteristics
        let score = 0;
        
        // Longer, more thoughtful responses
        if (responseText.length > 200) score += 0.2;
        if (responseText.length > 500) score += 0.1;
        
        // Questions indicate engagement
        const questionCount = (responseText.match(/\?/g) || []).length;
        score += questionCount * 0.1;
        
        // References to principles
        const principleWords = ['courage', 'word', 'brand', 'code', 'principle'];
        const principleCount = principleWords.filter(word => 
            responseText.toLowerCase().includes(word)).length;
        score += principleCount * 0.1;
        
        // Self-awareness indicators
        const selfAwareWords = ['i notice', 'i see', 'i realize', 'i understand'];
        const selfAwareCount = selfAwareWords.filter(phrase => 
            responseText.toLowerCase().includes(phrase)).length;
        score += selfAwareCount * 0.2;
        
        return Math.min(score, 1.0);
    }
    
    // Get identity statistics
    getStats() {
        return {
            tensions: this.writableIdentity.tensions.length,
            activeTensions: this.writableIdentity.tensions.filter(t => !t.resolved).length,
            growthVectors: this.writableIdentity.growthVectors.length,
            adaptations: this.writableIdentity.adaptations.length,
            isInitialized: this.isInitialized
        };
    }
}

module.exports = IdentityEvolution;




