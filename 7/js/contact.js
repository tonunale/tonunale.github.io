// Contact form
const CONTACT_COLLECTION = "contactMessages";

// Prefill email
function prefillContactEmail(user) {
    const emailInput = document.getElementById("contact-email");
    if (!emailInput) {
        return;
    }

    if (user && user.email) {
        emailInput.value = user.email;
    }
}

// Read form values
function readContactFormValues(contactForm) {
    return {
        name: contactForm.name.value.trim(),
        email: contactForm.email.value.trim(),
        topic: contactForm.topic.value,
        message: contactForm.message.value.trim()
    };
}

// Save message
function saveContactMessage(formValues, user) {
    return window.AgriFirebase.db.collection(CONTACT_COLLECTION).add({
        name: formValues.name,
        email: formValues.email,
        topic: formValues.topic,
        message: formValues.message,
        userId: user.uid,
        userEmail: user.email || "",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
}

// Wire contact form
function setupContactForm() {
    const contactForm = document.querySelector(".contact-form");
    const statusNode = document.getElementById("contact-status");
    if (!contactForm) {
        return;
    }

    contactForm.addEventListener("submit", function handleContactSubmit(event) {
        event.preventDefault();

        const user = window.AgriFirebase.auth.currentUser;
        if (!user) {
            setFeedbackMessage(statusNode, "Sign in before sending a message.", true);
            return;
        }

        const formValues = readContactFormValues(contactForm);
        if (!formValues.name || !formValues.email || !formValues.topic || !formValues.message) {
            setFeedbackMessage(statusNode, "Please complete every field before sending.", true);
            return;
        }

        const submitButton = contactForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
        }

        showWorkingSpinner("Sending your message…");
        setFeedbackMessage(statusNode, "", false);

        saveContactMessage(formValues, user)
            .then(function onSaved(docRef) {
                hideWorkingSpinner();
                if (submitButton) {
                    submitButton.disabled = false;
                }
                setFeedbackMessage(
                    statusNode,
                    "Message received and stored (id: " + docRef.id + "). Thank you!",
                    false
                );
                contactForm.reset();
                prefillContactEmail(user);
            })
            .catch(function onSaveError(error) {
                hideWorkingSpinner();
                if (submitButton) {
                    submitButton.disabled = false;
                }
                setFeedbackMessage(statusNode, formatFirebaseError(error), true);
            });
    });

    window.AgriFirebase.auth.onAuthStateChanged(function onContactAuth(user) {
        prefillContactEmail(user);
    });

    document.addEventListener("agriculture-auth-changed", function onAuthEvent(event) {
        prefillContactEmail(event.detail && event.detail.user);
    });
}

document.addEventListener("DOMContentLoaded", setupContactForm);
