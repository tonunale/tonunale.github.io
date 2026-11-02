// Region/crop explorer
const VIEW_REGIONS = "regions";
const VIEW_CROPS = "crops";
const VIEW_DETAIL = "detail";
const REGIONS_COLLECTION = "regions";
const RESEARCH_STORAGE_KEY = "agricultureResearchList";

let regionsCatalog = [];
let currentView = VIEW_REGIONS;
let selectedRegionId = null;
let selectedCropId = null;
let savedCropIds = [];

// Load saved crops
function loadSavedCropIds() {
    try {
        const rawValue = window.localStorage.getItem(RESEARCH_STORAGE_KEY);
        const parsed = JSON.parse(rawValue);
        if (!Array.isArray(parsed)) {
            return [];
        }
        return parsed.filter(function keepStrings(item) {
            return typeof item === "string" && item.length > 0;
        });
    } catch (error) {
        return [];
    }
}

// Save research list
function persistSavedCropIds() {
    try {
        window.localStorage.setItem(RESEARCH_STORAGE_KEY, JSON.stringify(savedCropIds));
    } catch (error) {
        
    }
}

// Clean region list
function normalizeRegions(regions) {
    return regions
        .map(function mapRegion(region) {
            return {
                id: region.id,
                name: region.name,
                summary: region.summary,
                image: region.image,
                imageAlt: region.imageAlt,
                crops: Array.isArray(region.crops) ? region.crops : []
            };
        })
        .sort(function sortByName(a, b) {
            return a.name.localeCompare(b.name);
        });
}

// Use local atlas data
function loadEmbeddedRegions() {
    if (typeof SEED_REGIONS_PAYLOAD === "undefined" || !SEED_REGIONS_PAYLOAD || !Array.isArray(SEED_REGIONS_PAYLOAD.regions)) {
        throw new Error("Embedded atlas data is missing. Include js/seed-data.js.");
    }
    return normalizeRegions(SEED_REGIONS_PAYLOAD.regions);
}

// Load regions from Firebase
function fetchRegionsFromFirebase() {
    return window.AgriFirebase.db.collection(REGIONS_COLLECTION).get()
        .then(function handleSnapshot(snapshot) {
            if (snapshot.empty) {
                return loadEmbeddedRegions();
            }

            const regions = [];
            snapshot.forEach(function collectDoc(doc) {
                const data = doc.data();
                regions.push({
                    id: data.id || doc.id,
                    name: data.name,
                    summary: data.summary,
                    image: data.image,
                    imageAlt: data.imageAlt,
                    crops: Array.isArray(data.crops) ? data.crops : []
                });
            });

            return normalizeRegions(regions);
        })
        .catch(function onFirestoreError(error) {
            const message = (error && error.message ? error.message : "").toLowerCase();
            if (message.indexOf("failed to fetch") !== -1 || message.indexOf("network") !== -1) {
                return loadEmbeddedRegions();
            }
            throw error;
        });
}

// Find region
function findRegionById(regionId) {
    return regionsCatalog.find(function matchRegion(region) {
        return region.id === regionId;
    });
}

// Find crop in region
function findCropById(region, cropId) {
    if (!region || !region.crops) {
        return undefined;
    }
    return region.crops.find(function matchCrop(crop) {
        return crop.id === cropId;
    });
}

// Find crop anywhere
function findCropLocation(cropId) {
    for (let index = 0; index < regionsCatalog.length; index += 1) {
        const region = regionsCatalog[index];
        const crop = findCropById(region, cropId);
        if (crop) {
            return { region: region, crop: crop };
        }
    }
    return null;
}

// Research tray HTML
function buildResearchTrayHtml() {
    if (savedCropIds.length === 0) {
        return (
            '<aside class="research-tray" aria-label="Research list">' +
                "<p><strong>Research list:</strong> Save crops from a dossier to compare them here.</p>" +
            "</aside>"
        );
    }

    const chipsHtml = savedCropIds.map(function buildChip(cropId) {
        const location = findCropLocation(cropId);
        const label = location ? location.crop.name : cropId;
        return (
            '<button type="button" class="research-chip" data-action="open-saved" data-crop-id="' +
            cropId +
            '" aria-label="Open saved dossier for ' + label + '">' +
            label +
            "</button>"
        );
    }).join("");

    return (
        '<aside class="research-tray" aria-label="Research list">' +
            "<p><strong>Research list (" + savedCropIds.length + ")</strong> — click a crop to reopen it, or compare saved picks.</p>" +
            '<div class="research-chip-row">' + chipsHtml + "</div>" +
            '<div class="research-actions">' +
                '<button type="button" class="btn btn-ghost" data-action="compare-saved">Compare saved</button>' +
                '<button type="button" class="btn btn-ghost" data-action="clear-research">Clear list</button>' +
            "</div>" +
        "</aside>"
    );
}

