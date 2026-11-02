// UI helpers
// Show loading overlay
function showWorkingSpinner(message) {
    let overlay = document.getElementById("working-overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "working-overlay";
        overlay.className = "working-overlay";
        overlay.setAttribute("role", "status");
        overlay.setAttribute("aria-live", "polite");
        overlay.innerHTML =
            '<div class="working-card">' +
                '<div class="spinner" aria-hidden="true"></div>' +
                '<p id="working-message">Working…</p>' +
            "</div>";
        document.body.appendChild(overlay);
    }

    const messageNode = document.getElementById("working-message");
    if (messageNode) {
        messageNode.textContent = message || "Working…";
    }
    overlay.hidden = false;
}

// Hide loading overlay
function hideWorkingSpinner() {
    const overlay = document.getElementById("working-overlay");
    if (overlay) {
        overlay.hidden = true;
    }
}

// Set status text
function setFeedbackMessage(statusNode, message, isError) {
    if (!statusNode) {
        return;
    }
    statusNode.textContent = message;
    statusNode.classList.toggle("is-error", Boolean(isError));
    statusNode.classList.toggle("is-success", !isError && Boolean(message));
}

// Friendly error text
function formatFirebaseError(error) {
    if (!error) {
        return "Something went wrong. Please try again.";
    }

    const code = error.code || "";
    const messagesByCode = {
        "auth/invalid-email": "That email address is not valid.",
        "auth/user-disabled": "This account has been disabled.",
        "auth/user-not-found": "No account was found for that email.",
        "auth/wrong-password": "Incorrect password. Try again.",
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/email-already-in-use": "An account already exists for that email.",
        "auth/weak-password": "Password must be at least 6 characters.",
        "auth/requires-recent-login": "For security, sign out and sign in again before changing your password.",
        "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
        "permission-denied": "Permission denied. Sign in and try again.",
        "unavailable": "The service is temporarily unavailable. Try again shortly."
    };

    if (messagesByCode[code]) {
        return messagesByCode[code];
    }

    const rawMessage = error.message || "";
    if (rawMessage.toLowerCase().indexOf("failed to fetch") !== -1) {
        return "Could not reach the server. Check your connection and try again.";
    }

    return rawMessage || "Something went wrong. Please try again.";
}
