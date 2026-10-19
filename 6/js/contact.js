/**
 * Contact form helper for the AgriCulture contact page.
 */

/**
 * Wires the contact form so submit stays on-page for this demo stage.
 */
function setupContactForm() {
    const contactForm = document.querySelector(".contact-form");
    if (!contactForm) {
        return;
    }

    contactForm.addEventListener("submit", function handleContactSubmit(event) {
        event.preventDefault();
        const statusNode = document.getElementById("contact-status");
        if (statusNode) {
            statusNode.textContent = "Thanks — your message was recorded for this demo.";
        }
        contactForm.reset();
    });
}

document.addEventListener("DOMContentLoaded", setupContactForm);
