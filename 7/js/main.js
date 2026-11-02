// Shared helpers
// Touch press feedback
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
