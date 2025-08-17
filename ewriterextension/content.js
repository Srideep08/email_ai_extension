console.log("Email writer extension content script loaded");

function findToolBar() {
    const selectors = ['.btC', '.aDh', '[role="toolbar"]', '.gU.Up'];
    for (let selector of selectors) {
        const toolbar = document.querySelector(selector);
        if (toolbar) return toolbar;
    }
    return null;
}

function createAiButton() {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';

    // Dropdown for tone selection
    const toneSelect = document.createElement('select');
    toneSelect.className = 'tone-select';
    toneSelect.style.marginRight = '8px';
    toneSelect.style.padding = '4px';
    toneSelect.innerHTML = `
        <option value="professional">Professional</option>
        <option value="friendly">Friendly</option>
        <option value="casual">Casual</option>
        <option value="formal">Formal</option>
    `;

    // AI Reply Button
    const button = document.createElement('div');
    button.className = 'T-I J-J5-Ji aoO v7 T-I-atl L3';
    button.style.marginRight = '8px';
    button.innerHTML = 'AI REPLY';
    button.setAttribute('role', 'button');
    button.setAttribute('data-tooltip', 'Generate AI reply');

    // Append the tone selector and button to the container
    container.appendChild(toneSelect);
    container.appendChild(button);

    // Return the container with the button and selector
    return container;
}

function getEmailContent() {
    const selectors = ['.h7', '.a3s.aiL', '.gmail_quote', '[role="presentation"]'];
    for (let selector of selectors) {
        const content = document.querySelector(selector);
        if (content) return content.innerText.trim();
    }
    return '';
}

function injectButton() {
    const existingContainer = document.querySelector('.ai-reply-container');
    if (existingContainer) existingContainer.remove();

    const toolbar = findToolBar();
    if (!toolbar) {
        console.log("Toolbar not found");
        return;
    }

    console.log("Toolbar found, creating AI reply section");
    const container = createAiButton();
    container.classList.add('ai-reply-container');

    const toneSelect = container.querySelector('.tone-select');
    const button = container.querySelector('.T-I.J-J5-Ji.aoO.v7.T-I-atl.L3');

    button.addEventListener('click', async () => {
        try {
            button.innerHTML = 'Generating...';
            button.disabled = true;

            const emailContent = getEmailContent();
            if (!emailContent) {
                console.error("No email content found");
                alert("No email content found to generate a reply.");
                return;
            }
            const tone = toneSelect.value; // Get the selected tone
            console.log("Email content:", emailContent);
            console.log("Selected tone:", tone);

            const response = await fetch('http://localhost:8080/api/email/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emailContent: emailContent,
                    tone: tone,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("API error:", response.status, errorText);
                throw new Error(`API request failed with status ${response.status}`);
            }

            const generatedReply = await response.text();
            console.log("Generated reply:", generatedReply);

            const composeBox = document.querySelector('[role="textbox"][g_editable="true"]') 
                             || document.querySelector('.editable'); // Backup selector

            if (composeBox) {
                console.log("Compose box found:", composeBox);
                composeBox.focus();
                const success = document.execCommand('insertText', false, generatedReply);
                if (!success) {
                    composeBox.innerHTML = generatedReply; // Fallback
                }
                console.log("Text inserted into compose box");
            } else {
                console.error("Compose box not found");
                alert("Unable to find the compose box to insert the reply.");
            }
        } catch (error) {
            console.error("Error during reply generation:", error.message);
            alert("Failed to generate reply. Check the console for details.");
        } finally {
            button.innerHTML = 'AI REPLY';
            button.disabled = false;
        }
    });

    toolbar.insertBefore(container, toolbar.firstChild);
}

const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        const addedNodes = Array.from(mutation.addedNodes);

        const hasComposeElements = addedNodes.some((node) =>
            node.nodeType === Node.ELEMENT_NODE && (
                node.matches('.aDh, .btC, [role="dialog"]') ||
                node.querySelector('.aDh, .btC, [role="dialog"]')
            )
        );

        if (hasComposeElements) {
            console.log("Compose window detected");
            setTimeout(injectButton, 500);
        }
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
});
