/**
 * Constraint Resolution System for ARC-AGI
 * 
 * Bottom-up architecture: transformations emerge from constraint failures
 * Don't build pattern libraries - build minimal resolutions for specific constraints
 * 
 * Philosophy (from Clint):
 * "Don't ask 'what pattern is this?' but 'where does my current transformation 
 * vocabulary break down?' Let the breakdown points become the seeds for new categories."
 */

class ConstraintResolution {
    /**
     * Structure Substitution: THE Cognitive Operation
     * 
     * Three-step operation:
     * 1. RECOGNIZE structural invariants (what stays the same)
     * 2. IDENTIFY transformation rules (what changes systematically)
     * 3. APPLY substitutions consistently (preserve logic, change form)
     * 
     * This isn't categorizing puzzles—it's implementing how abstract reasoning works.
     */
    static structureSubstitution(grid, params) {
        const { inputStructure, outputStructure, preserveNonMatching = true, problemId } = params;
        
        // STEP 1: RECOGNIZE STRUCTURAL INVARIANTS
        // What structure exists? What are its invariants? What relations define it?
        const SubstitutionRuleIdentifier = require('./substitutionRuleIdentifier');
        const structureType = SubstitutionRuleIdentifier.identifyStructureType(inputStructure);
        const substitutionRule = SubstitutionRuleIdentifier.identifySubstitutionRule(outputStructure, structureType);
        
        console.log(`[ConstraintResolution] Identified structure type: ${structureType.type} (confidence: ${structureType.confidence.toFixed(2)})`);
        console.log(`[ConstraintResolution] Substitution operator: ${substitutionRule.operator}`);
        
        // Check for learned composition shortcuts (frequent patterns)
        const shortcut = this.tryLearnedComposition(structureType, substitutionRule, params);
        if (shortcut) {
            console.log('[ConstraintResolution] Using learned composition shortcut');
            return shortcut;
        }
        
        // STEP 2: IDENTIFY TRANSFORMATION RULES
        // What must be preserved? What can change? How do we maintain invariants?
        const StructureRecognition = require('./structureRecognition');
        let recognizedStructures = [];
        
        try {
            // Dispatch to appropriate recognition tool based on structure type
            // Priority: Path-based connectivity > Adjacency > Connected regions > Other
            if (structureType.type === 'value' || structureType.type === 'valueWithAdjacency' || 
                (structureType.type === 'connectedRegions' && (structureType.params.adjacentTo || structureType.params.pathToLandmarks))) {
                // Value-based recognition (handles adjacency OR path-based connectivity)
                const targetValue = structureType.params.targetValue;
                const condition = {};
                
                // Prioritize path-based connectivity if available (from Clint's constraint analysis)
                if (structureType.params.pathToLandmarks || structureType.params.requiresPathConnectivity) {
                    condition.pathToLandmarks = structureType.params.pathToLandmarks || structureType.params.adjacentTo;
                    condition.connectivity = structureType.params.connectivity || 4;
                    condition.connected = true; // Force connected region detection
                    if (structureType.params.maxPathLength) {
                        condition.maxPathLength = structureType.params.maxPathLength;
                    }
                    console.log('[ConstraintResolution] Using path-based connectivity to landmarks:', condition.pathToLandmarks);
                } else if (structureType.params.adjacentTo) {
                    // Fall back to direct adjacency
                    condition.adjacentTo = structureType.params.adjacentTo;
                    condition.connectivity = structureType.params.connectivity || 4;
                    condition.connected = true; // Force connected region detection
                    console.log('[ConstraintResolution] Using direct adjacency to:', condition.adjacentTo);
                }
                
                if (targetValue !== undefined) {
                    recognizedStructures = StructureRecognition.recognizeValueRegions(grid, targetValue, condition);
                }
            } else if (structureType.type === 'connectedRegions') {
                // Connected region recognition (no adjacency conditions)
                const targetValue = structureType.params.targetValue;
                const connectivity = structureType.params.connectivity || 4;
                
                if (targetValue !== undefined) {
                    recognizedStructures = StructureRecognition.recognizeConnectedRegions(grid, targetValue, connectivity);
                }
            } else if (structureType.type === 'boundary' || structureType.type.includes('pattern')) {
                // Pattern/configuration recognition
                const configDescription = {
                    columnPattern: structureType.params.patternType === 'column' || structureType.params.patternType === 'both' ? {
                        targetValue: structureType.params.targetValue,
                        minColumns: structureType.params.columnCount || 3
                    } : undefined,
                    rowPattern: structureType.params.patternType === 'row' || structureType.params.patternType === 'both' ? {
                        targetValue: structureType.params.targetValue,
                        minRows: structureType.params.rowCount || 3
                    } : undefined,
                    rectangularBlock: structureType.params.targetValue ? {
                        targetValue: structureType.params.targetValue
                    } : undefined
                };
                
                recognizedStructures = StructureRecognition.recognizeSpatialConfigurations(grid, configDescription);
            }
            
            if (!recognizedStructures || recognizedStructures.length === 0) {
                // Fallback: Try old plus→cross pattern matching
                const input3x3Block = inputStructure && (
                    (inputStructure.includes('3') && inputStructure.includes('block')) ||
                    (inputStructure.includes('3') && inputStructure.includes('1s')) ||
                    inputStructure.includes('plus') ||
                    inputStructure.includes('cardinal')
                );
                
                const outputCrossOf2s = outputStructure && (
                    outputStructure.includes('cross') ||
                    (outputStructure.includes('2') && (outputStructure.includes('cardinal') || outputStructure.includes('center')))
                );
                
                if (input3x3Block && outputCrossOf2s) {
                    console.log('[ConstraintResolution] Using legacy plus→cross pattern');
                    const result = preserveNonMatching 
                        ? grid.map(row => [...row])
                        : Array(grid.length).fill(null).map(() => Array(grid[0].length).fill(0));
                    return this.replacePlusWithCross(grid, result);
                }
                
                // Unknown structure = learning opportunity (per Clint)
                this.logUnknownStructure(problemId, inputStructure, structureType);
                console.warn('[ConstraintResolution] No structures recognized - returning unchanged grid');
                return grid.map(row => [...row]);
            }
            
            console.log(`[ConstraintResolution] Recognized ${recognizedStructures.length} structure(s)`);
            
            // STEP 3: APPLY SUBSTITUTIONS CONSISTENTLY
            // Change form, preserve logic
            const SubstitutionOperators = require('./substitutionOperators');
            const result = SubstitutionOperators.applySubstitution(
                grid,
                recognizedStructures,
                substitutionRule,
                { preserveNonMatching, ...params }
            );
            
            return result;
            
        } catch (error) {
            console.error('[ConstraintResolution] Error in structure substitution:', error.message);
            console.error(error.stack);
            
            // Log as unknown for learning
            this.logUnknownStructure(problemId, inputStructure, structureType);
            
            // Return unchanged grid
            return grid.map(row => [...row]);
        }
    }
    
