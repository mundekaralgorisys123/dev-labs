import random
import numpy as np
import openai
from flask import request, Flask, render_template,abort,flash,redirect,jsonify
from PIL import Image
from feature_extractor import FeatureExtractor  # Importing feature extraction class
from datetime import datetime 
from dotenv import load_dotenv
from io import BytesIO
import base64
import json
from pathlib import Path  # Path handling for filesystem operation
from werkzeug.utils import secure_filename
import os
import time
from pathlib import Path
from threading import Thread



app = Flask(__name__)
app.secret_key = 'your_secret_key'

UPLOAD_FOLDER = 'static/uploads'  # Change this to your desired upload directory

# Define upload and feature folders
UPLOAD_FOLDER_BASE = 'static/UploadImages'
FEATURE_FOLDER_BASE = './static/feature'

# Create directories if they don't exist
if not os.path.exists(UPLOAD_FOLDER_BASE):
    os.makedirs(UPLOAD_FOLDER_BASE)

if not os.path.exists(FEATURE_FOLDER_BASE):
    os.makedirs(FEATURE_FOLDER_BASE)

# Global variable to track the status of the training
training_status = {
    'status': 'idle',  # Possible statuses: 'idle', 'in-progress', 'completed'
}

  
# Read pre-extracted image features
fe = FeatureExtractor()  # Create an instance of the feature extractor
features = []  # List to store image features (loaded from .npy files)
img_paths = []  # List to store paths of corresponding images
for feature_path in Path("./static/feature").glob("*.npy"):  # Loop through all saved features
    features.append(np.load(feature_path))  # Load feature vector from .npy file
  
    img_paths.append(Path("./static/featureimg") / (feature_path.stem + ".jpg")) 
    print(img_paths)
features = np.array(features) 


# Convert image to base64 string
def image_to_base64_str(image):
    buffer = BytesIO()
    image.save(buffer, format='PNG')
    buffer.seek(0)
    return base64.b64encode(buffer.read()).decode('utf-8')



@app.route('/')
def home():
    
    return render_template('home.html')



   
@app.route('/search', methods=['GET', 'POST'])
def search_image():
     
    if request.method == 'POST':  # If the form is submitted (via POST request)
        file = request.files['query_img']  # Get the uploaded image file from the request
        img = Image.open(file.stream)  # Open the uploaded image using PIL

        # Run image similarity search
        query = fe.extract(img)  # Extract features from the uploaded query image
        dists = np.linalg.norm(features - query, axis=1)  # Calculate L2 distances between query features and dataset features
        ids = np.argsort(dists)[1:6]  # Get the indices of the top 40 closest (most similar) images based on distance
        scores = [(dists[id], img_paths[id]) for id in ids]  # Pair distances with image paths for top results

        return render_template('search.html', query_path=image_to_base64_str(img), scores=scores)  # Pass base64 image string
    else:
        return render_template('search.html', query_path=None, scores=None)  # Render the default homepage on GET request
# ==========================================================================================
                                        # UPLOAD IMAGE
# ==========================================================================================
@app.route('/upload_images', methods=['GET', 'POST'])
def upload_images():

    return render_template('upload.html')

@app.route('/upload_im', methods=['POST'])
def upload_im():
    try:
        folder_name = request.form.get('folder_name')
        files = request.files.getlist('images[]')

        # Check if folder name is provided
        if not folder_name:
            return jsonify({'error': 'Folder name is required!'}), 400

        # Define the path for the folder
        folder_path = os.path.join(UPLOAD_FOLDER_BASE, folder_name)

        # Create folder if it doesn't exist
        if not os.path.exists(folder_path):
            os.makedirs(folder_path)
            

        # Save the images in the specified folder
        for file in files:
            if file and file.filename:
                # Save the image in the first location (img/{folder_name})
                file_path = os.path.join(folder_path, file.filename)
                print(file_path)
                file.save(file_path)
                # Create a BytesIO object to hold the file's content
                file.seek(0)  # Move the file pointer back to the start
                file_content = BytesIO(file.read())  # Read the file into a BytesIO object
         
                # Save the file content to the second location (static/featureimg)
                file_path1 = os.path.join("./static/featureimg", file.filename)  # Ensure no extra spaces in the path
                with open(file_path1, 'wb') as f:  # Open for writing in binary mode
                    f.write(file_content.getvalue())  # Write the content to the new file
                         
               

        return jsonify({'message': 'Images uploaded successfully!'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500



def model_training_task(folder_name):
    global training_status
    training_status['status'] = 'in-progress'
    
    folder_path = os.path.join(UPLOAD_FOLDER_BASE, folder_name)
    
    fe = FeatureExtractor()

    # Get the total number of images for progress tracking
    total_images = len(list(Path(folder_path).glob("*.jpg")))
    
    for idx, img_path in enumerate(sorted(Path(folder_path).glob("*.jpg")), start=1):
        print(f"Processing image: {img_path}")

        feature = fe.extract(img=Image.open(img_path))

        feature_path = Path(FEATURE_FOLDER_BASE) / (img_path.stem + ".npy")
        np.save(feature_path, feature)

        print(f"Feature saved at: {feature_path}")

        # Update status based on processed images
        progress_percentage = (idx / total_images) * 100
        print(f"Progress: {progress_percentage:.2f}%")
    
    training_status['status'] = 'completed'
    print(f"Training completed on folder: {folder_name}")


@app.route('/train_model', methods=['POST'])
def train_model():
    data = request.get_json()
    folder_name = data.get('folder_name')

    if not folder_name:
        return jsonify({'error': 'Folder name is required!'}), 400

    folder_path = os.path.join(UPLOAD_FOLDER_BASE, folder_name)

    if not os.path.exists(folder_path):
        return jsonify({'error': 'Folder does not exist!'}), 400

    # Start model training in a separate thread
    thread = Thread(target=model_training_task, args=(folder_name,))
    thread.start()

    return jsonify({'message': 'Model training started.'}), 200

@app.route('/training_status', methods=['GET'])
def training_status_endpoint():
    global training_status
    return jsonify({'status': training_status['status']})


if __name__ == '__main__':
    app.run(debug=True)
    # app.run("0.0.0.0")


