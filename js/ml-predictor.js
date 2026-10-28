/**
 * FLA-Lang Machine Learning Code Predictor (Inference Engine)
 * Subject: Formal Languages and Automata (FLA)
 * 
 * Performs client-side inference using exported Multinomial Naive Bayes
 * character n-gram model parameters (vocabulary, class log priors, feature log probabilities).
 * 
 * Note: This module provides statistical code classification. The deterministic
 * Lexer and LL(1) Recursive Descent Parser remain the authoritative syntax validator.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FLAML = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  class MLPredictor {
    constructor() {
      this.model = null;
      this._isLoaded = false;
      this.loadError = null;
      this.vocabulary = null;
      this.minN = 1;
      this.maxN = 4;
    }

    /**
     * Check if model is loaded and ready
     */
    isLoaded() {
      return this._isLoaded;
    }

    /**
     * Load model parameters from JSON object or URL
     * @param {Object|string} modelSource 
     */
    async loadModel(modelSource = './ml_model.json') {
      try {
        if (typeof modelSource === 'object' && modelSource !== null) {
          this.initModel(modelSource);
          return true;
        }

        if (typeof fetch === 'function') {
          const response = await fetch(modelSource);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status} ${response.statusText} while fetching ${modelSource}`);
          }
          const data = await response.json();
          this.initModel(data);
          return true;
        } else {
          throw new Error('fetch API is not available in this environment');
        }
      } catch (err) {
        this._isLoaded = false;
        this.loadError = err.message || String(err);
        return false;
      }
    }

    /**
     * Load directly from parsed JSON object
     * @param {Object} data 
     */
    loadModelFromJSON(data) {
      this.initModel(data);
      return this.isLoaded;
    }

    /**
     * Initialize internal model structures from parsed JSON data
     */
    initModel(data) {
      if (!data || !data.vocabulary || !data.feature_log_prob || (!data.class_log_priors && !data.class_log_prior)) {
        throw new Error('Invalid model data: missing required Naive Bayes parameters');
      }

      this.model = data;
      this.vocabulary = data.vocabulary;
      this.classLogPriors = data.class_log_priors || data.class_log_prior;
      this.featureLogProb = data.feature_log_prob;
      this.classes = data.classes || ['invalid', 'valid'];
      this.minN = (data.ngram_range && data.ngram_range[0]) || 1;
      this.maxN = (data.ngram_range && data.ngram_range[1]) || 4;
      this._isLoaded = true;
      this.loadError = null;
    }

    /**
     * Check if model is loaded and ready
     */
    hasModel() {
      return this.isLoaded;
    }

    /**
     * Extract character n-grams from input text
     */
    extractNgrams(text) {
      const ngrams = Object.create(null);
      const len = text.length;
      for (let n = this.minN; n <= this.maxN; n++) {
        for (let i = 0; i <= len - n; i++) {
          const ng = text.substring(i, i + n);
          ngrams[ng] = (ngrams[ng] || 0) + 1;
        }
      }
      return ngrams;
    }

    /**
     * Predict whether the given code snippet is valid or invalid FLA-Lang code
     * @param {string} text Source code to evaluate
     */
    predict(text) {
      if (!this._isLoaded) {
        return {
          isLoaded: false,
          error: this.loadError || 'Model is not loaded. Ensure ml_model.json is placed in the project root.'
        };
      }

      if (!text || typeof text !== 'string' || text.trim() === '') {
        return {
          isLoaded: true,
          prediction: 'invalid',
          isLikelyValid: false,
          confidence: 0.5,
          confidencePercent: 50.0,
          probabilities: { valid: 0.5, invalid: 0.5 },
          validProbability: 50.0,
          invalidProbability: 50.0,
          matchedFeaturesCount: 0,
          topFeatures: [],
          disclaimer: 'Empty input'
        };
      }

      const ngrams = this.extractNgrams(text);
      const logProbs = [this.classLogPriors[0], this.classLogPriors[1]];
      let matchedCount = 0;
      const matchedFeatures = [];

      for (const [ng, count] of Object.entries(ngrams)) {
        const idx = this.vocabulary[ng];
        if (idx !== undefined) {
          const logP0 = this.featureLogProb[0][idx];
          const logP1 = this.featureLogProb[1][idx];
          logProbs[0] += count * logP0;
          logProbs[1] += count * logP1;
          matchedCount++;

          const diff = logP1 - logP0;
          matchedFeatures.push({
            ngram: ng,
            count: count,
            weightDiff: diff * count,
            diff: diff * count,
            favorsValid: diff > 0,
            favors: diff > 0 ? 'valid' : 'invalid'
          });
        }
      }

      // Softmax normalized posterior probabilities
      const maxLog = Math.max(logProbs[0], logProbs[1]);
      const exp0 = Math.exp(logProbs[0] - maxLog);
      const exp1 = Math.exp(logProbs[1] - maxLog);
      const totalExp = exp0 + exp1;
      const prob0 = exp0 / totalExp; // probability invalid
      const prob1 = exp1 / totalExp; // probability valid

      const isLikelyValid = logProbs[1] >= logProbs[0];
      const predictedClass = isLikelyValid ? 'valid' : 'invalid';
      const confidence = isLikelyValid ? prob1 : prob0;

      // Sort top influential features
      matchedFeatures.sort((a, b) => Math.abs(b.weightDiff) - Math.abs(a.weightDiff));
      const topFeatures = matchedFeatures.slice(0, 6);

      return {
        isLoaded: true,
        prediction: predictedClass,
        isLikelyValid: isLikelyValid,
        confidence: Math.round(confidence * 1000) / 1000, // e.g. 0.984
        confidencePercent: Math.round(confidence * 1000) / 10, // e.g. 98.4%
        probabilities: {
          valid: Math.round(prob1 * 1000) / 1000,
          invalid: Math.round(prob0 * 1000) / 1000
        },
        validProbability: Math.round(prob1 * 1000) / 10,
        invalidProbability: Math.round(prob0 * 1000) / 10,
        logProbabilities: [Math.round(logProbs[0] * 100) / 100, Math.round(logProbs[1] * 100) / 100],
        totalNgramsExtracted: Object.keys(ngrams).length,
        matchedFeaturesCount: matchedCount,
        topFeatures: topFeatures,
        disclaimer: 'Statistical estimate derived from character n-gram frequencies. The deterministic compiler parser remains the authoritative ground truth for formal language syntax.'
      };
    }
  }

  return {
    MLPredictor
  };
}));
