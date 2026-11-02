// Upload atlas data
const SEED_COLLECTION = "regions";

// Get seed data
function getSeedPayload() {
    if (typeof SEED_REGIONS_PAYLOAD === "undefined" || !SEED_REGIONS_PAYLOAD) {
        throw new Error("Seed data script did not load. Check that js/seed-data.js is included.");
    }
    return SEED_REGIONS_PAYLOAD;
}

// Upload regions
function uploadRegionsToFirestore(regions) {
    const db = window.AgriFirebase.db;
    const batch = db.batch();

    regions.forEach(function writeRegion(region) {
        const docRef = db.collection(SEED_COLLECTION).doc(region.id);
        batch.set(docRef, region);
    });

    return batch.commit();
}

// Seed status text
function setSeedStatus(message, isError) {
    setFeedbackMessage(document.getElementById("seed-status"), message, isError);
}

// Wire seed page
function setupSeedPage() {
    const seedButton = document.getElementById("seed-button");
    const statusNode = document.getElementById("seed-status");
    if (!seedButton) {
        return;
    }

    seedButton.addEventListener("click", function handleSeedClick() {
        const user = window.AgriFirebase.auth.currentUser;
        if (!user) {
            setSeedStatus("Sign in before uploading.", true);
            return;
        }

        seedButton.disabled = true;
        showWorkingSpinner("Uploading atlas data…");
        setSeedStatus("", false);

        Promise.resolve()
            .then(function onStart() {
                const payload = getSeedPayload();
                if (!payload || !Array.isArray(payload.regions) || payload.regions.length === 0) {
                    throw new Error("Seed data did not include any regions.");
                }
                return uploadRegionsToFirestore(payload.regions)
                    .then(function onUploaded() {
                        return payload.regions.length;
                    });
            })
            .then(function onDone(count) {
                hideWorkingSpinner();
                seedButton.disabled = false;
                setSeedStatus(
                    "Uploaded " + count + " regions. You can open Explore now.",
                    false
                );
            })
            .catch(function onError(error) {
                hideWorkingSpinner();
                seedButton.disabled = false;
                setSeedStatus(formatFirebaseError(error), true);
            });
    });

    window.AgriFirebase.auth.onAuthStateChanged(function updateHint(user) {
        if (user) {
            setSeedStatus("Signed in as " + user.email + ". Click Upload atlas data.", false);
        } else if (statusNode) {
            setSeedStatus("Waiting for sign-in…", false);
        }
    });
}

document.addEventListener("DOMContentLoaded", setupSeedPage);
