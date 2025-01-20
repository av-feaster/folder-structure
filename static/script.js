document.addEventListener('DOMContentLoaded', () => {
    const pickFolderButton = document.getElementById('pick-folder');
    const folderStructureElement = document.getElementById('folder-structure');
    const repoInput = document.getElementById('repo_input');
    const localOption = document.getElementById('local_option');
    const urlOption = document.getElementById('url_option');
    const directoryChooser = document.getElementById('directoryChooser');
    const generateContainer = document.getElementById('generate_container');
    const generateButton = document.getElementById('generate_button');
    const repoInputContainer = document.getElementById('repo_input_container');
    const errorDiv = document.getElementById('errorDiv');
    const copyBtn = document.getElementById("copyBtn");

    const ignoredFiles = new Set();


    const isLocal = localOption.checked
    directoryChooser.style.display = isLocal ? 'block' : 'none';
    repoInput.style.display = isLocal ? 'none' : 'block';
    generateContainer.style.display = isLocal ? 'none' : 'block';
    repoInputContainer.style.display = isLocal ? 'none' : 'block';
    if (!isLocal) folderStructureElement.textContent = folderStructure;


    // Toggle input fields based on selected repository type
    document.querySelectorAll('input[name="repo_type"]').forEach((elem) => {
        elem.addEventListener('change', (event) => {
            const isLocal = event.target.id === 'local_option' && event.target.checked;
            directoryChooser.style.display = isLocal ? 'block' : 'none';
            repoInput.style.display = isLocal ? 'none' : 'block';
            generateContainer.style.display = isLocal ? 'none' : 'block';
            repoInputContainer.style.display = isLocal ? 'none' : 'block';
            if (!isLocal) folderStructureElement.textContent = folderStructure;
        });
    });

    // Extend: Function to process .gitignore and populate ignoredFiles
    async function processGitIgnore(dirHandle) {
        ignoredFiles.clear(); // Reset ignored files
        try {
            const gitIgnoreHandle = await dirHandle.getFileHandle('.gitignore', { create: false });
            const file = await gitIgnoreHandle.getFile();
            const content = await file.text();

            content.split('\n').forEach((line) => {
                const trimmedLine = line.trim();
                if (trimmedLine && !trimmedLine.startsWith('#')) {
                    ignoredFiles.add(trimmedLine);
                }
            });
        } catch (err) {
            console.warn('.gitignore file not found or cannot be read:', err);
        }
    }

    // Extend: Helper function to check if a file or folder should be ignored
    function shouldIgnoreFile(fileName) {
        for (const pattern of ignoredFiles) {
            // Simple wildcard matching (* at the start or end)
            if (pattern.endsWith('*') && fileName.startsWith(pattern.slice(0, -1))) {
                return true;
            }
            if (pattern.startsWith('*') && fileName.endsWith(pattern.slice(1))) {
                return true;
            }
            if (pattern === fileName) {
                return true;
            }
        }
        return false;
    }

    // Modify: Extend the getFolderStructure function to respect .gitignore and hidden files
    async function getFolderStructure(dirHandle, indent = '') {
        let structure = '';
        for await (const [name, handle] of dirHandle.entries()) {
            // Skip hidden files and directories starting with '.' or ignored files
            if (name.startsWith('.') || shouldIgnoreFile(name)) {
                continue;
            }

            structure += `${indent}├── ${name}${handle.kind === 'directory' ? '/' : ''}\n`;
            if (handle.kind === 'directory') {
                structure += await getFolderStructure(handle, indent + '│   ');
            }
        }
        return structure;
    }

    // Handle folder picking for local directory
    pickFolderButton.addEventListener('click', async () => {
        if (!window.showDirectoryPicker) {
            alert("Your browser doesn't support the File System Access API.");
            return;
        }

        try {
            const dirHandle = await window.showDirectoryPicker();
            await processGitIgnore(dirHandle); // Process .gitignore if present
            const structure = await getFolderStructure(dirHandle);
            folderStructureElement.textContent = structure;
        } catch (err) {
            console.error("Error accessing folder:", err);
        }
    });

    // Handle generate button click
    generateButton.addEventListener('click', async (event) => {
        event.preventDefault();
        const payload = {
            repo_input: repoInput.value,
            token_input: document.querySelector('input[name="token_input"]').value,
            repo_type: document.querySelector('input[name="repo_type"]:checked').value,
        };

        try {
            const response = await fetch('/folder-structure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            if (data.error_message) {
                errorDiv.textContent = data.error_message;
                folderStructureElement.textContent = '';
            } else {
                folderStructureElement.textContent = data.folder_structure;
                errorDiv.textContent = '';
            }
        } catch (error) {
            console.error('Error:', error);
            errorDiv.textContent = 'An unexpected error occurred. Please try again.';
        }
    });

    // Copy folder structure to clipboard
    copyBtn.addEventListener("click", (event) => {
        event.preventDefault();
        const folderStructureText = `
# Folder Structure

\`\`\`
${folderStructureElement.textContent}
\`\`\`
`;
        navigator.clipboard.writeText(folderStructureText)
            .then(() => alert("Folder structure copied to clipboard!"))
            .catch((err) => {
                console.error("Failed to copy text: ", err);
                alert("Failed to copy text.");
            });
    });
});
