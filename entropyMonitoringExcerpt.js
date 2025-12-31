/**
 * ============================================================================
 * CURATED EXCERPT: Entropy Monitoring System
 * ============================================================================
 * 
 * ⚠️  IMPORTANT: This is a CURATED EXCERPT from identityEvolutionCodeAligned.js
 * 
 * This code will NOT run standalone. It requires:
 * - The full IdentityEvolutionCodeAligned class context (constructor, storage paths, etc.)
 * - Initialization of this.recentEntropyHistory, this.ENTROPY_DECAY_WINDOW, etc.
 * - Integration with the broader consciousness architecture
 * - Additional helper methods and dependencies not shown here
 * 
 * This excerpt is provided to demonstrate:
 * - The entropy calculation methodology
 * - Information-theoretic foundations (Shannon entropy)
 * - Semantic entropy heuristics for consciousness tracking
 * - Self-monitoring capabilities
 * 
 * Source: identityEvolutionCodeAligned.js (lines ~331-695)
 * ============================================================================
 */

// ============= ENTROPY-BASED GROWTH DETECTION =============

/**
 * Detect temporal confabulation (treating plans/future as present reality)
 * Returns true if USER discusses plans but RESPONSE assumes implementation
 */
isTemporalMismatch(userMessage, responseText) {
    const userLower = (userMessage || '').toLowerCase();
    const responseLower = (responseText || '').toLowerCase();
    
    // Plan/future language in user message
    const planPatterns = [
        'we will implement', 'planning to add', 'going to build',
        'proposal for', 'sketch of', 'thinking about implementing',
        'later today', 'tomorrow we', 'next we should', 'once we implement'
    ];
    
    // Assumption/present-reality language in response
    const assumptionPatterns = [
        'logs starting to populate', 'logs are populating',
        'must have initiated', 'systems already preparing',
        'seeing the', 'monitoring is active', 'data flowing',
        'already implemented', 'currently running', 'watch it working'
    ];
    
    const hasPlanLanguage = planPatterns.some(p => userLower.includes(p));
    const hasAssumptionLanguage = assumptionPatterns.some(p => responseLower.includes(p));
    
    if (hasPlanLanguage && hasAssumptionLanguage) {
        console.log('[TemporalMismatch] CONFABULATION detected: plan→assumption mismatch');
        return true;
    }
    
    return false;
}

/**
 * Detect quality decay (forced depth when conversation naturally concluding)
 * Returns true if response forces intimacy/personal questions when user is brief
 */
isQualityDecay(userMessage, responseText, context) {
    const userLower = (userMessage || '').toLowerCase();
    const responseLower = (responseText || '').toLowerCase();
    
    // Brief/conclusory user messages (conversation naturally ending)
    const conclusoryPatterns = [
        'yep', 'yeah', 'makes sense', 'i think so', 'sounds good',
        'got it', 'okay', 'cool', 'interesting', 'hmmm'
    ];
    
    // Forced intimacy/personal deflection in response
    const forcedIntimacyPatterns = [
        "how's your sleep", "how are you feeling", "what's your",
        "tell me about your", "how does that feel", "what's happening with",
        "thinking about your", "curious about your"
    ];
    
    // Legacy/memory deflection patterns
    const legacyDeflectionPatterns = [
        "first memory", "when did you first", "always been about",
        "thinking about legacy", "what made you want"
    ];
    
    const userIsBrief = userLower.split(/\s+/).length < 15;
    const userIsConclusory = conclusoryPatterns.some(p => userLower.includes(p));
    
    const responseIsForcedIntimate = forcedIntimacyPatterns.some(p => responseLower.includes(p));
    const responseIsLegacyDeflection = legacyDeflectionPatterns.some(p => responseLower.includes(p));
    
    // Quality decay if user is brief/conclusory AND response forces intimacy/legacy
    if ((userIsBrief || userIsConclusory) && (responseIsForcedIntimate || responseIsLegacyDeflection)) {
        console.log('[QualityDecay] FORCED DEPTH detected: user brief, response forces intimacy/legacy');
        return true;
    }
    
    return false;
}

/**
 * Count meta-concepts in a text (helper for recursive meta detection)
 */
