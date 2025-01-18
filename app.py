from flask import Flask, render_template, request, session, redirect, url_for,jsonify, render_template
import os
import requests
import re
import logging


# Set up logging for both production and development environments
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Secure the session

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
def home():
    folder_structure = ""
    error_message = ""

    if request.method == "POST":
        # Get the user input for repository and token
        repo_input = request.form.get("repo_input", "")
        token = request.form.get("token_input")
        repo_type = request.form.get("repo_type")  # Determine if it's URL or local

        if repo_type == "url":
            if not token:
                error_message = "Please provide a GitHub Personal Access Token (PAT)."
            else:
                session['token'] = token
                repo_input = extract_owner_repo_from_url(repo_input) or repo_input
                if not repo_input or "/" not in repo_input:
                    error_message = "Invalid GitHub repository URL or format."
                else:
                    folder_structure = generate_folder_structure_from_github(repo_input, token)
                    if folder_structure.startswith("Error"):
                        error_message = folder_structure
    return render_template("index.html", folder_structure=folder_structure, error_message=error_message)


@app.route("/folder-structure", methods=["GET", "POST"])
def folder_structure_api():
    if request.method == "GET":
        # Render the HTML page
        return render_template("index.html", folder_structure="", error_message="")
    
    if request.method == "POST":
        data = request.get_json()  # Get JSON payload
        repo_input = data.get("repo_input", "")
        token = data.get("token_input", "")
        repo_type = data.get("repo_type", "")
        

        folder_structure = ""
        error_message = ""

        if repo_type == "url":
            if not token:
                error_message = "Please provide a GitHub Personal Access Token (PAT)."
            else:
                session['token'] = token
                repo_input = extract_owner_repo_from_url(repo_input) or repo_input
                if not repo_input or "/" not in repo_input:
                    error_message = "Invalid GitHub repository URL or format."
                else:
                    folder_structure = generate_folder_structure_from_github(repo_input, token)
                    if folder_structure.startswith("Error"):
                        error_message = folder_structure
        
        # Return the response as JSON
        return jsonify({
            "folder_structure": folder_structure,
            "error_message": error_message
        })


if __name__ == "__main__":
    # app.run(debug=True)
    app.run(host="0.0.0.0", port=5000)