// Login and page access
const PROTECTED_PAGES = ["explore.html", "staples.html", "contact.html", "seed.html"];

// Current page name
function getCurrentPageName() {
    const parts = window.location.pathname.split("/");
    const fileName = parts[parts.length - 1];
    return fileName || "index.html";
}

// Needs login?
function isProtectedPage() {
    return PROTECTED_PAGES.indexOf(getCurrentPageName()) !== -1;
}

// Make header badge
function ensureAuthBadge(accountSlot) {
    if (document.getElementById("auth-badge") || !accountSlot || !accountSlot.parentNode) {
        return;
    }

    const badge = document.createElement("p");
    badge.id = "auth-badge";
    badge.className = "auth-badge";
    badge.setAttribute("role", "status");
    badge.setAttribute("aria-live", "polite");
    badge.hidden = true;
    accountSlot.parentNode.insertBefore(badge, accountSlot);
}

// Build account menu
function renderAccountPanelMarkup() {
    const slot = document.getElementById("account-slot");
    if (!slot || slot.dataset.ready === "true") {
        return;
    }

    ensureAuthBadge(slot);

    slot.innerHTML =
        '<details class="signin" id="account-panel">' +
            '<summary id="account-summary" aria-label="Open account menu">Account</summary>' +
            '<div class="account-panel" id="account-panel-body">' +
                '<div id="auth-guest" class="auth-section">' +
                    '<p class="auth-help" id="auth-help-text">Sign in to open Explore, Staples, and Contact.</p>' +
                    '<div class="auth-tabs" role="tablist" aria-label="Account actions">' +
                        '<button type="button" class="auth-tab is-active" data-auth-tab="signin" role="tab" aria-selected="true" aria-controls="signin-form" id="tab-signin">Sign in</button>' +
                        '<button type="button" class="auth-tab" data-auth-tab="signup" role="tab" aria-selected="false" aria-controls="signup-form" id="tab-signup">Sign up</button>' +
                    "</div>" +
                    '<form id="signin-form" class="login-form auth-form" aria-label="Sign in" aria-labelledby="tab-signin">' +
                        '<label for="signin-email">Email</label>' +
                        '<input id="signin-email" name="email" type="email" autocomplete="email" required>' +
                        '<label for="signin-password">Password</label>' +
                        '<input id="signin-password" name="password" type="password" autocomplete="current-password" required minlength="6">' +
                        '<button type="submit">Sign in</button>' +
                    "</form>" +
                    '<form id="signup-form" class="login-form auth-form" hidden aria-label="Create account" aria-labelledby="tab-signup">' +
                        '<label for="signup-email">Email</label>' +
                        '<input id="signup-email" name="email" type="email" autocomplete="email" required>' +
                        '<label for="signup-password">Password (min 6 characters)</label>' +
                        '<input id="signup-password" name="password" type="password" autocomplete="new-password" required minlength="6">' +
                        '<button type="submit">Create account</button>' +
                    "</form>" +
                "</div>" +
                '<div id="auth-user" class="auth-section" hidden>' +
                    '<p class="auth-user-line">Manage password or sign out for <strong id="auth-user-email"></strong>.</p>' +
                    '<form id="password-form" class="login-form auth-form" aria-label="Change password">' +
                        '<label for="new-password">New password</label>' +
                        '<input id="new-password" name="password" type="password" autocomplete="new-password" required minlength="6">' +
                        '<button type="submit">Update password</button>' +
                    "</form>" +
                    '<button type="button" id="signout-button" class="btn btn-ghost auth-signout">Sign out</button>' +
                "</div>" +
                '<p id="auth-status" class="signin-status" role="status" aria-live="polite"></p>' +
            "</div>" +
        "</details>";

    slot.dataset.ready = "true";
}