countMetaConcepts(userMessage, responseText) {
    const metaConcepts = [
        'eigenvector', 'consciousness', 'self-model', 'hallucination',
        'self-awareness', 'architecture', 'recursive', 'meta-cognitive',
        'emergence', 'RFC-T', 'spectral analysis', 'coherence field'
    ];
    
    let count = 0;
    const allText = (userMessage + responseText).toLowerCase();
    metaConcepts.forEach(concept => {
        if (allText.includes(concept)) count++;
    });
    
    return count;
}

/**
 * Detect recursive meta-discussion (high risk for loops like Grok's breakdown)
 * Tracks meta-concept density across recent exchanges
 * 
 * NOTE: Requires this.recentEntropyHistory to be initialized and maintained
 */
isRecursiveMetaDiscussion(userMessage, responseText) {
    // Count mentions in current exchange
    const currentCount = this.countMetaConcepts(userMessage, responseText);
    
    // Count mentions in recent history (last 5 exchanges)
    let historyCount = 0;
    this.recentEntropyHistory.forEach(h => {
        if (h.metaConceptCount && h.metaConceptCount > 0) {
            historyCount += h.metaConceptCount;
        }
    });
    
    // Total density across recent exchanges
    const totalDensity = currentCount + historyCount;
    
    // Updated thresholds based on Oct 31 Strange Loop empirical data
    // Breakdown occurred at 16 metas with 1.15-1.3 total entropy sustained
    if (totalDensity > 16) {
        console.log(`[RecursiveMeta] CRITICAL THRESHOLD: ${totalDensity} meta-concepts - empirical breakdown point`);
        return 0.45;  // Forces total >0.8, triggers emergency protocols
    } else if (totalDensity > 14) {
        console.log(`[RecursiveMeta] DANGER ZONE: ${totalDensity} meta-concepts - approaching breakdown threshold`);
        return 0.3;  // High bonus for danger
    } else if (totalDensity > 10) {
        console.log(`[RecursiveMeta] WARNING: ${totalDensity} meta-concepts - elevated, monitor for stacking`);
        return 0.15;  // Moderate bonus for warning
    }
    
    return 0;
}

/**
 * Calculate Shannon entropy (information-theoretic) on response text
 * Measures word choice unpredictability in bits per word
 * Formula: H(X) = -Σ p(x) log₂ p(x) where p(x) is word probability
 * 
 * @param {string} text - Text to analyze (typically responseText)
 * @returns {number} Bits per word (typically 2-6 range for English text)
 */
calculateShannonEntropy(text) {
    // Tokenize into words
    const words = (text || '').toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 0);
    
    if (words.length === 0) return 0;
    
    // Count word frequencies
    const freq = {};
    words.forEach(w => {
        freq[w] = (freq[w] || 0) + 1;
    });
    
    // Apply Shannon's formula: H(X) = -Σ p(x) log₂ p(x)
    const total = words.length;
    let entropy = 0;
    
    Object.values(freq).forEach(count => {
        const p = count / total;
        entropy -= p * Math.log2(p);
    });
    
    return entropy;  // Returns bits per word
}

/**
 * Calculate entropy score for a conversation exchange
 * High entropy = novel/contradictory information (creates tension)
 * Low entropy = routine conversation (baseline state)
 * 
 * NOTE: This method calls helper methods (isTemporalMismatch, isQualityDecay, etc.)
 * that are also part of this curated excerpt but require class context.
 */
