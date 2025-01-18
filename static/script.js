document.addEventListener('DOMContentLoaded', () => {
    // alert('Hello from the script.js file!');
    const pickFolderButton = document.getElementById('pick-folder');
    const folderStructureElement = document.getElementById('folder-structure');
    const repoInput = document.getElementById('repo_input');
    const localOption = document.getElementById('local_option');
    const urlOption = document.getElementById('url_option');
    const directoryChooser = document.getElementById('directoryChooser');
    const genrateContainer = document.getElementById('generate_container');   //generate_container
    const genrateButton = document.getElementById('generate_button');
    const repoInputContainer = document.getElementById('repo_input_container');
    // Toggle input fields based on selected repository type
    document.querySelectorAll('input[name="repo_type"]').forEach((elem) => {
        elem.addEventListener('change', (event) => {
            if (event.target.id === 'local_option' && event.target.checked) {
                directoryChooser.style.display = 'block';
                repoInput.style.display = 'none';
                genrateContainer.style.display = 'none';
                repoInputContainer.style.display = 'none';

            } else if (event.target.id === 'url_option' && event.target.checked) {
                directoryChooser.style.display = 'none';
                repoInput.style.display = 'block';
                genrateContainer.style.display = 'block';
                repoInputContainer.style.display = 'block';
                folderStructureElement.textContent = folderStructure
            }
        });
    });

    // Handle folder picking for local directory
    pickFolderButton.addEventListener('click', async () => {
        if (!window.showDirectoryPicker) {
            alert("Your browser doesn't support the File System Access API.");
            return;
        }

        try {
            const dirHandle = await window.showDirectoryPicker();
            const structure = await getFolderStructure(dirHandle);
            folderStructureElement.textContent = structure;
        } catch (err) {
            console.error("Error accessing folder:", err);
        }
    });

    // Get elements
    const generateButton = document.getElementById('generate_button');
    const repoInput1 = document.querySelector('input[name="repo_input"]');
    const tokenInput = document.querySelector('input[name="token_input"]');
    const repoTypeInput = document.querySelector('input[name="repo_type"]:checked');

    const folderStructureDiv = document.getElementById('folder-structure');
    const errorDiv = document.getElementById('errorDiv');

    generateButton.addEventListener('click', async (event) => {
        event.preventDefault(); // Prevent form submission
        // Get user input values
        const repoUrl = repoInput1.value;
        const token = tokenInput.value;
        const repoType = document.querySelector('input[name="repo_type"]:checked').value;
        console.log('<<<>>> Response', repoType);
        // Prepare the payload
        const payload = {
            repo_input: repoUrl,
            token_input: token,
            repo_type: repoType,
        };

        try {
            // Send POST request to the Python API
            const response = await fetch('/folder-structure', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Parse JSON response
            const data = await response.json();
            console.log('<<<>>> Response', data);
            // Update the DOM based on the response
            if (data.error_message) {
                errorDiv.textContent = data.error_message;
                folderStructureDiv.textContent = ''; // Clear folder structure
            } else {
                folderStructureDiv.textContent = data.folder_structure;
                errorDiv.textContent = ''; // Clear error message
            }
        } catch (error) {

            console.error('Error:', error);
            errorDiv.textContent = 'An unexpected error occurred. Please try again.';
        }
    });



    // Function to generate folder structure recursively
    async function getFolderStructure(dirHandle, indent = '') {
        let structure = '';
        for await (const [name, handle] of dirHandle.entries()) {
            if (handle.kind === 'directory') {
                structure += `${indent}├── ${name}/\n`;
                structure += await getFolderStructure(handle, indent + '│   ');
            } else {
                structure += `${indent}├── ${name}\n`;
            }
        }
        return structure;
    }
    // Access the variables defined in the template
    console.log("Folder Structure:", folderStructure);
    console.log("Error Message:", errorMessage);


    // Example usage
    if (errorMessage) {
        alert("Error: " + errorMessage);
    }

    const copyBtn = document.getElementById("copyBtn");
    copyBtn.addEventListener("click", (event) => {
        event.preventDefault();
        // Get the content of the folder structure
        const folderStructureText = `
# Folder Structure

\`\`\`
${folderStructureElement.textContent}
\`\`\`
`;

        // Use the Clipboard API to copy the text
        navigator.clipboard
            .writeText(folderStructureText)
            .then(() => {
                alert("Folder structure copied to clipboard!");
            })
            .catch((err) => {
                console.error("Failed to copy text: ", err);
                alert("Failed to copy text.");
            });
    });

});