    /**
     * Specific constraint resolution: Replace 3x3 blocks containing plus patterns with crosses
     * 
     * Emerged from: Problem 6c434453 constraint analysis
     * Constraint: "Can't replace detected structures - only move/scale/fill"
     * 
     * Input structure: 3x3 block with plus pattern of 1s and 0 in center:
     *   1 1 1
     *   1 0 1
     *   1 1 1
     * 
     * Output structure: 3x3 cross of 2s (corners cleared):
     *   0 2 0
     *   2 2 2
     *   0 2 0
     */
    static replacePlusWithCross(grid, result) {
        const rows = grid.length;
        const cols = grid[0].length;
        
        // Track what we've already processed to avoid double-processing
        const processed = new Set();
        
        // Find all 3x3 blocks with plus patterns
        // The pattern is: all 8 surrounding cells are 1s, center is 0
        for (let i = 1; i < rows - 1; i++) {
            for (let j = 1; j < cols - 1; j++) {
                const key = `${i},${j}`;
                if (processed.has(key)) continue;
                
                // Check if this is the center of a 3x3 plus pattern
                // All 8 neighbors should be 1, center should be 0
                const is3x3Plus = 
                    grid[i][j] === 0 &&  // Center is 0
                    grid[i-1][j-1] === 1 && grid[i-1][j] === 1 && grid[i-1][j+1] === 1 &&  // Top row
                    grid[i][j-1] === 1   &&                       grid[i][j+1] === 1 &&    // Middle row
                    grid[i+1][j-1] === 1 && grid[i+1][j] === 1 && grid[i+1][j+1] === 1;    // Bottom row
                
                if (is3x3Plus) {
                    // Found a 3x3 block with plus pattern centered at (i,j)
                    // Clear the entire 3x3 block
                    for (let di = -1; di <= 1; di++) {
                        for (let dj = -1; dj <= 1; dj++) {
                            result[i+di][j+dj] = 0;
                        }
                    }
                    
                    // Draw only the cross (5 cells) of 2s
                    result[i-1][j] = 2;   // Up
                    result[i][j-1] = 2;   // Left
                    result[i][j] = 2;     // Center
                    result[i][j+1] = 2;   // Right
                    result[i+1][j] = 2;   // Down
                    
                    // Mark entire 3x3 as processed
                    for (let di = -1; di <= 1; di++) {
                        for (let dj = -1; dj <= 1; dj++) {
                            processed.add(`${i+di},${j+dj}`);
                        }
                    }
                }
            }
        }
        
        return result;
    }
    