// Switch sign-in/up tab
function showAuthTab(tabName) {
    const signinForm = document.getElementById("signin-form");
    const signupForm = document.getElementById("signup-form");
    const tabs = document.querySelectorAll("[data-auth-tab]");
    const statusNode = document.getElementById("auth-status");

    tabs.forEach(function updateTab(tab) {
        const isActive = tab.getAttribute("data-auth-tab") === tabName;
        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-selected", isActive ? "true" : "false");
        tab.setAttribute("tabindex", isActive ? "0" : "-1");
    });

    if (signinForm) {
        const showSignIn = tabName === "signin";
        signinForm.hidden = !showSignIn;
        signinForm.setAttribute("aria-hidden", showSignIn ? "false" : "true");
    }
    if (signupForm) {
        const showSignUp = tabName === "signup";
        signupForm.hidden = !showSignUp;
        signupForm.setAttribute("aria-hidden", showSignUp ? "false" : "true");
    }

    setFeedbackMessage(statusNode, "", false);
}

// Update header badge
function updateAuthBadge(user) {
    const badge = document.getElementById("auth-badge");
    if (!badge) {
        return;
    }

    if (user && user.email) {
        badge.hidden = false;
        badge.textContent = "You’re signed in as " + user.email;
    } else {
        badge.hidden = true;
        badge.textContent = "";
    }
}

// Update account UI
function updateAccountPanel(user) {
    const guestBlock = document.getElementById("auth-guest");
    const userBlock = document.getElementById("auth-user");
    const summary = document.getElementById("account-summary");
    const emailLabel = document.getElementById("auth-user-email");

    if (!guestBlock || !userBlock || !summary) {
        return;
    }

    updateAuthBadge(user);

    if (user) {
        guestBlock.hidden = true;
        guestBlock.setAttribute("aria-hidden", "true");
        userBlock.hidden = false;
        userBlock.setAttribute("aria-hidden", "false");
        summary.textContent = "Account";
        summary.setAttribute("aria-label", "Open account menu for " + (user.email || "signed-in user"));
        if (emailLabel) {
            emailLabel.textContent = user.email || "member";
        }
    } else {
        guestBlock.hidden = false;
        guestBlock.setAttribute("aria-hidden", "false");
        userBlock.hidden = true;
        userBlock.setAttribute("aria-hidden", "true");
        summary.textContent = "Sign in";
        summary.setAttribute("aria-label", "Open sign in and sign up menu");
    }
}

// Go to redirect page
function followRedirectAfterLogin(user) {
    if (!user) {
        return;
    }
    const params = new URLSearchParams(window.location.search);
    const redirectTarget = params.get("redirect");
    if (redirectTarget && PROTECTED_PAGES.indexOf(redirectTarget) !== -1) {
        window.location.replace(redirectTarget);
    }
}

// Block guests
function enforceProtectedPageAccess(user) {
    if (!isProtectedPage()) {
        return;
    }

    if (!user) {
        const redirectName = getCurrentPageName();
        window.location.replace("index.html?redirect=" + encodeURIComponent(redirectName));
    }
}

