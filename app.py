from flask import Flask, render_template, request, session, redirect, url_for
import os
import requests
import re
import logging

# Set up logging for both production and development environments
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Secure the session

# Function to generate folder structure from a local repository
def generate_folder_structure_from_local(repo_path):
    def tree(path, indent=""):
        items = os.listdir(path)
        structure = ""
        
        for item in items:
            if item.startswith('.'):
                 continue
            item_path = os.path.join(path, item)
            if os.path.isdir(item_path):
                structure += f"{indent}├── {item}/\n"
                structure += tree(item_path, indent + "│   ")
            else:
                structure += f"{indent}├── {item}\n"
        return structure
    
    return tree(repo_path)

# Function to generate folder structure from GitHub repository (with user token)
def generate_folder_structure_from_github(repo_url, token):
    api_url = f"https://api.github.com/repos/{repo_url}/contents"
    
    # Set up authentication using the token
    headers = {
        "Authorization": f"token {token}"
    }

    response = requests.get(api_url, headers=headers)

    if response.status_code == 200:
        items = response.json()
        structure = traverse_github_structure(items, headers)
        return structure
    else:
        logging.error(f"GitHub API Error: {response.status_code} - {response.text}")
        return f"Error: Unable to fetch repository contents. Status code: {response.status_code}, Response: {response.text}"

# Function to recursively traverse the GitHub repository structure
def traverse_github_structure(items, headers, indent=""):
    structure = ""
    for item in items:
        if item['name'].startswith('.'):
            continue
        if item['type'] == 'dir':
            structure += f"{indent}├── {item['name']}/\n"
            sub_items = requests.get(item['url'], headers=headers).json()
            structure += traverse_github_structure(sub_items, headers, indent + "│   ")
        else:
            structure += f"{indent}├── {item['name']}\n"
    return structure

# Function to extract 'owner/repo' from a full GitHub URL
def extract_owner_repo_from_url(url):
    match = re.match(r'https://github.com/([^/]+/[^/]+)', url)
    if match:
        return match.group(1)
    return None

def check_directory_exists(directory_path):
    """Check if the directory exists on the user's system."""
    return os.path.exists(directory_path)

@app.route("/", methods=["GET", "POST"])
def index():
    folder_structure = ""
    error_message = ""

    if request.method == "POST":
        # Get the user input for repository and token
        repo_input = request.form["repo_input"]
        token = request.form.get("token_input")
        repo_type = request.form.get("repo_type")  # Determine if it's URL or local
        if repo_type == 'local':
            # Check if the local directory exists on the user’s system
            if not check_directory_exists(repo_input):
                error_message = f"The directory '{repo_input}' does not exist. Please check the path."
                logging.warning(f"Directory not found: {repo_input}")
            else:
                # Proceed with generating the folder structure for the local directory
                folder_structure = "\n" + generate_folder_structure_from_local(repo_input)
                logging.info(f"Folder structure generated for local path: {repo_input}")
        elif repo_type == "url":
            if not token:
                error_message = "Please provide a GitHub Personal Access Token (PAT)."
                logging.warning("No token provided.")
            else:
                session['token'] = token  # Store token in session for subsequent requests
                # Extract 'owner/repo' from full URL if needed
                repo_input = extract_owner_repo_from_url(repo_input) or repo_input
                if not repo_input or "/" not in repo_input:
                    error_message = "Invalid GitHub repository URL or format. Please use 'owner/repository' or a valid GitHub URL."
                    logging.warning(f"Invalid GitHub repository URL format: {repo_input}")
                else:
                    folder_structure = "\n" + generate_folder_structure_from_github(repo_input, token)
                    if folder_structure.startswith("Error"):
                        error_message = folder_structure
                        logging.error(f"GitHub API failed for repository {repo_input} with error: {folder_structure}")
                    else:
                        logging.info(f"Folder structure generated for GitHub repository: {repo_input}")
    return render_template("index.html", folder_structure=folder_structure, error_message=error_message)

@app.route("/set_token", methods=["GET", "POST"])
def set_token():
    if request.method == "POST":
        token = request.form["token"]
        session['token'] = token
        logging.info(f"Token set for session: {token[:10]}...")  # Log first 10 characters of token for security
        return redirect(url_for('index'))

    return render_template("set_token.html")

if __name__ == "__main__":
    app.run(debug=True)
