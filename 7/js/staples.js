// Staples table
const STAPLES_DATA_URL = "data/staples.json";
const STAPLE_REGIONS = ["Americas", "Asia", "Europe", "Africa"];

let staplesPayload = null;
let staplesSortKey = "annualYieldMt";
let staplesSortAscending = false;
let selectedStapleName = null;
let staplesRegionFilter = "all";

// Local staples data
function getStaplesFallbackPayload() {
    if (typeof STAPLES_FALLBACK_PAYLOAD === "undefined" || !STAPLES_FALLBACK_PAYLOAD) {
        throw new Error("Staples fallback data did not load. Include js/staples-data.js.");
    }
    return STAPLES_FALLBACK_PAYLOAD;
}

// Load staples data
function fetchStaplesData() {
    return fetch(STAPLES_DATA_URL)
        .then(function handleResponse(response) {
            if (!response.ok) {
                throw new Error("Could not load staples data (HTTP " + response.status + ").");
            }
            return response.json();
        })
        .catch(function onFetchError() {
            return getStaplesFallbackPayload();
        });
}

// Format number
function formatYieldNumber(value) {
    return Number(value).toLocaleString("en-US");
}

// Filter and sort rows
function getVisibleStaples(crops) {
    const filtered = crops.filter(function matchRegion(crop) {
        if (staplesRegionFilter === "all") {
            return true;
        }
        return crop.primaryRegion === staplesRegionFilter;
    });

    filtered.sort(function compareRows(a, b) {
        const left = a[staplesSortKey];
        const right = b[staplesSortKey];

        if (typeof left === "number" && typeof right === "number") {
            return staplesSortAscending ? left - right : right - left;
        }

        const leftText = String(left).toLowerCase();
        const rightText = String(right).toLowerCase();
        if (leftText < rightText) {
            return staplesSortAscending ? -1 : 1;
        }
        if (leftText > rightText) {
            return staplesSortAscending ? 1 : -1;
        }
        return 0;
    });

    return filtered;
}

// Sortable header
function buildSortHeader(label, sortKey) {
    const isActive = staplesSortKey === sortKey;
    const arrow = isActive ? (staplesSortAscending ? " ↑" : " ↓") : "";
    const pressed = isActive ? "true" : "false";
    const directionHint = isActive
        ? (staplesSortAscending ? ", currently ascending" : ", currently descending")
        : "";
    return (
        '<th scope="col">' +
            '<button type="button" class="sort-button' + (isActive ? " is-active" : "") +
            '" data-sort-key="' + sortKey +
            '" aria-pressed="' + pressed +
            '" aria-label="Sort by ' + label + directionHint + '">' +
            label + arrow +
            "</button>" +
        "</th>"
    );
}

// Region filter buttons
function buildRegionFilterHtml() {
    const options = ["all"].concat(STAPLE_REGIONS);
    const buttons = options.map(function buildFilter(option) {
        const label = option === "all" ? "All regions" : option;
        const isActive = staplesRegionFilter === option;
        return (
            '<button type="button" class="filter-chip' + (isActive ? " is-active" : "") +
            '" data-region-filter="' + option +
            '" aria-pressed="' + (isActive ? "true" : "false") +
            '" aria-label="Filter staples by ' + label + '">' +
            label +
            "</button>"
        );
    }).join("");

    return (
        '<div class="staples-filters" role="group" aria-label="Filter by culinary region">' +
            buttons +
        "</div>"
    );
}

