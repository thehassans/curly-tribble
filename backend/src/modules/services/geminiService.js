import { GoogleGenAI } from '@google/genai';
import Setting from '../models/Setting.js'

class GeminiService {
  constructor() {
    this.client = null;
    this.defaultModel = 'gemini-2.5-flash';
  }

  async getApiKey() {
    try {
      const doc = await Setting.findOne({ key: 'ai' }).lean();
      return doc?.value?.geminiApiKey || process.env.GEMINI_API_KEY;
    } catch (err) {
      return process.env.GEMINI_API_KEY;
    }
  }

  async getModelName() {
    return 'gemini-2.5-flash';
  }

  async initClient() {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('Gemini API key not configured. Please add it in Settings > API Setup.');
    }
    
    this.client = new GoogleGenAI({ apiKey });
    console.log(`[GeminiService] Initialized with model: ${await this.getModelName()}`);
    return this.client;
  }

  async generateContent(prompt, maxRetries = 5) {
    if (!this.client) {
      await this.initClient();
    }
    
    const modelName = await this.getModelName();
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.client.models.generateContent({
          model: modelName,
          contents: prompt,
        });
        return response.text;
      } catch (error) {
        lastError = error;
        const errorMsg = error.message || '';
        const is503 = errorMsg.includes('503') || errorMsg.includes('overloaded') || errorMsg.includes('UNAVAILABLE');
        
        console.error(`[GeminiService] Attempt ${attempt}/${maxRetries} failed:`, errorMsg);
        
        if (is503 && attempt < maxRetries) {
          // Exponential backoff: 3s, 6s, 12s, 24s
          const waitTime = Math.pow(2, attempt) * 1500;
          console.log(`[GeminiService] Model overloaded, retrying in ${waitTime/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else if (!is503) {
          // Non-503 error, don't retry
          break;
        }
      }
    }
    
    // All retries failed - provide clear error message
    this.client = null;
    const errorMsg = lastError?.message || '';
    if (errorMsg.includes('503') || errorMsg.includes('overloaded')) {
      throw new Error('AI model is currently busy. Please try again in a few seconds.');
    }
    throw lastError;
  }

  async generateProductDescription(productName, category, additionalInfo = '') {
    try {
      const prompt = `
        You are an expert e-commerce copywriter. Create premium, optimistic, and sales-driving content for a product based on the following details:
        
        Product Name: ${productName}
        Category: ${category}
        Additional Information: ${additionalInfo}
        
        Generate the following sections in JSON format:
        1. "shortDescription": A catchy, premium, and optimistic short description (2-3 sentences).
        2. "overview": A detailed and engaging product overview highlighting benefits and lifestyle appeal (2 paragraphs).
        3. "specifications": A clean, formatted list of technical specifications or key product details (e.g., Material, Size, Usage). Format as a single string with newlines.
        4. "attributes": An array of objects with "label" and "value" for key product attributes (e.g., [{"label": "Material", "value": "Cotton"}, ...]).
        5. "keyFeatures": An array of 4-6 strong selling points.
        
        Ensure the tone is "premium" and "optimistic".
        
        Return ONLY valid JSON.
      `;

      const text = await this.generateContent(prompt);

      // Try to parse JSON from the response
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            description: parsed.shortDescription || parsed.description,
            overview: parsed.overview || '',
            specifications: parsed.specifications || '',
            attributes: Array.isArray(parsed.attributes) ? parsed.attributes : [],
            keyFeatures: Array.isArray(parsed.keyFeatures) ? parsed.keyFeatures : []
          };
        } else {
          // Fallback
          return {
            description: text,
            overview: '',
            specifications: '',
            attributes: [],
            keyFeatures: []
          };
        }
      } catch (parseError) {
        console.warn('Failed to parse JSON response', parseError);
        return {
          description: text,
          overview: '',
          specifications: '',
          attributes: [],
          keyFeatures: []
        };
      }
    } catch (error) {
      console.error('Error generating product description:', error);
      // Propagate the actual error message for better debugging on frontend
      throw new Error(error.message || 'Failed to generate product description');
    }
  }

  async generateProductTags(productName, category, description = '') {
    try {
      const prompt = `
        Generate relevant tags/keywords for this e-commerce product:
        
        Product Name: ${productName}
        Category: ${category}
        Description: ${description}
        
        Generate 8-12 relevant tags that customers might search for.
        Return as a JSON array of strings.
        Example: ["tag1", "tag2", "tag3"]
        
        Focus on:
        - Product type and category
        - Key features and benefits
        - Use cases and applications
        - Target audience
        - Material or style (if applicable)
      `;

      const text = await this.generateContent(prompt);

      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        } else {
          // Fallback: extract tags from text
          return text.split(',').map(tag => tag.trim().replace(/['"]/g, '')).slice(0, 10);
        }
      } catch (parseError) {
        console.warn('Failed to parse tags response');
        return [];
      }
    } catch (error) {
      console.error('Error generating product tags:', error);
      return [];
    }
  }

  async generateProductSEO(productName, category, description = '', availableCountries = [], baseUrl = 'https://buysial.com') {
    const countriesList = availableCountries.length > 0 ? availableCountries.join(', ') : 'UAE, KSA, UK, US';
    const prompt = `You are a world-class e-commerce SEO strategist specialising in fast-ranking (2-8 weeks) Google results for online stores. Your strategies are based on Google's E-E-A-T, BERT, and Shopping Graph algorithms.

PRODUCT DETAILS:
- Name: ${productName}
- Category: ${category}
- Description: ${description || 'Premium product'}
- Target Markets: ${countriesList}
- Store URL: ${baseUrl}

STRATEGY: Optimise for FAST RANKINGS (2-8 weeks) using:
1. Long-tail keywords (3-5 words) with low competition but clear buying intent
2. Geo-targeted keywords ("buy X in Dubai", "best X UAE delivery")
3. Question-based keywords for featured snippets ("best X for Y", "where to buy X")
4. Transactional modifiers: buy, order, cheap, best, review, discount, free shipping
5. Competitor gap keywords: under-served variations with commercial intent

Return ONLY a valid JSON object (no markdown, no explanation):

{
  "seoTitle": "50-60 chars max — primary long-tail keyword first, then product name, optionally brand",
  "slug": "3-5-word-hyphenated-primary-keyword-slug",
  "seoDescription": "145-158 chars — lead with primary keyword, state top benefit, include buying signal (Shop Now / Order Today / Free Delivery), end with trust signal",
  "seoKeywords": "12-15 comma-separated keywords: 3 short-head (1-2 words), 5 medium-tail (3 words), 4 long-tail buying-intent (4+ words), 3 geo-targeted (city/country + keyword)",
  "ogTitle": "Emotionally compelling social title — benefit-first, 55-70 chars",
  "ogDescription": "Social sharing hook — open curiosity loop, mention key benefit, 100-125 chars",
  "canonicalUrl": "${baseUrl}/products/SLUG_HERE",
  "countrySeo": {
    "CountryName": {
      "metaTitle": "50-60 chars — localised long-tail keyword + product, e.g. 'Buy [Product] in [City] | Free Delivery'",
      "metaDescription": "145-158 chars — buying intent for this market, mention local delivery/price advantage",
      "keywords": "8-10 geo-targeted keywords for this specific market in English",
      "hreflang": "en-AE / en-SA / en-GB / en-US / en-QA / en-KW / en-OM / en-BH"
    }
  },
  "backlinks": [
    { "url": "https://REAL_DOMAIN.com/KNOWN_SECTION_PATH", "anchor": "long-tail keyword anchor", "type": "dofollow", "status": "pending", "domainAuthority": "high", "notes": "Outreach target: explain exactly what content to pitch to this site" },
    { "url": "https://REAL_DOMAIN.com/KNOWN_SECTION_PATH", "anchor": "brand + keyword", "type": "dofollow", "status": "pending", "domainAuthority": "high", "notes": "Outreach target: content pitch idea" },
    { "url": "https://REAL_DOMAIN.com/KNOWN_SECTION_PATH", "anchor": "product category keyword", "type": "dofollow", "status": "pending", "domainAuthority": "medium", "notes": "Outreach target: content pitch idea" },
    { "url": "https://reddit.com/r/RELEVANT_SUBREDDIT", "anchor": "question-based anchor", "type": "nofollow", "status": "pending", "domainAuthority": "high", "notes": "Community engagement: post helpful answer with product mention" },
    { "url": "https://www.trustpilot.com/review/buysial.com", "anchor": "buysial.com reviews", "type": "nofollow", "status": "pending", "domainAuthority": "high", "notes": "Review platform: encourage customer reviews to build brand authority" }
  ],
  "siteUrl": "${baseUrl}"
}

STRICT RULES — follow every rule or the output is wrong:

SEO TITLE: Primary long-tail BUYING keyword must be first word(s). Example: "Japan Sakura Cream UAE – Luminous Skin | Buysial". Never start with brand name. Max 60 chars.

SLUG: 3-5 words, primary keyword first, all lowercase, hyphens only. No brand name in slug unless part of keyword.

META DESCRIPTION: Count characters carefully. Must be 145-158 chars. First clause = primary keyword + benefit. Second clause = CTA ("Order now", "Shop today", "Free delivery UAE"). Third clause = trust signal ("Genuine product", "Fast shipping").

KEYWORDS: Include these 4 types — (A) short competitive: "japan sakura cream", "face cream UAE" — (B) buying-intent long-tail: "buy japan sakura cream online UAE", "best face moisturizer for dry skin KSA" — (C) question keywords: "which sakura cream is best for glowing skin", "where to buy authentic japan skincare in Dubai" — (D) geo-targeted: "japan sakura cream dubai", "sakura face cream riyadh delivery".

COUNTRY SEO: Generate entry for EVERY country in [${countriesList}]. ALL text in ENGLISH. Each country's metaTitle must include the country/city name and a buying intent word. Hreflang: en-AE (UAE), en-SA (KSA/Saudi Arabia), en-GB (UK), en-US (US), en-QA (Qatar), en-BH (Bahrain), en-KW (Kuwait), en-OM (Oman).

CANONICAL URL: Replace SLUG_HERE with the actual generated slug.

BACKLINKS — THIS IS AN OUTREACH TARGET LIST, NOT FAKE LINKS:
Use ONLY real, well-known domains that exist. Use ONLY their known section/category URLs — do NOT invent specific article paths or fake IDs.
Niche examples:
- Beauty/Skincare: allure.com/beauty, byrdie.com/skin, healthline.com/beauty, cosmopolitan.com/beauty, self.com/beauty, vogue.com/beauty
- Fashion/Style: whowhatwear.com, harpersbazaar.com/beauty
- Tech: techradar.com/reviews, cnet.com/reviews, tomsguide.com/reviews  
- Home/Lifestyle: houzz.com/ideabooks, apartmenttherapy.com
- Health/Fitness: menshealth.com/nutrition, womenshealthmag.com
- Q&A/Community: reddit.com/r/SkincareAddiction, reddit.com/r/AsianBeauty, quora.com/topic/Skin-Care
- UAE/KSA Authority: gulfnews.com/lifestyle, khaleejtimes.com/lifestyle, arabianbusiness.com
- Review/Directory: trustpilot.com/review/buysial.com, google.com/maps (Google Business)
Use the section/category URL as the target — the "notes" field explains what content to pitch/create for that site.
Generate 5 backlinks, first 3 dofollow from niche authorities, last 2 nofollow from communities/directories.`;

    const text = await this.generateContent(prompt);
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in AI response');
      return JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error('Failed to parse AI SEO response — please try again');
    }
  }

  // Compatibility method for existing checks
  async ensureInitialized() {
    const key = await this.getApiKey();
    return !!key;
  }
}

// Export singleton instance
export default new GeminiService();