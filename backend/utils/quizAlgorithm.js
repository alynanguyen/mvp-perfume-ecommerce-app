const quizMetadata = require('../data/quiz.json').metadata;

/**
 * Calculate match score between user answers and a product
 * Returns score (0-100) and reasons for the match
 */
function calculateMatchScore(userAnswers, product) {
  if (!userAnswers || !product) return { score: 0, reasons: ['Invalid data'] };

  let score = 0;
  let maxScore = 0;
  const reasons = [];

  // 1. Gender Match (20 points)
  maxScore += 20;
  if (product.gender && product.gender.length > 0 && userAnswers.gender) {
    const productGenders = product.gender.map(g => String(g).toLowerCase());
    const userGender = String(userAnswers.gender).toLowerCase();

    // If user wants unisex, all products match
    // If product is unisex, it matches all user preferences
    // If both are specific genders, they must match
    if (userGender === 'unisex' ||
        productGenders.includes('unisex') ||
        productGenders.includes(userGender)) {
      score += 20;
      reasons.push('Gender preference matches');
    } else {
      score += 5; // Partial score for different specific genders
    }
  }

  // 2. Vibe Match (15 points) - Check if product name is in vibe categories
  maxScore += 15;
  if (userAnswers.vibe && quizMetadata.vibe_categories[userAnswers.vibe]) {
    const vibeProducts = quizMetadata.vibe_categories[userAnswers.vibe].map(p => String(p).toLowerCase());
    if (product.name && vibeProducts.includes(String(product.name).toLowerCase())) {
      score += 15;
      reasons.push(`Perfect match for ${userAnswers.vibe} vibe`);
    } else {
      // Partial score if vibe keywords match in description
      const vibeKeywords = String(userAnswers.vibe).toLowerCase();
      if (product.description && product.description.toLowerCase().includes(vibeKeywords)) {
        score += 8;
      }
    }
  }

  // 3. Season Match (10 points)
  maxScore += 10;
  if (product.season && product.season.length > 0 && userAnswers.season && Array.isArray(userAnswers.season) && userAnswers.season.length > 0) {
    const productSeasons = product.season.map(s => String(s).toLowerCase());
    const userSeasons = userAnswers.season.map(s => String(s).toLowerCase());
    const matchingSeasons = productSeasons.filter(s =>
      userSeasons.includes(s) || userSeasons.includes('all-year')
    );

    if (matchingSeasons.length > 0) {
      score += 10;
      reasons.push(`Matches ${matchingSeasons.join(', ')} season preference`);
    } else {
      score += 3; // Partial score
    }
  }

  // 4. Occasion/Weather Match (10 points)
  maxScore += 10;
  if (product.weather && product.weather.length > 0 && userAnswers.occasion.length > 0) {
    const occasionMap = quizMetadata.occasion_map;
    const userWeatherTypes = [];

    userAnswers.occasion.forEach(occ => {
      if (occasionMap.day.includes(occ)) userWeatherTypes.push('day');
      if (occasionMap.evening.includes(occ)) userWeatherTypes.push('evening');
      if (occasionMap.night.includes(occ)) userWeatherTypes.push('night');
    });

    const productWeather = product.weather.map(w => String(w).toLowerCase());
    const matchingWeather = productWeather.filter(w => userWeatherTypes.includes(w));

    if (matchingWeather.length > 0) {
      score += 10;
      reasons.push('Suitable for your preferred occasions');
    } else {
      score += 3;
    }
  }

  // 5. Longevity Match (10 points)
  maxScore += 10;
  if (product.longevity && userAnswers.longevity_category) {
    const longevityRanges = {
      'Soft / Moderate': [0, 6],
      'Moderate / Strong': [6, 10],
      'Very Strong': [10, 24]
    };

    const userRange = longevityRanges[userAnswers.longevity_category];
    if (userRange && product.longevity.min !== undefined && product.longevity.max !== undefined) {
      const productAvg = (product.longevity.min + product.longevity.max) / 2;
      if (productAvg >= userRange[0] && productAvg <= userRange[1]) {
        score += 10;
        reasons.push('Longevity matches your preference');
      } else if (Math.abs(productAvg - userRange[0]) <= 2 || Math.abs(productAvg - userRange[1]) <= 2) {
        score += 6;
      }
    }
  }

  // 6. Accords Match (15 points)
  maxScore += 15;
  if (product.accords && product.accords.length > 0 && userAnswers.accords.length > 0) {
    const userAccords = userAnswers.accords.map(a => String(a).toLowerCase());
    const productAccords = product.accords.map(a => String(a).toLowerCase());

    // Expand user accords using metadata
    const expandedUserAccords = new Set();
    userAccords.forEach(accord => {
      expandedUserAccords.add(accord);
      if (quizMetadata.accord_categories[accord]) {
        quizMetadata.accord_categories[accord].forEach(subAccord => {
          expandedUserAccords.add(subAccord.toLowerCase());
        });
      }
    });

    const matchingAccords = productAccords.filter(accord =>
      expandedUserAccords.has(accord) ||
      Array.from(expandedUserAccords).some(userAccord => accord.includes(userAccord) || userAccord.includes(accord))
    );

    if (matchingAccords.length > 0) {
      const accordScore = Math.min(15, (matchingAccords.length / userAnswers.accords.length) * 15);
      score += accordScore;
      reasons.push(`Contains ${matchingAccords.length} preferred accord(s)`);
    }
  }

  // 7. Notes Match (15 points) - Check liked notes
  maxScore += 15;
  if (userAnswers.liked_notes && userAnswers.liked_notes.length > 0) {
    const allProductNotes = [
      ...(product.notes.top_notes || []),
      ...(product.notes.middle_notes || []),
      ...(product.notes.base_notes || [])
    ].map(n => n.toLowerCase());

    // Expand user liked notes using metadata
    const expandedLikedNotes = new Set();
    userAnswers.liked_notes.forEach(noteCategory => {
      if (quizMetadata.note_categories[noteCategory]) {
        quizMetadata.note_categories[noteCategory].forEach(note => {
          expandedLikedNotes.add(note.toLowerCase());
        });
      }
      expandedLikedNotes.add(noteCategory.toLowerCase());
    });

    const matchingNotes = allProductNotes.filter(note =>
      Array.from(expandedLikedNotes).some(likedNote =>
        note.includes(likedNote) || likedNote.includes(note)
      )
    );

    if (matchingNotes.length > 0) {
      const notesScore = Math.min(15, (matchingNotes.length / Math.max(userAnswers.liked_notes.length, 3)) * 15);
      score += notesScore;
      reasons.push(`Contains ${matchingNotes.length} preferred note(s)`);
    }
  }

  // 8. Disliked Notes Penalty (-20 points)
  if (userAnswers.disliked_notes && userAnswers.disliked_notes.length > 0) {
    const allProductNotes = [
      ...(product.notes.top_notes || []),
      ...(product.notes.middle_notes || []),
      ...(product.notes.base_notes || [])
    ].map(n => n.toLowerCase());

    const expandedDislikedNotes = new Set();
    userAnswers.disliked_notes.forEach(noteCategory => {
      if (quizMetadata.note_categories[noteCategory]) {
        quizMetadata.note_categories[noteCategory].forEach(note => {
          expandedDislikedNotes.add(note.toLowerCase());
        });
      }
      expandedDislikedNotes.add(noteCategory.toLowerCase());
    });

    const hasDislikedNotes = allProductNotes.some(note =>
      Array.from(expandedDislikedNotes).some(dislikedNote =>
        note.includes(dislikedNote) || dislikedNote.includes(note)
      )
    );

    if (hasDislikedNotes) {
      score -= 20;
      reasons.push('Contains notes you dislike');
    }
  }

  // 9. Price Match (5 points)
  maxScore += 5;
  if (userAnswers.price && userAnswers.price.range && product.price && product.price.length > 0) {
    const [minPrice, maxPrice] = userAnswers.price.range;
    const productPrices = product.price.filter(p => p >= minPrice && p <= maxPrice);

    if (productPrices.length > 0) {
      score += 5;
      reasons.push('Within your price range');
    } else {
      // Check if close to range
      const minProductPrice = Math.min(...product.price);
      const maxProductPrice = Math.max(...product.price);
      if ((minProductPrice >= minPrice * 0.8 && minProductPrice <= maxPrice * 1.2) ||
          (maxProductPrice >= minPrice * 0.8 && maxProductPrice <= maxPrice * 1.2)) {
        score += 2;
      }
    }
  }

  // Ensure score is between 0 and 100
  const finalScore = Math.max(0, Math.min(100, Math.round((score / maxScore) * 100)));

  return {
    score: finalScore,
    reasons: reasons.length > 0 ? reasons : ['General match']
  };
}

/**
 * Get top N product recommendations based on user answers
 */
function getRecommendations(userAnswers, products, topN = 3) {
  const scoredProducts = products.map(product => {
    const { score, reasons } = calculateMatchScore(userAnswers, product);
    return {
      product: product._id || product,
      matchScore: score,
      reasons
    };
  });

  // Sort by score descending and return top N
  return scoredProducts
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, topN);
}

module.exports = {
  calculateMatchScore,
  getRecommendations
};

