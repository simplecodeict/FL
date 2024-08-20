import os
import base64
from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
from nbclient import NotebookClient
from jupyter_client.manager import KernelManager
import nbformat
import traceback
from pymongo import MongoClient
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_pymongo import PyMongo




app = Flask(__name__)
CORS(app)

app.config["MONGO_URI"] = "mongodb+srv://simplecodeict:lahiru12@cluster0.jnjpz.mongodb.net/mydatabase"
mongo = PyMongo(app)

users_collection = mongo.db.users


socketio = SocketIO(app, cors_allowed_origins="*")



bcrypt = Bcrypt(app)
jwt = JWTManager(app)

app.config['JWT_SECRET_KEY'] = 'your_secret_key'

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    fullname = data.get('fullName')
    password = data.get('password')
    username = data.get('email')

    if not fullname or not password or not username:
        return jsonify({'msg': 'Username and password are required'}), 400

    # Check if user already exists
    user = users_collection.find_one({'username': username})
    if user:
        return jsonify({'msg': 'User already exists'}), 400

    # Hash the password
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    # Insert user into the database
    users_collection.insert_one({'username': username, 'password': hashed_password})

    return jsonify({'msg': 'User registered successfully'}), 201

# Login Route
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'msg': 'Username and password are required'}), 400

    user = users_collection.find_one({'username': username})
    if not user or not bcrypt.check_password_hash(user['password'], password):
        return jsonify({'msg': 'Invalid username or password'}), 401

    # Create JWT token
    access_token = create_access_token(identity=username)

    return jsonify({'access_token': access_token}), 200



# Protected Route Example
@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify({'msg': f'Welcome {current_user}'}), 200




@app.route('/run-notebook', methods=['POST'])
def run_notebook():
    try:
        # Get the file name from the request
        request_data = request.get_json()
        notebook_filename = request_data.get('fileName', 'component_04.ipynb')  # Default to 'component_04.ipynb' if not provided

        notebook_path = f'./{notebook_filename}'  # Construct the notebook path
        if not os.path.exists(notebook_path):
            return jsonify({'status': 'error', 'error': 'Notebook file not found'}), 404

        with open(notebook_path, 'r', encoding='utf-8') as file:
            notebook = nbformat.read(file, as_version=4)
        
        # Manually start the kernel
        km = KernelManager(kernel_name='python3')
        km.start_kernel()
        kc = km.client()
        kc.start_channels()
        kc.wait_for_ready(timeout=60)
        
        print("Starting notebook execution")

        # Create a NotebookClient instance with the manually started kernel client
        client = NotebookClient(notebook, kernel_client=kc, timeout=600)
        client.kc = kc  # Ensure the kernel client is set

        images = []  # To store Base64 encoded images
        logs = []    # To store logs

        for index, cell in enumerate(notebook.cells):
            if cell.cell_type == 'code':
                try:
                    print(f"Executing cell {index + 1}")

                    # Emit the code of the current cell
                    socketio.emit('progress', {
                        'status': f'Running cell {index + 1}/{len(notebook.cells)}',
                        'totalCells': len(notebook.cells),
                        'code': cell.source  # Send the cell code
                    })

                    # Execute the cell
                    client.execute_cell(cell, index)
                    
                    # Check for outputs and handle images and logs
                    for output in cell.outputs:
                        if output.output_type == 'display_data' and 'image/png' in output.data:
                            img_data = output.data['image/png']
                            # Ensure img_data is a bytes-like object
                            if isinstance(img_data, str):
                                img_data = bytes(img_data, 'utf-8')
                            img_base64 = base64.b64encode(img_data).decode('utf-8')
                            images.append(f'data:image/png;base64,{img_base64}')
                        elif output.output_type == 'stream':
                            logs.append(output.text)

                    socketio.emit('output', {'cell': cell, 'images': images, 'logs': logs})
                except Exception as e:
                    error_msg = traceback.format_exc()
                    print(f"Error in cell {index + 1}: {error_msg}")
                    socketio.emit('error', {'error': error_msg})
                    return jsonify({'status': 'error', 'error': error_msg}), 500
        
        kc.stop_channels()
        km.shutdown_kernel()
        print("Notebook execution complete")
        return jsonify({'status': 'complete', 'output': notebook.cells, 'images': images, 'logs': logs}), 200
    except Exception as e:
        error_msg = traceback.format_exc()
        print(f"Unhandled error: {error_msg}")
        return jsonify({'status': 'error', 'error': error_msg}), 500

if __name__ == '__main__':
    socketio.run(app, debug=True)