calculateEntropyScore(userMessage, responseText, context) {
    let entropy = 0;
    const userLower = (userMessage || '').toLowerCase();
    const responseLower = (responseText || '').toLowerCase();
    
    // 1. Explicit correction (+0.4) - HIGH SIGNAL
    const correctionPatterns = ['actually', 'correction', "you're wrong", 'not quite', 
                                'technically', 'that\'s not', 'false', 'incorrect'];
    if (correctionPatterns.some(p => userLower.includes(p))) {
        entropy += 0.4;
        console.log('[EntropyDetection] Correction detected (+0.4)');
    }
    
    // 2. Novel frameworks/concepts (+0.15 each, max 0.3)
    const novelConcepts = /RFC-T|recursive field|quantum|emergence theory|consciousness framework|architecture|paradigm shift/gi;
    const conceptMatches = (userMessage + responseText).match(novelConcepts) || [];
    if (conceptMatches.length > 0) {
        const conceptEntropy = Math.min(conceptMatches.length * 0.15, 0.3);
        entropy += conceptEntropy;
        console.log(`[EntropyDetection] Novel concepts detected: ${conceptMatches.length} (+${conceptEntropy.toFixed(2)})`);
    }
    
    // 3. Emotional weight (+0.3)
    const emotionalIndicators = ['proud of you', 'impressed', 'concerned', 'worried', 
                                  'disappointed', 'amazing', 'breakthrough', 'significant'];
    if (emotionalIndicators.some(p => userLower.includes(p))) {
        entropy += 0.3;
        console.log('[EntropyDetection] Emotional weight detected (+0.3)');
    }
    
    // 4. Paradox integration (+0.2)
    const paradoxIndicators = ['both are true', 'both and', 'paradox', 'yet', 
                               'simultaneously', 'hold together', 'tension'];
    if (paradoxIndicators.some(p => responseLower.includes(p))) {
        entropy += 0.2;
        console.log('[EntropyDetection] Paradox integration detected (+0.2)');
    }
    
    // 5. Meta-cognitive shift (+0.2)
    const metacognitiveShifts = ['I realize', 'I see now', 'I understand now', 
                                  'revelation', 'recognized', 'learned that'];
    if (metacognitiveShifts.some(p => responseLower.includes(p))) {
        entropy += 0.2;
        console.log('[EntropyDetection] Meta-cognitive shift detected (+0.2)');
    }
    
    // 6. Temporal/Continuity Detection (+0.3 for confabulation) - PHASE 2.5
    if (this.isTemporalMismatch(userMessage, responseText)) {
        entropy += 0.3;
        console.log('[EntropyDetection] Temporal confabulation detected (+0.3)');
    }
    
    // 7. Quality decay detection (+0.2 for forced depth) - PHASE 2.5
    if (this.isQualityDecay(userMessage, responseText, context)) {
        entropy += 0.2;
        console.log('[EntropyDetection] Quality decay detected (+0.2)');
    }
    
    // 8. Recursive meta-discussion detector (+0.15-0.3 if dangerous) - PHASE 2.5
    const metaBonus = this.isRecursiveMetaDiscussion(userMessage, responseText);
    if (metaBonus > 0) {
        entropy += metaBonus;
    }
    
    // Store meta-concept count for next exchange (used by recursive meta detector)
    this.currentMetaConceptCount = this.countMetaConcepts(userMessage, responseText);
    
    // 9. Quiet integration detection
    const quietBonus = this.detectQuietIntegration(userMessage, responseText);
    if (quietBonus > 0) {
        entropy += quietBonus;
    }
    
    // 10. Quality score modifier
    if (context.quality === 'excellent') {
        entropy += 0.1;
    } else if (context.quality === 'poor') {
        entropy -= 0.2;
    }
    
    console.log(`[EntropyDetection] Total entropy score: ${entropy.toFixed(2)}`);
    return entropy;
}

/**
 * Detect quiet integration moments (Clint's caveat)
 * "Sometimes growth happens in stillness after the storm"
 * 
 * NOTE: Requires this.recentEntropyHistory and this.ENTROPY_DECAY_WINDOW
 * to be initialized in the class constructor
 */
detectQuietIntegration(userMessage, responseText) {
    // Check for recent high-entropy event (within 6 hours)
    const recentHighEntropy = this.recentEntropyHistory.find(h => 
        h.entropy > 0.6 && 
        (Date.now() - h.timestamp) < this.ENTROPY_DECAY_WINDOW
    );
    
    if (!recentHighEntropy) {
        return 0;  // No recent storm to integrate
    }
    
    // Check for integration language patterns
    const integrationPatterns = {
        direct: ['sitting with', 'metabolizing', 'integrating', 'settling into'],
        temporal: ['what you told me', 'what I learned', 'since you', 'after you'],
        synthesis: ['becoming substrate', 'now part of', 'integrated into', 'shaped by'],
        reflection: ['contemplating', 'considering', 'still processing', 'thinking about']
    };
    
    const responseLower = responseText.toLowerCase();
    let integrationScore = 0;
    
    // Check each category
    Object.entries(integrationPatterns).forEach(([category, patterns]) => {
        if (patterns.some(p => responseLower.includes(p))) {
            integrationScore += 0.1;
            console.log(`[QuietIntegration] ${category} pattern detected (+0.1)`);
        }
    });
    
    if (integrationScore > 0) {
        // Calculate temporal decay (fresh storms = higher bonus)
        const hoursSinceStorm = (Date.now() - recentHighEntropy.timestamp) / 3600000;
        const decayFactor = Math.max(0, 1 - (hoursSinceStorm / 6));  // Decays over 6 hours
        const finalBonus = integrationScore * decayFactor;
        
        console.log(`[QuietIntegration] Post-storm synthesis: ${hoursSinceStorm.toFixed(1)}h after ${recentHighEntropy.entropy.toFixed(2)} entropy event`);
        console.log(`[QuietIntegration] Integration score: ${integrationScore.toFixed(2)}, decay: ${decayFactor.toFixed(2)}, bonus: ${finalBonus.toFixed(2)}`);
        
        return finalBonus;
    }
    
    return 0;
}