// Explorer status text
function setStatusMessage(message, isError) {
    const statusNode = document.getElementById("explore-status");
    if (!statusNode) {
        return;
    }
    statusNode.textContent = message;
    statusNode.classList.toggle("is-error", Boolean(isError));
}

// Step indicator HTML
function buildStepIndicatorHtml() {
    const regionStep = currentView === VIEW_REGIONS ? "is-active" : "is-complete";
    const cropStep = currentView === VIEW_CROPS
        ? "is-active"
        : (currentView === VIEW_DETAIL ? "is-complete" : "");
    const detailStep = currentView === VIEW_DETAIL ? "is-active" : "";

    return (
        '<ol class="step-indicator" aria-label="Explorer steps">' +
            '<li class="' + regionStep + '">1. Region</li>' +
            '<li class="' + cropStep + '">2. Crop</li>' +
            '<li class="' + detailStep + '">3. Details</li>' +
        "</ol>"
    );
}

// Show regions
function renderRegionChoices() {
    currentView = VIEW_REGIONS;
    selectedRegionId = null;
    selectedCropId = null;

    const panel = document.getElementById("explore-panel");
    if (!panel) {
        return;
    }

    const cardsHtml = regionsCatalog.map(function buildRegionCard(region) {
        return (
            '<article class="card is-interactive card--' + region.id + '">' +
                '<button type="button" class="card-button" data-action="select-region" data-region-id="' + region.id + '" aria-label="Explore ' + region.name + ' staple crops">' +
                    '<figure class="media-slot">' +
                        '<img src="' + region.image + '" alt="' + region.imageAlt + '">' +
                    "</figure>" +
                    '<div class="card-content">' +
                        "<h3>" + region.name + "</h3>" +
                        "<p>" + region.summary + "</p>" +
                        '<span class="card-arrow" aria-hidden="true">Choose →</span>' +
                    "</div>" +
                "</button>" +
            "</article>"
        );
    }).join("");

    panel.innerHTML =
        buildResearchTrayHtml() +
        buildStepIndicatorHtml() +
        '<div class="section-head">' +
            '<h2 id="explore-heading">Pick a <span class="highlight">region</span></h2>' +
            "<p>Select a culinary region to see the staple crops that define its food culture.</p>" +
        "</div>" +
        '<div class="grid-container" role="list">' + cardsHtml + "</div>";

    setStatusMessage("Showing " + regionsCatalog.length + " culinary regions. Choose one to continue.");
    const heading = document.getElementById("explore-heading");
    if (heading) {
        heading.focus();
    }
}

// Show crops
function renderCropChoices(regionId) {
    const region = findRegionById(regionId);
    if (!region) {
        setStatusMessage("That region could not be found.", true);
        renderRegionChoices();
        return;
    }

    currentView = VIEW_CROPS;
    selectedRegionId = region.id;
    selectedCropId = null;

    const panel = document.getElementById("explore-panel");
    if (!panel) {
        return;
    }

    const cardsHtml = region.crops.map(function buildCropCard(crop) {
        return (
            '<article class="card is-interactive">' +
                '<button type="button" class="card-button" data-action="select-crop" data-crop-id="' + crop.id + '" aria-label="Open dossier for ' + crop.name + '">' +
                    '<figure class="media-slot">' +
                        '<img src="' + crop.image + '" alt="' + crop.imageAlt + '">' +
                    "</figure>" +
                    '<div class="card-content">' +
                        "<h3>" + crop.name + "</h3>" +
                        "<p>" + crop.teaser + "</p>" +
                        '<span class="card-arrow" aria-hidden="true">Open →</span>' +
                    "</div>" +
                "</button>" +
            "</article>"
        );
    }).join("");

    panel.innerHTML =
        buildResearchTrayHtml() +
        buildStepIndicatorHtml() +
        '<div class="explore-toolbar">' +
            '<button type="button" class="btn btn-ghost" data-action="back-regions">← All regions</button>' +
        "</div>" +
        '<div class="section-head">' +
            '<h2 id="explore-heading" tabindex="-1">' + region.name + ' <span class="highlight">staples</span></h2>' +
            "<p>" + region.summary + " Choose a crop to open its research dossier.</p>" +
        "</div>" +
        '<div class="grid-container" role="list">' + cardsHtml + "</div>";

    setStatusMessage(region.name + " loaded. " + region.crops.length + " crops available.");
    const heading = document.getElementById("explore-heading");
    if (heading) {
        heading.focus();
    }
}

