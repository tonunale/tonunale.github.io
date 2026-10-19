/**
 * Two-step interactive explorer for AgriCulture.
 * Step 1: choose a culinary region (DOM update, no page navigation).
 * Step 2: choose a staple crop and view its full dossier.
 */

const REGIONS_DATA_URL = "data/regions.json";
const VIEW_REGIONS = "regions";
const VIEW_CROPS = "crops";
const VIEW_DETAIL = "detail";

let regionsCatalog = [];
let currentView = VIEW_REGIONS;
let selectedRegionId = null;
let selectedCropId = null;
let savedCropIds = [];

/**
 * Loads region/crop JSON via fetch (Promise-based AJAX).
 * @returns {Promise<object>} Parsed JSON payload
 */
function fetchRegionsData() {
    return fetch(REGIONS_DATA_URL)
        .then(function handleResponse(response) {
            if (!response.ok) {
                throw new Error("Could not load crop data (HTTP " + response.status + ").");
            }
            return response.json();
        });
}

/**
 * Finds a region object by id.
 * @param {string} regionId
 * @returns {object|undefined}
 */
function findRegionById(regionId) {
    return regionsCatalog.find(function matchRegion(region) {
        return region.id === regionId;
    });
}

/**
 * Finds a crop inside a region by id.
 * @param {object} region
 * @param {string} cropId
 * @returns {object|undefined}
 */
function findCropById(region, cropId) {
    if (!region || !region.crops) {
        return undefined;
    }
    return region.crops.find(function matchCrop(crop) {
        return crop.id === cropId;
    });
}

/**
 * Updates the live status text for screen readers and loading feedback.
 * @param {string} message
 * @param {boolean} [isError]
 */
function setStatusMessage(message, isError) {
    const statusNode = document.getElementById("explore-status");
    if (!statusNode) {
        return;
    }
    statusNode.textContent = message;
    statusNode.classList.toggle("is-error", Boolean(isError));
}

/**
 * Builds a breadcrumb / step indicator for the current view.
 * @returns {string} HTML string
 */
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

/**
 * Renders the region selection grid (step 1).
 */
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

/**
 * Renders crop choices for the selected region (step 2a).
 * @param {string} regionId
 */
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

/**
 * Renders the full crop dossier (step 2b / final information).
 * @param {string} regionId
 * @param {string} cropId
 */
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

/**
 * Toggles a crop id in the local research list for this session.
 * @param {string} cropId
 */
function toggleSavedCrop(cropId) {
    const existingIndex = savedCropIds.indexOf(cropId);
    if (existingIndex === -1) {
        savedCropIds.push(cropId);
    } else {
        savedCropIds.splice(existingIndex, 1);
    }
    renderCropDetail(selectedRegionId, cropId);
}

/**
 * Handles clicks inside the explore panel using event delegation.
 * @param {MouseEvent} event
 */
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
    }
}

/**
 * Shows a loading state while the JSON request is in flight.
 */
function renderLoadingState() {
    const panel = document.getElementById("explore-panel");
    if (!panel) {
        return;
    }
    panel.innerHTML =
        '<div class="loading-panel" role="status">' +
            "<p><strong>Loading culinary regions…</strong></p>" +
            "<p>You can keep browsing other pages while this finishes.</p>" +
        "</div>";
    setStatusMessage("Loading external crop data…");
}

/**
 * Shows a recoverable error when JSON fails to load.
 * @param {Error} error
 */
function renderLoadError(error) {
    const panel = document.getElementById("explore-panel");
    if (!panel) {
        return;
    }
    const safeMessage = error && error.message ? error.message : "Unknown error.";
    panel.innerHTML =
        '<div class="error-panel" role="alert">' +
            "<h2>Could not load explorer data</h2>" +
            "<p>" + safeMessage + "</p>" +
            '<button type="button" class="btn btn-primary" data-action="retry-load">Try again</button>' +
        "</div>";
    setStatusMessage("Data failed to load. " + safeMessage, true);
}

/**
 * Starts (or retries) the AJAX load, then renders step 1.
 */
function startExplorer() {
    renderLoadingState();
    fetchRegionsData()
        .then(function onDataLoaded(payload) {
            if (!payload || !Array.isArray(payload.regions) || payload.regions.length === 0) {
                throw new Error("The data file did not include any regions.");
            }
            regionsCatalog = payload.regions;
            renderRegionChoices();
        })
        .catch(function onDataError(error) {
            renderLoadError(error);
        });
}

document.addEventListener("DOMContentLoaded", function onExploreReady() {
    const panel = document.getElementById("explore-panel");
    if (!panel) {
        return;
    }

    panel.addEventListener("click", function onPanelClick(event) {
        const retryButton = event.target.closest('[data-action="retry-load"]');
        if (retryButton) {
            startExplorer();
            return;
        }
        handleExploreClicks(event);
    });

    startExplorer();
});
