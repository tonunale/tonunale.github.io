const originalSkiData = {
  title: document.title,
  header: document.getElementById('styleName').textContent,
  hero: {
    headline: document.getElementById('heroTitle').textContent,
    description: document.getElementById('heroDesc').textContent,
    image: 'img/alpineSki.jpeg'
  },
  sections: {
    overview: {
      title: document.getElementById('sec1Title').textContent,
      subtitle: document.getElementById('sec1Subtitle').textContent,
      cards: Array.from(document.querySelectorAll('#sec1Grid .card')).map(card => ({
        title: card.querySelector('h3').textContent,
        description: card.querySelector('p').textContent
      }))
    },
    equipment: {
      title: document.getElementById('sec2Title').textContent,
      subtitle: document.getElementById('sec2Subtitle').textContent,
      cards: Array.from(document.querySelectorAll('#sec2Grid .card')).map(card => ({
        title: card.querySelector('h3').textContent,
        description: card.querySelector('p').textContent
      }))
    }
  }
};

let isSnowboarding = false;

/**
 * Function 1: Fetch the JSON data from js/boardingData.json
 */
async function fetchBoardingData() {
  try {
    const response = await fetch('js/boardingData.json');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching boardingData.json:', error);
  }
}

/**
 * Function 2: Update the DOM text and CSS background variable without changing HTML elements
 */
function updatePageContent(data) {
  if (!data) return;

  // 1. Update Document Title & Header Title
  document.title = data.title;
  document.getElementById('styleName').textContent = data.header;

  // 2. Update Hero Text
  document.getElementById('heroTitle').textContent = data.hero.headline;
  document.getElementById('heroDesc').textContent = data.hero.description;

  // 3. Update Hero Background Image CSS Variable using .style.setProperty
  // Inline styles on index.html resolve paths relative to index.html ('img/alpineBoarding.jpg').
  // Normalizing '../img/' -> 'img/' guarantees the image renders properly on GitHub Pages.
  const heroSection = document.getElementById('heroSection');
  const resolvedImgPath = data.hero.image.replace(/^\.\.\//, '');
  heroSection.style.setProperty('--hero-img', `url('${resolvedImgPath}')`);

  // 4. Update Section 1 (Overview) Title, Subtitle, and Cards
  document.getElementById('sec1Title').textContent = data.sections.overview.title;
  document.getElementById('sec1Subtitle').textContent = data.sections.overview.subtitle;

  const sec1Cards = document.querySelectorAll('#sec1Grid .card');
  data.sections.overview.cards.forEach((cardData, index) => {
    if (sec1Cards[index]) {
      sec1Cards[index].querySelector('h3').textContent = cardData.title;
      sec1Cards[index].querySelector('p').textContent = cardData.description;
    }
  });

  // 5. Update Section 2 (Equipment) Title, Subtitle, and Cards
  document.getElementById('sec2Title').textContent = data.sections.equipment.title;
  document.getElementById('sec2Subtitle').textContent = data.sections.equipment.subtitle;

  const sec2Cards = document.querySelectorAll('#sec2Grid .card');
  data.sections.equipment.cards.forEach((cardData, index) => {
    if (sec2Cards[index]) {
      sec2Cards[index].querySelector('h3').textContent = cardData.title;
      sec2Cards[index].querySelector('p').textContent = cardData.description;
    }
  });
}

/**
 * Function 3: Handle switching content when clicking the "Change" button
 */
async function handleThemeChange() {
  if (!isSnowboarding) {
    const boardingData = await fetchBoardingData();
    if (boardingData) {
      updatePageContent(boardingData);
      isSnowboarding = true;
    }
  } else {
    updatePageContent(originalSkiData);
    isSnowboarding = false;
  }
}

// Attach event listener to the Change button
document.getElementById('changeThemeBtn').addEventListener('click', handleThemeChange);