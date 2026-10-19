/**
 * Loads and renders the static staples comparison table from JSON.
 * This dataset is separate from the interactive region explorer data.
 */

const STAPLES_DATA_URL = "data/staples.json";

/**
 * Requests staples yield data with fetch().
 * @returns {Promise<object>}
 */
function fetchStaplesData() {
    return fetch(STAPLES_DATA_URL)
        .then(function handleResponse(response) {
            if (!response.ok) {
                throw new Error("Could not load staples data (HTTP " + response.status + ").");
            }
            return response.json();
        });
}

/**
 * Formats a number with thousands separators for display.
 * @param {number} value
 * @returns {string}
 */
function formatYieldNumber(value) {
    return Number(value).toLocaleString("en-US");
}

/**
 * Builds table rows from staples crop records.
 * @param {Array<object>} crops
 * @returns {string}
 */
function buildStapleRowsHtml(crops) {
    return crops.map(function buildRow(crop) {
        return (
            "<tr>" +
                '<th scope="row">' + crop.name + "</th>" +
                "<td>" + crop.primaryRegion + "</td>" +
                "<td>" +
                    '<div class="bar-cell">' +
                        '<span class="bar" style="--w:' + crop.barPercent + '%"></span>' +
                        '<span class="num">' + formatYieldNumber(crop.annualYieldMt) + "</span>" +
                    "</div>" +
                "</td>" +
                "<td>" + crop.growthCycle + "</td>" +
            "</tr>"
        );
    }).join("");
}

/**
 * Renders the staples table into the page.
 * @param {object} payload
 */
function renderStaplesTable(payload) {
    const mountNode = document.getElementById("staples-mount");
    if (!mountNode) {
        return;
    }

    mountNode.innerHTML =
        '<div class="section-head">' +
            "<h1>" + payload.title + "</h1>" +
            "<p>" + payload.subtitle + "</p>" +
        "</div>" +
        '<div class="table-wrap">' +
            "<table>" +
                "<caption>Estimated annual cereal and staple yields by crop and region</caption>" +
                "<thead>" +
                    "<tr>" +
                        '<th scope="col">Crop</th>' +
                        '<th scope="col">Primary region</th>' +
                        '<th scope="col">Annual yield (millions of tonnes)</th>' +
                        '<th scope="col">Growth cycle</th>' +
                    "</tr>" +
                "</thead>" +
                "<tbody>" + buildStapleRowsHtml(payload.crops) + "</tbody>" +
            "</table>" +
        "</div>";
}

/**
 * Shows loading text while staples.json is requested.
 */
function renderStaplesLoading() {
    const mountNode = document.getElementById("staples-mount");
    if (!mountNode) {
        return;
    }
    mountNode.innerHTML =
        '<div class="loading-panel" role="status">' +
            "<p><strong>Loading staple production data…</strong></p>" +
        "</div>";
}

/**
 * Shows an error with a retry control when staples.json fails.
 * @param {Error} error
 */
function renderStaplesError(error) {
    const mountNode = document.getElementById("staples-mount");
    if (!mountNode) {
        return;
    }
    const safeMessage = error && error.message ? error.message : "Unknown error.";
    mountNode.innerHTML =
        '<div class="error-panel" role="alert">' +
            "<h2>Could not load staples data</h2>" +
            "<p>" + safeMessage + "</p>" +
            '<button type="button" class="btn btn-primary" id="retry-staples">Try again</button>' +
        "</div>";

    const retryButton = document.getElementById("retry-staples");
    if (retryButton) {
        retryButton.addEventListener("click", startStaplesPage);
    }
}

/**
 * Starts the staples page data load.
 */
function startStaplesPage() {
    renderStaplesLoading();
    fetchStaplesData()
        .then(function onLoaded(payload) {
            if (!payload || !Array.isArray(payload.crops) || payload.crops.length === 0) {
                throw new Error("The staples file did not include crop rows.");
            }
            renderStaplesTable(payload);
        })
        .catch(function onError(error) {
            renderStaplesError(error);
        });
}

document.addEventListener("DOMContentLoaded", startStaplesPage);