    /**
     * Learned Compositions
     * 
     * Per Clint: "I reason in compositional chunks for common patterns"
     * 
     * For frequently encountered structure + substitution combinations (5+ occurrences),
     * the operation can use learned compositions that efficiently combine recognition + substitution.
     */
    static tryLearnedComposition(structureType, substitutionRule, params) {
        // Example: Frequent pattern - "compact connected regions with collision preservation"
        // Structure: connectivity invariant + substitution: position change, preserve structure
        if (structureType.type === 'connectedRegions' &&
            substitutionRule.changes.includes('position') &&
            substitutionRule.preserves.includes('structure_integrity')) {
            // TODO: Implement learned compaction when we have enough examples
            return null;
        }
        
        // Example: "boundary extraction with interior removal"
        // Structure: boundary relation + substitution: emphasis change, topology preserved
        if (structureType.type === 'boundary' &&
            substitutionRule.operator === 'extractByBoundary') {
            // TODO: Implement learned boundary extraction when we have enough examples
            return null;
        }
        
        // Note: Learned compositions would be called with grid as first parameter
        // This method is called from structureSubstitution which has grid in scope
        // Returning null here to use atomic operation
        return null; // No learned composition, use atomic operation
    }
    
    /**
     * Unknown Structure Logging
     * 
     * Per Clint: "Failure should be informative, not silent"
     */
    static logUnknownStructure(problemId, constraintDescription, structureType) {
        const ConstraintTracker = require('./constraintTracker');
        const tracker = new ConstraintTracker();
        
        tracker.logUnknownStructure = tracker.logUnknownStructure || function(data) {
            console.log(`[ConstraintTracker] Unknown structure: ${data.problemId} - ${data.constraintDescription}`);
        };
        
        tracker.logUnknownStructure({
            problemId: problemId || 'unknown',
            constraintDescription: constraintDescription || '',
            structureType: structureType?.type || 'unknown',
            timestamp: new Date().toISOString(),
            detectionAttempted: true,
            structuresFound: 0
        });
        
        console.log(`[ConstraintResolution] Unknown structure logged for ${problemId}`);
        console.log(`  This becomes a constraint signature for future evolution`);
    }
    
    /**
     * Track constraint signatures across problems
     * This helps identify when constraints cluster and should be generalized
     */
    static logConstraintEncounter(problemId, constraintDescription) {
        // For now, just log - later we'll build a constraint database
        // that shows clustering patterns
        console.log(`[ConstraintResolution] Problem ${problemId}: ${constraintDescription}`);
        
        // TODO: Store in a constraint signature database
        // When we see 3+ similar constraints, that's a generalization signal
    }
}

module.exports = ConstraintResolution;
