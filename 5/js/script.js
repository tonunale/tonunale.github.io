const originalSkiData = {
  title: document.title,
  header: document.getElementById('styleName').textContent,
  hero: {
    headline: document.getElementById('heroTitle').textContent,
    description: document.getElementById('heroDesc').textContent,
    image: '../img/alpineSki.jpeg'
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

function updatePageContent(data) {
  if (!data) return;

  document.title = data.title;
  document.getElementById('styleName').textContent = data.header;

  document.getElementById('heroTitle').textContent = data.hero.headline;
  document.getElementById('heroDesc').textContent = data.hero.description;

  const heroSection = document.getElementById('heroSection');
  heroSection.style.setProperty('--hero-img', `url('${data.hero.image}')`);

  document.getElementById('sec1Title').textContent = data.sections.overview.title;
  document.getElementById('sec1Subtitle').textContent = data.sections.overview.subtitle;

  const sec1Cards = document.querySelectorAll('#sec1Grid .card');
  data.sections.overview.cards.forEach((cardData, index) => {
    if (sec1Cards[index]) {
      sec1Cards[index].querySelector('h3').textContent = cardData.title;
      sec1Cards[index].querySelector('p').textContent = cardData.description;
    }
  });

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

document.getElementById('changeThemeBtn').addEventListener('click', handleThemeChange);
