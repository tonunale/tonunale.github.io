// Home field notes
const FIELD_NOTES = [
    {
        title: "Three Sisters",
        text: "Corn, beans, and squash were grown together across Mesoamerica—each crop helping the others thrive."
    },
    {
        title: "Wet-rice worlds",
        text: "Paddy agriculture shaped dense settlements across East Asia long before modern cities existed."
    },
    {
        title: "Olive longevity",
        text: "Some Mediterranean olive trees remain productive for centuries, linking today’s kitchens to ancient groves."
    },
    {
        title: "Sahel resilience",
        text: "Sorghum and pearl millet feed communities where rainfall is scarce and unreliable."
    },
    {
        title: "Cassava security",
        text: "Cassava roots can stay in the ground until needed—an important household food-security strategy."
    },
    {
        title: "Tea routes",
        text: "Tea moved from medicinal use to daily ritual, then into global trade networks connecting continents."
    }
];

const MAX_FIELD_NOTE_DRAWS = 5;

let lastFieldNoteIndex = -1;
let fieldNoteDrawCount = 0;

// Pick random note
function pickFieldNote() {
    if (FIELD_NOTES.length === 1) {
        return FIELD_NOTES[0];
    }

    let nextIndex = Math.floor(Math.random() * FIELD_NOTES.length);
    while (nextIndex === lastFieldNoteIndex) {
        nextIndex = Math.floor(Math.random() * FIELD_NOTES.length);
    }
    lastFieldNoteIndex = nextIndex;
    return FIELD_NOTES[nextIndex];
}

// Update draw button
function updateFieldNoteButton(button) {
    const drawsLeft = MAX_FIELD_NOTE_DRAWS - fieldNoteDrawCount;

    if (drawsLeft <= 0) {
        button.disabled = true;
        button.textContent = "No draws left";
        return;
    }

    button.disabled = false;
    if (fieldNoteDrawCount === 0) {
        button.textContent = "Draw a field note (" + drawsLeft + " left)";
    } else {
        button.textContent = "Draw another note (" + drawsLeft + " left)";
    }
}

// Wire field notes
function setupFieldNotes() {
    const button = document.getElementById("draw-field-note");
    const output = document.getElementById("field-note-output");
    if (!button || !output) {
        return;
    }

    updateFieldNoteButton(button);

    button.addEventListener("click", function handleDrawNote() {
        if (fieldNoteDrawCount >= MAX_FIELD_NOTE_DRAWS) {
            updateFieldNoteButton(button);
            return;
        }

        const note = pickFieldNote();
        fieldNoteDrawCount += 1;

        output.hidden = false;
        output.innerHTML =
            "<strong>" + note.title + "</strong>" +
            "<p>" + note.text + "</p>" +
            '<p class="field-note-count">Draw ' + fieldNoteDrawCount + " of " + MAX_FIELD_NOTE_DRAWS + "</p>";

        updateFieldNoteButton(button);

        if (fieldNoteDrawCount >= MAX_FIELD_NOTE_DRAWS) {
            output.innerHTML += "<p>You’ve used all 5 field notes for this visit.</p>";
        }
    });
}

document.addEventListener("DOMContentLoaded", setupFieldNotes);