// Show crop detail
function renderCropDetail(regionId, cropId) {
    const region = findRegionById(regionId);
    const crop = findCropById(region, cropId);
    if (!region || !crop) {
        setStatusMessage("That crop could not be found.", true);
        renderCropChoices(regionId || selectedRegionId);
        return;
    }

    currentView = VIEW_DETAIL;
    selectedRegionId = region.id;
    selectedCropId = crop.id;

    const panel = document.getElementById("explore-panel");
    if (!panel) {
        return;
    }

    const isSaved = savedCropIds.indexOf(crop.id) !== -1;
    const saveLabel = isSaved ? "Saved to Research" : "Save to Research";

    panel.innerHTML =
        buildResearchTrayHtml() +
        buildStepIndicatorHtml() +
        '<div class="explore-toolbar">' +
            '<button type="button" class="btn btn-ghost" data-action="back-crops">← ' + region.name + " crops</button>" +
            '<button type="button" class="btn btn-ghost" data-action="back-regions">All regions</button>' +
        "</div>" +
        '<article class="crop-dossier">' +
            '<figure class="media-slot interactive-mockup">' +
                '<img src="' + crop.image + '" alt="' + crop.imageAlt + '">' +
                "<figcaption>" + crop.name + " · " + region.name + "</figcaption>" +
            "</figure>" +
            '<section aria-labelledby="crop-detail-heading">' +
                '<h2 id="explore-heading" tabindex="-1">' + crop.name + " <small>(" + crop.scientificName + ")</small></h2>" +
                '<div class="crop-facts">' +
                    "<p><strong>First cultivated:</strong> " + crop.firstCultivated + "</p>" +
                    "<p><strong>Optimal climate:</strong> " + crop.optimalClimate + "</p>" +
                    "<p><strong>Water requirement:</strong> " + crop.waterRequirement + "</p>" +
                    "<p><strong>Culinary region:</strong> " + region.name + "</p>" +
                "</div>" +
                "<p>" + crop.description + "</p>" +
                '<aside class="fun-fact">' +
                    "<strong>Quick fact</strong>" +
                    "<p>" + crop.quickFact + "</p>" +
                "</aside>" +
                '<div class="crop-actions">' +
                    '<button type="button" class="btn-save" data-action="save-crop" data-crop-id="' + crop.id + '">' + saveLabel + "</button>" +
                "</div>" +
            "</section>" +
        "</article>";

    setStatusMessage("Viewing " + crop.name + " from the " + region.name + " region.");
    const heading = document.getElementById("explore-heading");
    if (heading) {
        heading.focus();
    }
}

// Toggle saved crop
function toggleSavedCrop(cropId) {
    const existingIndex = savedCropIds.indexOf(cropId);
    if (existingIndex === -1) {
        savedCropIds.push(cropId);
        setStatusMessage("Added to your research list.");
    } else {
        savedCropIds.splice(existingIndex, 1);
        setStatusMessage("Removed from your research list.");
    }
    persistSavedCropIds();
    renderCropDetail(selectedRegionId, cropId);
}

// Open saved crop
function openSavedCrop(cropId) {
    const location = findCropLocation(cropId);
    if (!location) {
        setStatusMessage("That saved crop is no longer available.", true);
        return;
    }
    renderCropDetail(location.region.id, location.crop.id);
}

// Clear research list
function clearResearchList() {
    savedCropIds = [];
    persistSavedCropIds();
    if (currentView === VIEW_DETAIL && selectedRegionId && selectedCropId) {
        renderCropDetail(selectedRegionId, selectedCropId);
        return;
    }
    if (currentView === VIEW_CROPS && selectedRegionId) {
        renderCropChoices(selectedRegionId);
        return;
    }
    renderRegionChoices();
}

// Compare saved crops
function renderSavedComparison() {
    if (savedCropIds.length < 2) {
        setStatusMessage("Save at least two crops before comparing.", true);
        return;
    }

    const panel = document.getElementById("explore-panel");
    if (!panel) {
        return;
    }

    const cardsHtml = savedCropIds.map(function buildCompareCard(cropId) {
        const location = findCropLocation(cropId);
        if (!location) {
            return "";
        }
        const crop = location.crop;
        const region = location.region;
        return (
            '<article class="card compare-card">' +
                '<div class="card-content">' +
                    "<h3>" + crop.name + "</h3>" +
                    "<p><strong>Region:</strong> " + region.name + "</p>" +
                    "<p><strong>First cultivated:</strong> " + crop.firstCultivated + "</p>" +
                    "<p><strong>Climate:</strong> " + crop.optimalClimate + "</p>" +
                    "<p><strong>Water:</strong> " + crop.waterRequirement + "</p>" +
                    "<p>" + crop.quickFact + "</p>" +
                    '<button type="button" class="btn btn-primary" data-action="open-saved" data-crop-id="' +
                    crop.id +
                    '">Open dossier</button>' +
                "</div>" +
            "</article>"
        );
    }).join("");

    panel.innerHTML =
        buildResearchTrayHtml() +
        '<div class="explore-toolbar">' +
            '<button type="button" class="btn btn-ghost" data-action="back-regions">← Back to regions</button>' +
        "</div>" +
        '<div class="section-head">' +
            '<h2 id="explore-heading" tabindex="-1">Compare <span class="highlight">saved crops</span></h2>' +
            "<p>Side-by-side facts from your research list. Open any dossier to keep exploring.</p>" +
        "</div>" +
        '<div class="grid-container grid-container--three">' + cardsHtml + "</div>";

    setStatusMessage("Comparing " + savedCropIds.length + " saved crops.");
    const heading = document.getElementById("explore-heading");
    if (heading) {
        heading.focus();
    }
}

