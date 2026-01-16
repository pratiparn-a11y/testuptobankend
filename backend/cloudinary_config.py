import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", "dulrsaetkl"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

def upload_image(file):
    """
    Uploads a file to Cloudinary and returns (secure_url, error).
    """
    try:
        upload_result = cloudinary.uploader.upload(file)
        return upload_result.get("secure_url"), None
    except Exception as e:
        error_msg = str(e)
        print(f"Cloudinary upload error: {error_msg}")
        return None, error_msg
