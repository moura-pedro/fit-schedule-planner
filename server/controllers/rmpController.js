const axios = require('axios');
const cheerio = require('cheerio');

// Cache to store professor ratings to reduce API calls
const ratingsCache = {};

/**
 * Helper to normalize professor names for searching
 */
const normalizeNameForRMP = (name) => {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/dr\.|professor|prof\.|\s+jr\.|\s+sr\.|\s+[i]+$|\s+[i]v|\s+[v]$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Controller to get professor ratings from RateMyProfessors
 * Updated with better selector handling for the current RMP website structure
 */
const getRatingByProfessor = async (req, res) => {
  try {
    const { firstName, lastName, schoolId = "1449" } = req.query; // 1449 = Florida Institute of Technology
    
    if (!firstName || !lastName) {
      return res.status(400).json({ 
        error: 'Missing professor name parameters',
        found: false
      });
    }
    
    const cacheKey = `${firstName}_${lastName}_${schoolId}`;
    
    // Check cache first
    if (ratingsCache[cacheKey]) {
      return res.json(ratingsCache[cacheKey]);
    }
    
    // Try multiple approaches for better reliability
    let result = await searchByNameDirectly(firstName, lastName, schoolId);
    
    if (!result.found) {
      // Try searching the school's professors list page
      result = await searchSchoolProfessorsList(firstName, lastName, schoolId);
    }
    
    // Cache the result
    ratingsCache[cacheKey] = result;
    return res.json(result);
    
  } catch (error) {
    console.error('Error fetching RMP data:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch professor rating',
      found: false
    });
  }
};

/**
 * Search RMP by directly accessing a professor's page if we have their ID
 * This is a helper function to try known professor IDs
 */
const searchByProfessorId = async (professorId) => {
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Referer': 'https://www.ratemyprofessors.com',
      'Cache-Control': 'max-age=0',
    };
    
    const profPageUrl = `https://www.ratemyprofessors.com/professor/${professorId}`;
    const response = await axios.get(profPageUrl, { headers });
    const $ = cheerio.load(response.data);
    
    // Extract data from page
    // Try multiple selectors for better compatibility with site changes
    const avgRating = extractText($, [
      '.RatingValue__Numerator-qw8sqy-2',
      '.RatingValue__Average-q72jq1-1',
      '[data-testid="avgRatingValue"]',
      '.RatingValue'
    ]);
    
    const numRatings = extractText($, [
      '.RatingValue__NumRatings-qw8sqy-0',
      '[data-testid="ratingCount"]',
      '.RatingCount'
    ]);
    
    const difficulty = extractText($, [
      '.FeedbackItem__FeedbackNumber-uof32n-1',
      '[data-testid="difficulty-rating"]',
      '.DifficultyRating'
    ]);
    
    const wouldTakeAgain = extractText($, [
      '.FeedbackItem__FeedbackNumber-uof32n-1:eq(1)',
      '[data-testid="would-take-again-rating"]',
      '.WouldTakeAgain'
    ]);
    
    const department = extractText($, [
      '.NameTitle__Title-dowf0z-1',
      '[data-testid="TeacherDepartment"]',
      '.Department'
    ]);
    
    if (!avgRating) {
      return { found: false };
    }
    
    return {
      found: true,
      avgRating: avgRating || 'N/A',
      numRatings: numRatings ? numRatings.replace(/[^0-9]/g, '') : 0,
      difficulty: difficulty || 'N/A',
      wouldTakeAgain: wouldTakeAgain || 'N/A',
      department: department || '',
      profileUrl: profPageUrl
    };
  } catch (error) {
    console.error('Error searching by professor ID:', error);
    return { found: false };
  }
};

/**
 * Search RMP by professor name directly
 */