// Table rows HTML
function buildStapleRowsHtml(crops) {
    if (crops.length === 0) {
        return (
            '<tr class="empty-row">' +
                '<td colspan="4">No staples match this region filter. Choose another region or All regions.</td>' +
            "</tr>"
        );
    }

    return crops.map(function buildRow(crop) {
        const isSelected = selectedStapleName === crop.name;
        return (
            '<tr class="' + (isSelected ? "is-selected" : "") +
            '" data-crop-name="' + crop.name +
            '" tabindex="0" aria-label="Select ' + crop.name + ' for details">' +
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

// Selection status text
function updateSelectionSummary(visibleCount) {
    const summary = document.getElementById("staples-selection");
    if (!summary || !staplesPayload) {
        return;
    }

    const filterLabel = staplesRegionFilter === "all" ? "all regions" : staplesRegionFilter;

    if (!selectedStapleName) {
        summary.textContent = "Showing " + visibleCount + " crop(s) for " + filterLabel + ".";
        return;
    }

    const crop = staplesPayload.crops.find(function match(item) {
        return item.name === selectedStapleName;
    });
    if (!crop) {
        summary.textContent = "Showing " + visibleCount + " crop(s) for " + filterLabel + ".";
        return;
    }

    summary.textContent =
        "Selected " + crop.name + " — about " +
        formatYieldNumber(crop.annualYieldMt) +
        " million tonnes/year in " + crop.primaryRegion +
        " (" + crop.growthCycle + ").";
}

// Render staples table
function renderStaplesTable() {
    const mountNode = document.getElementById("staples-mount");
    if (!mountNode || !staplesPayload) {
        return;
    }

    const visibleCrops = getVisibleStaples(staplesPayload.crops);

    mountNode.innerHTML =
        '<div class="section-head">' +
            "<h1>" + staplesPayload.title + "</h1>" +
            "<p>" + staplesPayload.subtitle + "</p>" +
        "</div>" +
        buildRegionFilterHtml() +
        '<p id="staples-selection" class="staples-selection" role="status" aria-live="polite"></p>' +
        '<div class="table-wrap">' +
            "<table>" +
                "<caption>Estimated annual cereal and staple yields by crop and region.</caption>" +
                "<thead>" +
                    "<tr>" +
                        buildSortHeader("Crop", "name") +
                        buildSortHeader("Primary region", "primaryRegion") +
                        buildSortHeader("Annual yield (millions of tonnes)", "annualYieldMt") +
                        buildSortHeader("Growth cycle", "growthCycle") +
                    "</tr>" +
                "</thead>" +
                "<tbody>" + buildStapleRowsHtml(visibleCrops) + "</tbody>" +
            "</table>" +
        "</div>";

    updateSelectionSummary(visibleCrops.length);
}

// Handle table clicks
function handleStaplesClicks(event) {
    const filterButton = event.target.closest("[data-region-filter]");
    if (filterButton) {
        staplesRegionFilter = filterButton.getAttribute("data-region-filter");
        selectedStapleName = null;
        renderStaplesTable();
        return;
    }

    const sortButton = event.target.closest("[data-sort-key]");
    if (sortButton) {
        const nextKey = sortButton.getAttribute("data-sort-key");
        if (staplesSortKey === nextKey) {
            staplesSortAscending = !staplesSortAscending;
        } else {
            staplesSortKey = nextKey;
            staplesSortAscending = nextKey === "name" || nextKey === "primaryRegion" || nextKey === "growthCycle";
        }
        renderStaplesTable();
        return;
    }

    const row = event.target.closest("tr[data-crop-name]");
    if (row) {
        const cropName = row.getAttribute("data-crop-name");
        selectedStapleName = selectedStapleName === cropName ? null : cropName;
        renderStaplesTable();
    }
}

// Show loading
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

// Show load error
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
            "<ol class='next-steps'>" +
                "<li>Confirm your network connection.</li>" +
                "<li>Press Try again.</li>" +
            "</ol>" +
            '<button type="button" class="btn btn-primary" id="retry-staples">Try again</button>' +
        "</div>";

    const retryButton = document.getElementById("retry-staples");
    if (retryButton) {
        retryButton.addEventListener("click", startStaplesPage);
    }
}

// Start staples page
function startStaplesPage() {
    renderStaplesLoading();
    showWorkingSpinner("Loading staple yield data…");
    fetchStaplesData()
        .then(function onLoaded(payload) {
            hideWorkingSpinner();
            if (!payload || !Array.isArray(payload.crops) || payload.crops.length === 0) {
                throw new Error("The staples file did not include crop rows.");
            }
            staplesPayload = payload;
            renderStaplesTable();
        })
        .catch(function onError(error) {
            hideWorkingSpinner();
            renderStaplesError(error);
        });
}

document.addEventListener("DOMContentLoaded", function onStaplesReady() {
    const mountNode = document.getElementById("staples-mount");
    if (mountNode) {
        mountNode.addEventListener("click", handleStaplesClicks);
        mountNode.addEventListener("keydown", function handleRowKey(event) {
            if (event.key !== "Enter" && event.key !== " ") {
                return;
            }
            const row = event.target.closest("tr[data-crop-name]");
            if (!row) {
                return;
            }
            event.preventDefault();
            row.click();
        });
    }

    window.AgriFirebase.auth.onAuthStateChanged(function startWhenSignedIn(user) {
        if (user) {
            startStaplesPage();
        }
    });
});