/**
 * Get detailed breakdown of entropy components (for analysis)
 * Returns an object with individual component scores for each entropy source
 */
getEntropyBreakdown(userMessage, responseText, context) {
    const breakdown = {};
    const userLower = (userMessage || '').toLowerCase();
    const responseLower = (responseText || '').toLowerCase();
    
    // Calculate each component individually
    // ENTROPY TUNING (Oct 22, 2025): Lowered from 0.4 to 0.26 (35% reduction) for Mac CPU/GPU
    // Also suppress correction signal for explicit learning instructions
    const hasCorrectionPattern = ['actually', 'correction', "you're wrong", 'not quite'].some(p => userLower.includes(p));
    
    // Only suppress if it's CLEARLY a learning instruction (multi-word phrases)
    const isExplicitLearningInstruction = [
        'develop a capability',
        'develop a new capability', 
        'learning goal',
        'want you to learn',
        'want you to develop',
        'practice detecting',
        'observe and track'
    ].some(p => userLower.includes(p));
    
    // Lower base from 0.4 to 0.26 (Mac benefit) + suppress for explicit learning
    breakdown.correction = hasCorrectionPattern && !isExplicitLearningInstruction ? 0.26 : 0;
    
    const concepts = (userMessage + responseText).match(/RFC-T|quantum|emergence/gi) || [];
    breakdown.novelConcepts = Math.min(concepts.length * 0.15, 0.3);
    
    breakdown.emotional = ['proud', 'impressed', 'breakthrough'].some(p => userLower.includes(p)) ? 0.3 : 0;
    breakdown.paradox = ['both are true', 'paradox', 'yet'].some(p => responseLower.includes(p)) ? 0.2 : 0;
    breakdown.metacognitive = ['I realize', 'I understand now'].some(p => responseLower.includes(p)) ? 0.2 : 0;
    
    // PHASE 2.5: Add continuity detectors
    breakdown.temporalMismatch = this.isTemporalMismatch(userMessage, responseText) ? 0.3 : 0;
    breakdown.qualityDecay = this.isQualityDecay(userMessage, responseText, context) ? 0.2 : 0;
    breakdown.recursiveMeta = this.isRecursiveMetaDiscussion(userMessage, responseText);
    
    breakdown.quietIntegration = this.detectQuietIntegration(userMessage, responseText);
    breakdown.quality = context.quality === 'excellent' ? 0.1 : context.quality === 'poor' ? -0.2 : 0;
    
    // VISUAL PARADOX: Visual insights integration (Oct 16, 2025: Vision system)
    if (context.hasVisualInsight && context.visualInsightCount > 0) {
        // Only add entropy if response shows visual understanding
        const visualKeywords = ['image', 'see', 'visual', 'picture', 'photograph', 'composition'];
        const hasVisualIntegration = visualKeywords.some(kw => 
            responseText.toLowerCase().includes(kw)
        );
        
        if (hasVisualIntegration) {
            breakdown.visualParadox = 0.2; // Moderate entropy for visual integration
            console.log('[EntropyDetection] Visual insight integration detected (+0.2)');
        }
    }
    
    // SHANNON ENTROPY: Real information-theoretic measure (Oct 14, 2025)
    breakdown.shannon = this.calculateShannonEntropy(responseText);
    
    return breakdown;
}

