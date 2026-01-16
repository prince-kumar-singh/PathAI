// Career name to domain mapper for Phase 1 → Phase 2 integration
// Fixed version with robust normalization and NO silent fallback

/**
 * CareerDomain Enum - Type-safe domain identifiers
 * @readonly
 * @enum {string}
 */
export const CareerDomain = Object.freeze({
    SOFTWARE_DEVELOPMENT: "software_development",
    DATA_SCIENCE_AI: "data_science_ai",
    PRODUCT_MANAGEMENT_UX: "product_management_ux"
});

/**
 * Custom error for career resolution failures
 * Thrown when a career string cannot be mapped to a valid domain
 */
export class CareerResolutionError extends Error {
    constructor(message, originalCareer) {
        super(message);
        this.name = 'CareerResolutionError';
        this.originalCareer = originalCareer;
    }
}

/**
 * Normalizes a career string for consistent matching
 * Handles common variations from upstream APIs:
 * - "Data Science & AI" → "data_science_and_ai"
 * - "Project Management / UX" → "project_management_ux"
 * - "Software Development" → "software_development"
 * 
 * @param {string} career - Raw career string from API
 * @returns {string|null} Normalized string or null if invalid
 */
function normalizeCareerString(career) {
    if (!career || typeof career !== 'string') {
        return null;
    }

    return career
        .toLowerCase()
        .trim()
        .replace(/&/g, 'and')        // & → and (fixes "Data Science & AI")
        .replace(/\//g, ' ')          // / → space (fixes "PM / UX")
        .replace(/\s+/g, '_')         // spaces → underscore
        .replace(/_+/g, '_')          // collapse multiple underscores
        .replace(/^_|_$/g, '');       // trim leading/trailing underscores
}

/**
 * Resolves a career string to a CareerDomain enum value
 * 
 * IMPORTANT: This function does NOT have a silent fallback.
 * It throws CareerResolutionError for unknown careers.
 * 
 * @param {string} careerString - Career string from upstream API
 * @returns {string} CareerDomain enum value
 * @throws {CareerResolutionError} If career cannot be resolved
 * 
 * @example
 * resolveCareerDomain("Data Science & AI") // → "data_science_ai"
 * resolveCareerDomain("Unknown Career")    // throws CareerResolutionError
 */
export function resolveCareerDomain(careerString) {
    const normalized = normalizeCareerString(careerString);

    if (!normalized) {
        throw new CareerResolutionError(
            `Career string is null, undefined, or not a string`,
            careerString
        );
    }

    console.log(`🔍 Resolving career: "${careerString}" → normalized: "${normalized}"`);

    // Pattern matching for Software Development
    if (normalized.includes('software') && normalized.includes('development')) {
        console.log(`✅ Resolved to: ${CareerDomain.SOFTWARE_DEVELOPMENT}`);
        return CareerDomain.SOFTWARE_DEVELOPMENT;
    }

    // Pattern matching for Data Science & AI
    if (normalized.includes('data') && (normalized.includes('science') || normalized.includes('ai'))) {
        console.log(`✅ Resolved to: ${CareerDomain.DATA_SCIENCE_AI}`);
        return CareerDomain.DATA_SCIENCE_AI;
    }

    // Pattern matching for Product Management / UX
    // Matches: "Product Management / UX", "Project Management / UX", "PM/UX", "UX Design"
    if (
        (normalized.includes('product') || normalized.includes('project')) &&
        (normalized.includes('management') || normalized.includes('ux'))
    ) {
        console.log(`✅ Resolved to: ${CareerDomain.PRODUCT_MANAGEMENT_UX}`);
        return CareerDomain.PRODUCT_MANAGEMENT_UX;
    }

    // Also match standalone UX mentions
    if (normalized.includes('ux') || normalized.includes('user_experience')) {
        console.log(`✅ Resolved to: ${CareerDomain.PRODUCT_MANAGEMENT_UX}`);
        return CareerDomain.PRODUCT_MANAGEMENT_UX;
    }

    // ❌ NO SILENT FALLBACK - throw explicit error
    console.error(`❌ Career resolution FAILED for: "${careerString}" (normalized: "${normalized}")`);
    console.error(`   Valid careers: Data Science & AI, Software Development, Project Management / UX`);

    throw new CareerResolutionError(
        `Unknown career: "${careerString}" (normalized: "${normalized}"). ` +
        `Valid careers are: Data Science & AI, Software Development, Project Management / UX`,
        careerString
    );
}

/**
 * Gets all valid career domains
 * @returns {string[]} Array of all CareerDomain values
 */
export function getAllDomains() {
    return Object.values(CareerDomain);
}

/**
 * Gets a human-readable display name for a domain
 * @param {string} domain - CareerDomain value
 * @returns {string} Human-readable name
 */
export function getDomainDisplayName(domain) {
    const displayNames = {
        [CareerDomain.SOFTWARE_DEVELOPMENT]: "Software Development",
        [CareerDomain.DATA_SCIENCE_AI]: "Data Science & AI",
        [CareerDomain.PRODUCT_MANAGEMENT_UX]: "Product Management & UX Design"
    };
    return displayNames[domain] || domain;
}

/**
 * Validates if a career string can be resolved to a valid domain
 * @param {string} careerString - Career string to validate
 * @returns {boolean} True if career can be resolved
 */
export function isValidCareer(careerString) {
    try {
        resolveCareerDomain(careerString);
        return true;
    } catch (error) {
        if (error instanceof CareerResolutionError) {
            return false;
        }
        throw error;
    }
}

/**
 * Domain subtopics for roadmap generation
 */
export const DOMAIN_SUBTOPICS = {
    [CareerDomain.SOFTWARE_DEVELOPMENT]: [
        "Frontend Development (React, HTML/CSS)",
        "Backend Development (Node.js, APIs)",
        "Databases (SQL, MongoDB)",
        "Version Control (Git)",
        "Testing & Debugging"
    ],
    [CareerDomain.DATA_SCIENCE_AI]: [
        "Python Programming",
        "Data Analysis (Pandas, NumPy)",
        "Machine Learning (Scikit-learn)",
        "Deep Learning (TensorFlow/PyTorch)",
        "Data Visualization"
    ],
    [CareerDomain.PRODUCT_MANAGEMENT_UX]: [
        "User Research & Personas",
        "Wireframing & Prototyping (Figma)",
        "Product Strategy & Roadmapping",
        "UX Design Principles",
        "Usability Testing"
    ]
};

/**
 * Get subtopics for a domain
 * @param {string} domain - CareerDomain value
 * @returns {string[]} Array of subtopics
 */
export function getDomainSubtopics(domain) {
    return DOMAIN_SUBTOPICS[domain] || [];
}

// ============================================================================
// DEPRECATED FUNCTIONS - Maintained for backward compatibility
// ============================================================================

/**
 * @deprecated Use resolveCareerDomain() instead.
 * This function has a silent fallback which is an anti-pattern.
 * 
 * Maps Phase 1 career path to Phase 2 learning domain
 * @param {string} careerName - Career string from Phase 1 API
 * @returns {string} Domain identifier for Phase 2
 */
export function mapCareerToDomain(careerName) {
    try {
        return resolveCareerDomain(careerName);
    } catch (error) {
        if (error instanceof CareerResolutionError) {
            console.warn(`⚠️ DEPRECATED mapCareerToDomain() used with failed resolution`);
            console.warn(`   Error: ${error.message}`);
            console.warn(`   Falling back to: ${CareerDomain.SOFTWARE_DEVELOPMENT}`);
            console.warn(`   ⚠️ Please migrate to resolveCareerDomain() for proper error handling`);
            return CareerDomain.SOFTWARE_DEVELOPMENT;
        }
        throw error;
    }
}

/**
 * @deprecated Use isValidCareer() instead
 */
export function isValidPhase1Career(careerName) {
    return isValidCareer(careerName);
}

// Legacy mapping object (for reference only)
export const CAREER_DOMAIN_MAPPING = {
    "software development": CareerDomain.SOFTWARE_DEVELOPMENT,
    "data science and ai": CareerDomain.DATA_SCIENCE_AI,
    "data science & ai": CareerDomain.DATA_SCIENCE_AI,
    "product management / ux": CareerDomain.PRODUCT_MANAGEMENT_UX,
    "project management / ux": CareerDomain.PRODUCT_MANAGEMENT_UX,
};

// Default export for convenience
export default {
    CareerDomain,
    CareerResolutionError,
    resolveCareerDomain,
    mapCareerToDomain, // deprecated
    getAllDomains,
    getDomainDisplayName,
    isValidCareer,
    isValidPhase1Career, // deprecated
    getDomainSubtopics,
    DOMAIN_SUBTOPICS,
    CAREER_DOMAIN_MAPPING
};