// Handle explorer clicks
function handleExploreClicks(event) {
    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) {
        return;
    }

    const actionName = actionButton.getAttribute("data-action");

    if (actionName === "select-region") {
        renderCropChoices(actionButton.getAttribute("data-region-id"));
        return;
    }

    if (actionName === "select-crop") {
        renderCropDetail(selectedRegionId, actionButton.getAttribute("data-crop-id"));
        return;
    }

    if (actionName === "back-regions") {
        renderRegionChoices();
        return;
    }

    if (actionName === "back-crops") {
        renderCropChoices(selectedRegionId);
        return;
    }

    if (actionName === "save-crop") {
        toggleSavedCrop(actionButton.getAttribute("data-crop-id"));
        return;
    }

    if (actionName === "open-saved") {
        openSavedCrop(actionButton.getAttribute("data-crop-id"));
        return;
    }

    if (actionName === "compare-saved") {
        renderSavedComparison();
        return;
    }

    if (actionName === "clear-research") {
        clearResearchList();
    }
}

// Show loading
function renderLoadingState() {
    const panel = document.getElementById("explore-panel");
    if (!panel) {
        return;
    }
    panel.innerHTML =
        '<div class="loading-panel" role="status">' +
            "<p><strong>Loading culinary regions…</strong></p>" +
        "</div>";
    setStatusMessage("Loading explorer data…");
}

// Show load error
function renderLoadError(error) {
    const panel = document.getElementById("explore-panel");
    if (!panel) {
        return;
    }
    const safeMessage = formatFirebaseError(error);
    const looksEmpty =
        safeMessage.toLowerCase().indexOf("no region") !== -1 ||
        safeMessage.toLowerCase().indexOf("seed.html") !== -1;

    panel.innerHTML =
        '<div class="error-panel" role="alert">' +
            "<h2>" + (looksEmpty ? "No explorer data yet" : "Could not load explorer data") + "</h2>" +
            "<p>" + safeMessage + "</p>" +
            "<ol class='next-steps'>" +
                "<li>Confirm you are signed in.</li>" +
                "<li>Upload the atlas from the <a href='seed.html'>upload page</a>.</li>" +
                "<li>Press Try again.</li>" +
            "</ol>" +
            '<div class="explore-toolbar">' +
                '<button type="button" class="btn btn-primary" data-action="retry-load">Try again</button>' +
                '<a class="btn btn-ghost" href="seed.html">Upload atlas</a>' +
            "</div>" +
        "</div>";
    setStatusMessage("Data failed to load. " + safeMessage, true);
}

// Start explorer
function startExplorer() {
    renderLoadingState();
    showWorkingSpinner("Loading regions…");

    fetchRegionsFromFirebase()
        .then(function onDataLoaded(regions) {
            hideWorkingSpinner();
            if (!regions.length) {
                throw new Error("Firestore returned no regions.");
            }
            regionsCatalog = regions;
            savedCropIds = savedCropIds.filter(function keepKnown(cropId) {
                return Boolean(findCropLocation(cropId));
            });
            persistSavedCropIds();
            renderRegionChoices();
        })
        .catch(function onDataError(error) {
            hideWorkingSpinner();
            renderLoadError(error);
        });
}

document.addEventListener("DOMContentLoaded", function onExploreReady() {
    const panel = document.getElementById("explore-panel");
    if (!panel) {
        return;
    }

    savedCropIds = loadSavedCropIds();

    panel.addEventListener("click", function onPanelClick(event) {
        const retryButton = event.target.closest('[data-action="retry-load"]');
        if (retryButton) {
            startExplorer();
            return;
        }
        handleExploreClicks(event);
    });

    window.AgriFirebase.auth.onAuthStateChanged(function startWhenSignedIn(user) {
        if (user) {
            startExplorer();
        }
    });
});
