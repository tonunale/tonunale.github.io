/**
 * Shared site helpers for AgriCulture Project 4.
 * Keeps header interactions consistent across pages.
 */

/**
 * Prefers keyboard-accessible long-press / click behavior on interactive cards.
 * Adds a pressed class for touch devices that do not fire hover.
 * @param {HTMLElement} rootElement - Container to watch for .is-interactive targets
 */
function enableTouchFeedback(rootElement) {
    if (!rootElement) {
        return;
    }

    rootElement.addEventListener("pointerdown", function handlePointerDown(event) {
        const targetCard = event.target.closest(".is-interactive");
        if (!targetCard) {
            return;
        }
        targetCard.classList.add("is-pressed");
    });

    rootElement.addEventListener("pointerup", function handlePointerUp(event) {
        const targetCard = event.target.closest(".is-interactive");
        if (!targetCard) {
            return;
        }
        targetCard.classList.remove("is-pressed");
    });

    rootElement.addEventListener("pointerleave", function handlePointerLeave(event) {
        const targetCard = event.target.closest(".is-interactive");
        if (!targetCard) {
            return;
        }
        targetCard.classList.remove("is-pressed");
    });
}

/**
 * Wires the Sign In control. Stage 4 will add real accounts; for now the
 * form only prevents a page reload so the rest of the site stays usable.
 */
function setupSignInForm() {
    const loginForm = document.querySelector(".login-form");
    if (!loginForm) {
        return;
    }

    loginForm.addEventListener("submit", function handleSignInSubmit(event) {
        event.preventDefault();
        const usernameInput = loginForm.querySelector('input[name="username"]');
        const statusNode = document.getElementById("signin-status");
        const displayName = usernameInput && usernameInput.value.trim()
            ? usernameInput.value.trim()
            : "guest";

        if (statusNode) {
            statusNode.textContent = "Signed in as " + displayName + ".";
        }

        const detailsParent = loginForm.closest("details");
        if (detailsParent) {
            detailsParent.open = false;
        }
    });
}

document.addEventListener("DOMContentLoaded", function onDocumentReady() {
    setupSignInForm();
    enableTouchFeedback(document.body);
});
