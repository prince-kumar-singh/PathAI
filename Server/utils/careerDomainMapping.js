// Career name to domain mapper for Phase 1 → Phase 2 integration

/**
 * IMPORTANT: Phase 1 only produces 3 career paths:
 * 1. "software development"
 * 2. "data science and AI"
 * 3. "product management /uX" (or "product management/UX")
 * 
 * This mapper translates Phase 1 career strings to Phase 2 learning domains
 */

/**
 * Phase 1 Career Paths → Phase 2 Learning Domains
 * Note: Case-insensitive matching is handled in mapCareerToDomain() function
 */
export const CAREER_DOMAIN_MAPPING = {
    "software development": "software_development",
    "data science and AI": "data_science_ai",
    "product management /uX": "product_ux",
};

/**
 * Maps Phase 1 career path to Phase 2 learning domain
 * @param {string} careerName - The exact career string from Phase 1 API
 * @returns {string} The domain identifier for Phase 2
 */
export function mapCareerToDomain(careerName) {
    if (!careerName) {
        console.warn("⚠️ No career name provided, using default domain");
        return "software_development"; // Default fallback
    }

    // Normalize the career name (trim whitespace)
    const normalizedCareer = careerName.trim();

    // Try exact match first
    const domain = CAREER_DOMAIN_MAPPING[normalizedCareer];

    if (domain) {
        console.log(`✅ Mapped "${normalizedCareer}" → "${domain}"`);
        return domain;
    }

    // Try case-insensitive match
    const lowerCareer = normalizedCareer.toLowerCase();
    for (const [key, value] of Object.entries(CAREER_DOMAIN_MAPPING)) {
        if (key.toLowerCase() === lowerCareer) {
            console.log(`✅ Case-insensitive match: "${normalizedCareer}" → "${value}"`);
            return value;
        }
    }

    // No match found - log warning and return default
    console.warn(`❌ Career "${normalizedCareer}" not found in mapping!`);
    console.warn(`   Valid Phase 1 careers: software development, data science and AI, product management /uX`);
    console.warn(`   Using default domain: software_development`);

    return "software_development"; // Safe fallback
}

/**
 * Gets all 3 domains available in Phase 2
 * @returns {string[]} Array of the 3 domain identifiers
 */
export function getAllDomains() {
    return ["software_development", "data_science_ai", "product_ux"];
}

/**
 * Gets human-readable name for a domain
 * @param {string} domain - The domain identifier
 * @returns {string} Human-readable domain name
 */
export function getDomainDisplayName(domain) {
    const displayNames = {
        "software_development": "Software Development",
        "data_science_ai": "Data Science & AI",
        "product_ux": "Product Management & UX Design"
    };
    return displayNames[domain] || domain;
}

/**
 * Validates if a career name is one of the 3 Phase 1 outputs
 * @param {string} careerName - The career name to validate
 * @returns {boolean} True if career is valid Phase 1 output
 */
export function isValidPhase1Career(careerName) {
    if (!careerName) return false;

    const normalized = careerName.trim().toLowerCase();

    // Check against the 3 expected Phase 1 outputs
    return (
        normalized.includes("software development") ||
        normalized.includes("data science") ||
        normalized.includes("product management")
    );
}

/**
 * Gets the Phase 2 domain breakdown for each Phase 1 career
 * This shows what sub-topics will be covered in the 10-day roadmap
 */
export const DOMAIN_SUBTOPICS = {
    "software_development": [
        "Frontend Development (React, HTML/CSS)",
        "Backend Development (Node.js, APIs)",
        "Databases (SQL, MongoDB)",
        "Version Control (Git)",
        "Testing & Debugging"
    ],
    "data_science_ai": [
        "Python Programming",
        "Data Analysis (Pandas, NumPy)",
        "Machine Learning (Scikit-learn)",
        "Deep Learning (TensorFlow/PyTorch)",
        "Data Visualization"
    ],
    "product_ux": [
        "User Research & Personas",
        "Wireframing & Prototyping (Figma)",
        "Product Strategy & Roadmapping",
        "UX Design Principles",
        "Usability Testing"
    ]
};

/**
 * Get subtopics for a domain
 * @param {string} domain - The domain identifier
 * @returns {string[]} Array of subtopics
 */
export function getDomainSubtopics(domain) {
    return DOMAIN_SUBTOPICS[domain] || [];
}

// Export for use in other modules
export default {
    CAREER_DOMAIN_MAPPING,
    mapCareerToDomain,
    getAllDomains,
    getDomainDisplayName,
    isValidPhase1Career,
    getDomainSubtopics,
    DOMAIN_SUBTOPICS
};