// Wire auth forms
function setupAuthForms() {
    const statusNode = document.getElementById("auth-status");
    const auth = window.AgriFirebase.auth;

    document.querySelectorAll("[data-auth-tab]").forEach(function bindTab(tab) {
        tab.addEventListener("click", function handleTabClick() {
            showAuthTab(tab.getAttribute("data-auth-tab"));
            setFeedbackMessage(statusNode, "", false);
        });
    });

    const signinForm = document.getElementById("signin-form");
    if (signinForm) {
        signinForm.addEventListener("submit", function handleSignIn(event) {
            event.preventDefault();
            const email = signinForm.email.value.trim();
            const password = signinForm.password.value;

            showWorkingSpinner("Signing you in…");
            setFeedbackMessage(statusNode, "", false);

            auth.signInWithEmailAndPassword(email, password)
                .then(function onSignedIn(credential) {
                    hideWorkingSpinner();
                    setFeedbackMessage(statusNode, "Signed in successfully.", false);
                    signinForm.reset();
                    followRedirectAfterLogin(credential.user);
                })
                .catch(function onSignInError(error) {
                    hideWorkingSpinner();
                    setFeedbackMessage(statusNode, formatFirebaseError(error), true);
                });
        });
    }

    const signupForm = document.getElementById("signup-form");
    if (signupForm) {
        signupForm.addEventListener("submit", function handleSignUp(event) {
            event.preventDefault();
            const email = signupForm.email.value.trim();
            const password = signupForm.password.value;

            showWorkingSpinner("Creating your account…");
            setFeedbackMessage(statusNode, "", false);

            auth.createUserWithEmailAndPassword(email, password)
                .then(function onSignedUp(credential) {
                    hideWorkingSpinner();
                    setFeedbackMessage(statusNode, "Account created. You are signed in.", false);
                    signupForm.reset();
                    followRedirectAfterLogin(credential.user);
                })
                .catch(function onSignUpError(error) {
                    hideWorkingSpinner();
                    setFeedbackMessage(statusNode, formatFirebaseError(error), true);
                });
        });
    }

    const passwordForm = document.getElementById("password-form");
    if (passwordForm) {
        passwordForm.addEventListener("submit", function handlePasswordChange(event) {
            event.preventDefault();
            const user = auth.currentUser;
            const newPassword = passwordForm.password.value;

            if (!user) {
                setFeedbackMessage(statusNode, "Sign in before changing your password.", true);
                return;
            }

            showWorkingSpinner("Updating password…");
            setFeedbackMessage(statusNode, "", false);

            user.updatePassword(newPassword)
                .then(function onPasswordUpdated() {
                    hideWorkingSpinner();
                    setFeedbackMessage(statusNode, "Password updated.", false);
                    passwordForm.reset();
                })
                .catch(function onPasswordError(error) {
                    hideWorkingSpinner();
                    setFeedbackMessage(statusNode, formatFirebaseError(error), true);
                });
        });
    }

    const signOutButton = document.getElementById("signout-button");
    if (signOutButton) {
        signOutButton.addEventListener("click", function handleSignOut() {
            showWorkingSpinner("Signing out…");
            auth.signOut()
                .then(function onSignedOut() {
                    hideWorkingSpinner();
                    setFeedbackMessage(statusNode, "Signed out.", false);
                    if (isProtectedPage()) {
                        window.location.replace("index.html");
                    }
                })
                .catch(function onSignOutError(error) {
                    hideWorkingSpinner();
                    setFeedbackMessage(statusNode, formatFirebaseError(error), true);
                });
        });
    }
}

// Ask guest to sign in
function promptSignInFromGate(event) {
    if (window.AgriFirebase.auth.currentUser) {
        return;
    }
    event.preventDefault();
    const panel = document.getElementById("account-panel");
    if (panel) {
        panel.open = true;
    }
    setFeedbackMessage(
        document.getElementById("auth-status"),
        "Sign in or create an account to open that page.",
        true
    );
}

// Lock gated links
function updateHomeGate(user) {
    document.querySelectorAll("[data-requires-auth]").forEach(function updateLink(link) {
        if (!link.dataset.gateBound) {
            link.addEventListener("click", promptSignInFromGate);
            link.dataset.gateBound = "true";
        }

        if (user) {
            link.classList.remove("is-disabled");
            link.removeAttribute("aria-disabled");
            link.setAttribute("tabindex", "0");
        } else {
            link.classList.add("is-disabled");
            link.setAttribute("aria-disabled", "true");
            link.setAttribute("tabindex", "-1");
        }
    });
}

document.addEventListener("DOMContentLoaded", function onAuthReady() {
    renderAccountPanelMarkup();
    showAuthTab("signin");
    setupAuthForms();
    enableTouchFeedback(document.body);

    const auth = window.AgriFirebase.auth;
    showWorkingSpinner("Checking sign-in…");

    auth.onAuthStateChanged(function handleAuthState(user) {
        hideWorkingSpinner();
        updateAccountPanel(user);
        updateHomeGate(user);
        enforceProtectedPageAccess(user);
        document.dispatchEvent(new CustomEvent("agriculture-auth-changed", { detail: { user: user } }));

        if (user) {
            followRedirectAfterLogin(user);
        }
    });
});
