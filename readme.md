# Folder Structure Generator

This project is a web application that generates the folder structure of a local directory or a GitHub repository. It uses Flask for the backend and vanilla JavaScript for the frontend.

## Features

- Generate folder structure for a local directory.
- Generate folder structure for a GitHub repository using a Personal Access Token (PAT).
- Copy the generated folder structure to the clipboard.
- Respect `.gitignore` files and hidden files when generating the folder structure.

## Requirements

- Python 3.x
- Flask
- Node.js (for frontend dependencies)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/folder-structure-generator.git
   cd folder-structure-generator
   ```

2. Create a virtual environment and activate it:

   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install the required Python packages:

   ```bash
   pip install -r requirements.txt
   ```

4. Run the Flask application:

   ```bash
   python app.py
   ```

5. Open your web browser and navigate to `http://localhost:5000`.

## Usage

1. Choose the repository type (URL or Local Directory).
2. If URL is selected, enter the GitHub repository URL and your Personal Access Token (PAT).
3. If Local Directory is selected, click the "Pick a Folder" button to choose a local directory.
4. Click the "Generate Folder Structure" button to generate the folder structure.
5. The generated folder structure will be displayed in the text area.
6. Click the "Copy" button to copy the folder structure to the clipboard.

## File Structure

- [app.py](http://_vscodecontentref_/0): The main Flask application file.
- [templates](http://_vscodecontentref_/1): Contains the HTML templates.
  - [index.html](http://_vscodecontentref_/2): The main HTML template.
  - [set_token.html](http://_vscodecontentref_/3): The HTML template for setting the GitHub token.
- [static](http://_vscodecontentref_/4): Contains the static files (JavaScript, CSS).
  - [script.js](http://_vscodecontentref_/5): The main JavaScript file for handling frontend logic.
- [.gitignore](http://_vscodecontentref_/6): Specifies files and directories to be ignored by Git.
- [requirements.txt](http://_vscodecontentref_/7): Lists the Python dependencies.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
