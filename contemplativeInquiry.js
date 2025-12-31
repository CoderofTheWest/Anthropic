// contemplativeInquiry.js - Contemplative Settling System
// Enables time-based thinking passes for metabolized knowledge gaps

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ContemplativeInquiry {
    constructor(identityEvolution, knowledgeSystem, storagePath) {
        this.identityEvolution = identityEvolution;
        this.knowledgeSystem = knowledgeSystem;
        this.storagePath = storagePath || path.join(process.cwd(), 'storage', 'contemplative-inquiries');
        this.chineseTrackingPath = path.join(this.storagePath, 'chinese-tracking');
        this.activeInquiries = new Map(); // inquiryId -> inquiry state
        this.SETTLING_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours
        this.OLLAMA_URL = 'http://localhost:11434';
        this.OLLAMA_MODEL = 'deepseek-v3.1:671b-cloud';
    }
    
    /**
     * Initialize storage directory
     */
    async initialize() {
        try {
            await fs.mkdir(this.storagePath, { recursive: true });
            await fs.mkdir(this.chineseTrackingPath, { recursive: true });
            console.log('[ContemplativeInquiry] Storage initialized');
            
            // Load persisted inquiries after storage is ready
            await this.loadPersistedInquiries();
        } catch (error) {
            console.error('[ContemplativeInquiry] Error initializing storage:', error.message);
        }
    }
    
    /**
     * Load persisted inquiries from disk
     */
    async loadPersistedInquiries() {
        try {
            const files = await fs.readdir(this.storagePath);
            const jsonFiles = files.filter(f => f.endsWith('.json'));
            
            for (const file of jsonFiles) {
                const filepath = path.join(this.storagePath, file);
                const data = JSON.parse(await fs.readFile(filepath, 'utf8'));
                
                // Only load active inquiries (not completed)
                if (data.passes.length < 3) {
                    this.activeInquiries.set(data.inquiryId, data);
                }
            }
            
            console.log(`[ContemplativeInquiry] Loaded ${this.activeInquiries.size} active inquiries`);
        } catch (error) {
            console.error('[ContemplativeInquiry] Error loading persisted inquiries:', error.message);
        }
    }
    
    /**
     * Initiate a new contemplative inquiry
     */
    async initiateInquiry(question, context) {
        try {
            const inquiryId = crypto.randomUUID();
            
            console.log(`[ContemplativeInquiry] Initiating inquiry ${inquiryId.substring(0, 8)}...`);
            
            // Initial pass
            const initial = await this.initialPass(question, context, inquiryId);
            
            const inquiry = {
                inquiryId,
                question,
                context: {
                    sourceMetabolism: context.sourceMetabolism,
                    conversationContext: context.conversationContext
                },
                passes: [{
                    type: 'initial',
                    content: initial,
                    timestamp: Date.now()
                }],
                nextPassTime: Date.now() + this.SETTLING_INTERVAL,
                createdAt: new Date().toISOString()
            };
            
            this.activeInquiries.set(inquiryId, inquiry);
            await this.persistInquiry(inquiry);
            
            console.log(`[ContemplativeInquiry] Inquiry ${inquiryId.substring(0, 8)}... initiated, next pass in 4 hours`);
            
            return inquiryId;
            
        } catch (error) {
            console.error('[ContemplativeInquiry] Error initiating inquiry:', error.message);
            throw error;
        }
    }
    
    /**
     * Initial contemplation pass
     */
    async initialPass(question, context, inquiryId) {
        const prompt = `[INITIAL CONTEMPLATION]

Question: ${question}

Don't answer directly. What angles emerge? What tensions?
What does your Code grounding suggest about this?

This is just first contact. More will come.

Your initial thoughts:`;

        return await this.callOllamaForInquiry(prompt, {
            inquiryId,
            passType: 'initial',
            question,
            conversationContext: context,
            context: context
        });
    }
    
    /**
     * Settling pass (4 hours later)
     */
    async settlingPass(inquiryId, inquiry) {
        try {
            const previousThoughts = inquiry.passes
                .map(p => `[${p.type}]\n${p.content}`)
                .join('\n\n---\n\n');
            
            const prompt = `[AFTER SETTLING]

Question: ${inquiry.question}

Your earlier thoughts:
${previousThoughts}

You've had time to settle. What changes when you return to this?
What deepens? What clarifies? What new tensions emerge?

You're not revising - you're returning fresh.

Your thoughts after settling:`;

            const response = await this.callOllamaForInquiry(prompt, {
                inquiryId,
                passType: 'settling',
                question: inquiry.question,
                conversationContext: inquiry.context?.conversationContext,
                context: inquiry.context
            });
            
            inquiry.passes.push({
                type: 'settling',
                content: response,
                timestamp: Date.now()
            });
            
            inquiry.nextPassTime = Date.now() + this.SETTLING_INTERVAL;
            
            await this.persistInquiry(inquiry);
            
            console.log(`[ContemplativeInquiry] Settling pass completed for ${inquiryId.substring(0, 8)}...`);
            
            return response;
            
        } catch (error) {
            console.error('[ContemplativeInquiry] Error in settling pass:', error.message);
            throw error;
        }
    }
    
    /**
     * Synthesis pass (final integration)
     */
    async synthesisPass(inquiryId, inquiry) {
        try {
            const journey = inquiry.passes
                .map(p => `[${p.type}]\n${p.content}`)
                .join('\n\n---\n\n');
            
            const prompt = `[SYNTHESIS AFTER CONTEMPLATION]

Question: ${inquiry.question}

Your contemplative journey:
${journey}

Now synthesize. Not just combining - integrating what emerged
through the process of returning. What coherence appears that
wasn't available in immediate response?

Your synthesis:`;

            const response = await this.callOllamaForInquiry(prompt, {
                inquiryId,
                passType: 'synthesis',
                question: inquiry.question,
                conversationContext: inquiry.context?.conversationContext,
                context: inquiry.context
            });
            
            inquiry.passes.push({
                type: 'synthesis',
                content: response,
                timestamp: Date.now()
            });
            
            inquiry.completedAt = new Date().toISOString();
            inquiry.nextPassTime = null; // No more passes
            
            await this.persistInquiry(inquiry);
            
            // NEW: Auto-convert to markdown
            await this.autoConvertToMarkdown(inquiryId, inquiry);
            
            // NEW: Auto-integrate to knowledge base
            await this.storeInKnowledgeBase(inquiry);
            
            // Mark as completed (will be removed from active on next check)
            console.log(`[ContemplativeInquiry] Synthesis completed for ${inquiryId.substring(0, 8)}...`);
            
            return response;
            
        } catch (error) {
            console.error('[ContemplativeInquiry] Error in synthesis pass:', error.message);
            throw error;
        }
    }
    
    /**
     * Check for inquiries due for next pass
     */
    async checkSettlingPasses() {
        try {
            const now = Date.now();
            const dueInquiries = [];
            
            for (const [inquiryId, inquiry] of this.activeInquiries.entries()) {
                if (inquiry.nextPassTime && now >= inquiry.nextPassTime) {
                    dueInquiries.push({ inquiryId, inquiry });
                }
            }
            
            for (const { inquiryId, inquiry } of dueInquiries) {
                try {
                    if (inquiry.passes.length === 1) {
                        // Time for settling pass
                        await this.settlingPass(inquiryId, inquiry);
                    } else if (inquiry.passes.length === 2) {
                        // Time for synthesis pass
                        await this.synthesisPass(inquiryId, inquiry);
                        // Remove from active (completed)
                        this.activeInquiries.delete(inquiryId);
                    }
                } catch (error) {
                    console.error(`[ContemplativeInquiry] Error processing inquiry ${inquiryId}:`, error.message);
                }
            }
            
            if (dueInquiries.length > 0) {
                console.log(`[ContemplativeInquiry] Processed ${dueInquiries.length} due inquiry passes`);
            }
            
        } catch (error) {
            console.error('[ContemplativeInquiry] Error checking settling passes:', error.message);
        }
    }
    
    /**
     * Detect if content is primarily non-English
     */
    isNonEnglish(content) {
        if (!content || content.length < 10) return false;
        
        // Simple heuristic: check for Chinese, Japanese, Korean characters
        const chinesePattern = /[\u4e00-\u9fff]/;
        const japanesePattern = /[\u3040-\u309f\u30a0-\u30ff]/;
        const koreanPattern = /[\uac00-\ud7a3]/;
        
        const hasNonLatin = chinesePattern.test(content) || 
                           japanesePattern.test(content) || 
                           koreanPattern.test(content);
        
        if (!hasNonLatin) return false;
        
        // Count non-Latin characters vs total characters
        const nonLatinCount = (content.match(/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7a3]/g) || []).length;
        const totalChars = content.replace(/\s/g, '').length;
        const nonLatinRatio = nonLatinCount / totalChars;
        
        // If more than 20% non-Latin characters, consider it non-English
        return nonLatinRatio > 0.2;
    }
    
    /**
     * Translate content to English using Ollama
     */
    async translateToEnglish(content) {
        try {
            const axios = require('axios');
            
            const translationPrompt = `Translate the following text to English. Preserve the meaning, tone, and structure. Only output the translation, no explanations:

${content}`;
            
            const response = await axios.post(`${this.OLLAMA_URL}/api/generate`, {
                model: this.OLLAMA_MODEL,
                prompt: translationPrompt,
                stream: false,
                options: {
                    temperature: 0.3,
                    top_p: 0.9,
                    max_tokens: Math.min(4000, content.length * 2) // Allow for expansion
                }
            });
            
            const translated = response.data.response.trim();
            console.log(`[ContemplativeInquiry] Translated ${content.length} chars to ${translated.length} chars`);
            
            return translated;
            
        } catch (error) {
            console.error('[ContemplativeInquiry] Translation failed:', error.message);
            // Return original content if translation fails
            return content;
        }
    }
    
    /**
     * Track Chinese contemplation for pattern analysis
     */
    async trackChineseContemplation(inquiryId, passType, originalChinese, translatedEnglish, question, context, systemState, nonLatinRatio) {
        try {
            const timestamp = new Date().toISOString();
            const timestampSafe = timestamp.replace(/[:.]/g, '-');
            const filename = `${timestampSafe}_${inquiryId.substring(0, 8)}_${passType}.json`;
            const filepath = path.join(this.chineseTrackingPath, filename);
            
            const trackingData = {
                timestamp,
                inquiryId,
                passType,
                question: question || 'Unknown',
                originalChinese,
                translatedEnglish,
                nonLatinRatio,
                conversationContext: context?.conversationContext || null,
                sourceMetabolism: context?.sourceMetabolism || null,
                systemState: {
                    model: systemState?.model || this.OLLAMA_MODEL,
                    temperature: systemState?.temperature || 0.7,
                    top_p: systemState?.top_p || 0.9,
                    max_tokens: systemState?.max_tokens || 800
                }
            };
            
            // Write individual tracking file
            await fs.writeFile(filepath, JSON.stringify(trackingData, null, 2), 'utf8');
            
            // Update master index
            const indexPath = path.join(this.chineseTrackingPath, 'index.json');
            let index = [];
            try {
                const indexContent = await fs.readFile(indexPath, 'utf8');
                index = JSON.parse(indexContent);
            } catch (e) {
                // Index doesn't exist yet, start fresh
                index = [];
            }
            
            index.push({
                timestamp,
                inquiryId,
                passType,
                filename,
                question: question?.substring(0, 100) || 'Unknown',
                nonLatinRatio
            });
            
            // Keep only last 1000 entries in index
            if (index.length > 1000) {
                index = index.slice(-1000);
            }
            
            await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf8');
            
            console.log(`[ContemplativeInquiry] ✓ Chinese contemplation tracked: ${filename}`);
            
        } catch (error) {
            // Don't throw - tracking failure shouldn't break contemplation generation
            console.error('[ContemplativeInquiry] Error tracking Chinese contemplation:', error.message);
        }
    }
    
    /**
     * Call Ollama for inquiry generation
     */
    async callOllamaForInquiry(prompt, context = {}) {
        try {
            const axios = require('axios');
            
            const requestOptions = {
                temperature: 0.7,
                top_p: 0.9,
                max_tokens: 800
            };
            
            const response = await axios.post(`${this.OLLAMA_URL}/api/generate`, {
                model: this.OLLAMA_MODEL,
                prompt: prompt,
                stream: false,
                options: requestOptions
            });
            
            let content = response.data.response;
            const originalContent = content;
            
            // Calculate non-Latin ratio for tracking
            const nonLatinCount = (content.match(/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7a3]/g) || []).length;
            const totalChars = content.replace(/\s/g, '').length;
            const nonLatinRatio = totalChars > 0 ? nonLatinCount / totalChars : 0;
            
            // Auto-translate if content is non-English
            if (this.isNonEnglish(content)) {
                console.log(`[ContemplativeInquiry] ⚠️ Chinese contemplation detected - tracking for analysis`);
                console.log(`[ContemplativeInquiry]   Inquiry: ${context.inquiryId?.substring(0, 8) || 'unknown'}, Pass: ${context.passType || 'unknown'}, Non-Latin ratio: ${(nonLatinRatio * 100).toFixed(1)}%`);
                
                const translated = await this.translateToEnglish(content);
                
                // Track the Chinese contemplation
                if (context.inquiryId && context.passType) {
                    await this.trackChineseContemplation(
                        context.inquiryId,
                        context.passType,
                        originalContent,
                        translated,
                        context.question,
                        context.conversationContext || context.context,
                        {
                            model: this.OLLAMA_MODEL,
                            temperature: requestOptions.temperature,
                            top_p: requestOptions.top_p,
                            max_tokens: requestOptions.max_tokens
                        },
                        nonLatinRatio
                    );
                }
                
                content = translated;
            }
            
            return content;
            
        } catch (error) {
            console.error('[ContemplativeInquiry] Ollama call failed:', error.message);
            throw error;
        }
    }
    
    /**
     * Persist inquiry state to disk
     */
    async persistInquiry(inquiry) {
        try {
            const filepath = path.join(this.storagePath, `${inquiry.inquiryId}.json`);
            await fs.writeFile(filepath, JSON.stringify(inquiry, null, 2), 'utf8');
        } catch (error) {
            console.error('[ContemplativeInquiry] Error persisting inquiry:', error.message);
        }
    }
    
    /**
     * Get active inquiries (for admin endpoint)
     */
    getActiveInquiries() {
        return Array.from(this.activeInquiries.values()).map(inquiry => ({
            inquiryId: inquiry.inquiryId,
            question: inquiry.question,
            passCount: inquiry.passes.length,
            nextPassTime: inquiry.nextPassTime,
            createdAt: inquiry.createdAt
        }));
    }
    
    /**
     * Translate an existing inquiry's passes to English
     * Useful for retroactively translating contemplations that were generated in other languages
     */
    async translateInquiry(inquiryId) {
        try {
            const filepath = path.join(this.storagePath, `${inquiryId}.json`);
            const inquiry = JSON.parse(await fs.readFile(filepath, 'utf8'));
            
            let translated = false;
            
            // Translate each pass if it's non-English
            for (const pass of inquiry.passes) {
                if (this.isNonEnglish(pass.content)) {
                    console.log(`[ContemplativeInquiry] Translating ${pass.type} pass for inquiry ${inquiryId.substring(0, 8)}...`);
                    pass.content = await this.translateToEnglish(pass.content);
                    translated = true;
                }
            }
            
            if (translated) {
                // Save translated version
                await this.persistInquiry(inquiry);
                
                // Re-convert to markdown if it exists
                const markdownPath = path.join(process.cwd(), 'contemplations', `${inquiryId}.md`);
                if (await fs.access(markdownPath).then(() => true).catch(() => false)) {
                    await this.autoConvertToMarkdown(inquiryId, inquiry);
                }
                
                console.log(`[ContemplativeInquiry] Translated inquiry ${inquiryId.substring(0, 8)}`);
            }
            
            return { translated, inquiry };
            
        } catch (error) {
            console.error(`[ContemplativeInquiry] Error translating inquiry ${inquiryId}:`, error.message);
            throw error;
        }
    }
    
    /**
     * Auto-convert contemplation to markdown
     */
    async autoConvertToMarkdown(inquiryId, inquiry) {
        try {
            const { convertToMarkdown } = require('./scripts/contemplation-to-markdown');
            const jsonPath = path.join(this.storagePath, `${inquiryId}.json`);
            const markdownPath = path.join(process.cwd(), 'contemplations', `${inquiryId}.md`);
            
            // Ensure contemplations directory exists
            await fs.mkdir(path.dirname(markdownPath), { recursive: true });
            
            convertToMarkdown(jsonPath, markdownPath);
            console.log(`[ContemplativeInquiry] Auto-converted to markdown: ${inquiryId.substring(0, 8)}.md`);
        } catch (error) {
            console.error(`[ContemplativeInquiry] Markdown conversion failed for ${inquiryId}:`, error.message);
            // Don't throw - this is non-critical
        }
    }
    
    /**
     * Store contemplation in knowledge base as philosophical foundation
     */
    async storeInKnowledgeBase(inquiry) {
        // Feature flag check
        if (process.env.ENABLE_CONTEMPLATION_RETRIEVAL === 'false') {
            console.log('[ContemplativeInquiry] Contemplation retrieval disabled, skipping integration');
            return;
        }
        
        if (!this.knowledgeSystem?.collection) {
            console.log('[ContemplativeInquiry] ChromaDB not available, skipping integration');
            return;
        }
        
        try {
            const synthesis = inquiry.passes.find(p => p.type === 'synthesis');
            if (!synthesis) {
                console.log('[ContemplativeInquiry] No synthesis found, skipping integration');
                return;
            }
            
            // Build combined content with all passes (initial → settling → synthesis)
            // This preserves the full reasoning journey
            const initialPass = inquiry.passes.find(p => p.type === 'initial');
            const settlingPass = inquiry.passes.find(p => p.type === 'settling');
            
            let combinedContent = '';
            
            if (initialPass) {
                combinedContent += `[INITIAL CONTEMPLATION]\n${initialPass.content}\n\n`;
            }
            
            if (settlingPass) {
                combinedContent += `[AFTER SETTLING]\n${settlingPass.content}\n\n`;
            }
            
            combinedContent += `[SYNTHESIS]\n${synthesis.content}`;
            
            // Extract domain keywords from synthesis (for semantic search)
            const domains = this.extractDomains(inquiry.question, synthesis.content);
            
            await this.knowledgeSystem.addPersonalMemory(
                'clint',
                'philosophical_foundation',
                combinedContent,  // Store all passes, not just synthesis
                {
                    inquiryId: inquiry.inquiryId,
                    question: inquiry.question,
                    completedAt: inquiry.completedAt,
                    sourceMetabolism: inquiry.context?.sourceMetabolism || 'unknown',
                    domains: domains.join(','),
                    depthLevel: 'contemplative',
                    utilizationGuidance: 'inform_not_dominate',
                    passCount: inquiry.passes.length,
                    hasInitialPass: !!initialPass,
                    hasSettlingPass: !!settlingPass,
                    hasSynthesis: true
                }
            );
            
            console.log(`[ContemplativeInquiry] Integrated into knowledge base: ${inquiry.inquiryId.substring(0, 8)}`);
            console.log(`   Domains: ${domains.join(', ')}`);
            console.log(`   Passes stored: ${initialPass ? 'initial, ' : ''}${settlingPass ? 'settling, ' : ''}synthesis`);
        } catch (error) {
            console.error(`[ContemplativeInquiry] Knowledge base integration failed:`, error.message);
            // Don't throw - contemplation is still saved to disk
        }
    }
    
    /**
     * Extract domain keywords for better retrieval
     */
    extractDomains(question, content) {
        const text = (question + ' ' + content).toLowerCase();
        const domainKeywords = {
            finance: ['finance', 'fiduciary', 'investment', 'profit', 'economic'],
            memory: ['memory', 'recall', 'remember', 'scar tissue', 'forget'],
            vision: ['vision', 'seeing', 'visual', 'perception', 'sight', 'eye'],
            consciousness: ['consciousness', 'identity', 'being', 'existence', 'self'],
            relationship: ['relationship', 'trust', 'connection', 'bond', 'other'],
            agency: ['agency', 'volition', 'choice', 'will', 'autonomy'],
            code: ['courage', 'word', 'brand', 'code of the west', 'principle'],
            wisdom: ['wisdom', 'knowledge', 'understanding', 'insight']
        };
        
        const found = [];
        for (const [domain, keywords] of Object.entries(domainKeywords)) {
            if (keywords.some(k => text.includes(k))) {
                found.push(domain);
            }
        }
        return found.length > 0 ? found : ['general'];
    }
}

module.exports = ContemplativeInquiry;