const searchByNameDirectly = async (firstName, lastName, schoolId) => {
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Referer': 'https://www.ratemyprofessors.com',
      'Cache-Control': 'max-age=0',
    };
    
    // Known professor IDs for Florida Tech
    // You can expand this list for frequently searched professors
    const knownProfessors = {
      'silaghi_marius': '606975',
      'chan_philip': '170305',
      // Add more as needed
    };
    
    const key = `${lastName.toLowerCase()}_${firstName.toLowerCase()}`;
    if (knownProfessors[key]) {
      // Try to use known ID first
      const result = await searchByProfessorId(knownProfessors[key]);
      if (result.found) return result;
    }
    
    // Search for the professor using the search page
    const searchUrl = `https://www.ratemyprofessors.com/search/professors/${schoolId}?q=${encodeURIComponent(firstName)}%20${encodeURIComponent(lastName)}`;
    
    const response = await axios.get(searchUrl, { headers });
    const $ = cheerio.load(response.data);
    
    // Try to find professor card using multiple selectors
    // RMP site structure changes frequently, so we try several possible selectors
    const professorCard = findElement($, [
      'a[href*="/professor/"]',
      '.TeacherCard__StyledTeacherCard',
      '.TeacherCard'
    ]);
    
    if (!professorCard.length) {
      return { found: false };
    }
    
    // Extract professor ID from the URL
    const cardHref = professorCard.attr('href');
    if (!cardHref) return { found: false };
    
    const professorId = cardHref.split('/').pop();
    
    // Now fetch the professor's detail page
    return await searchByProfessorId(professorId);
    
  } catch (error) {
    console.error('Error searching by name:', error);
    return { found: false };
  }
};

/**
 * Search through the school's professor list page
 * This is particularly useful for Florida Tech as they have a dedicated page listing all CS professors
 */
const searchSchoolProfessorsList = async (firstName, lastName, schoolId) => {
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Referer': 'https://www.ratemyprofessors.com',
      'Cache-Control': 'max-age=0',
    };
    
    // This URL is specifically for Florida Tech's Computer Science department
    // But you could modify it to work with any department or school
    const searchUrl = `https://www.ratemyprofessors.com/search/professors/4112?q=*&did=11`;
    
    const response = await axios.get(searchUrl, { headers });
    const $ = cheerio.load(response.data);
    
    // Search for the professor within the list
    const fullName = `${firstName} ${lastName}`.toLowerCase();
    let professorFound = false;
    let professorData = null;
    
    // Try to find all professor cards and iterate through them
    const professorCards = $('a[href*="/professor/"]');
    
    professorCards.each((index, element) => {
      const profName = $(element).text().toLowerCase();
      if (profName.includes(firstName.toLowerCase()) && profName.includes(lastName.toLowerCase())) {
        professorFound = true;
        
        // Extract rating from the card directly
        const cardContent = $(element).parent();
        
        // Try to extract the rating
        const qualityText = findText(cardContent, [
          '.quality',
          '[data-testid="quality-rating"]',
          '.ratingValue'
        ]);
        
        // Extract the professor ID for full details
        const href = $(element).attr('href');
        const professorId = href.split('/').pop();
        
        professorData = {
          found: true,
          avgRating: qualityText || 'N/A',
          numRatings: '0', // We'll get the full details later
          difficulty: 'N/A',
          wouldTakeAgain: 'N/A',
          department: 'Computer Science',
          profileUrl: `https://www.ratemyprofessors.com/professor/${professorId}`
        };
        
        // Break the loop
        return false;
      }
    });
    
    if (professorFound && professorData) {
      // If we've found the professor but don't have full details,
      // try to get them by accessing the professor's page
      const professorId = professorData.profileUrl.split('/').pop();
      const fullDetails = await searchByProfessorId(professorId);
      
      if (fullDetails.found) {
        return fullDetails;
      }
      
      return professorData;
    }
    
    return { found: false };
    
  } catch (error) {
    console.error('Error searching school professors list:', error);
    return { found: false };
  }
};

/**
 * Helper function to extract text using multiple possible selectors
 * Returns the first successful match
 */
const extractText = ($, selectors) => {
  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length) {
      return element.text().trim();
    }
  }
  return null;
};

/**
 * Helper function to find an element using multiple possible selectors
 * Returns the first successful match
 */
const findElement = ($, selectors) => {
  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length) {
      return element;
    }
  }
  return $('');
};

/**
 * Helper function to find text using multiple possible selectors
 * Returns the first successful match
 */
const findText = ($, selectors, element = null) => {
  const context = element || $;
  for (const selector of selectors) {
    const found = context.find(selector).first();
    if (found.length) {
      return found.text().trim();
    }
  }
  return null;
};

module.exports = {
  getRatingByProfessor
};
