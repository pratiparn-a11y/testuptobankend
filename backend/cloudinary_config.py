import cloudinary
import cloudinary.uploader
import os
import re
from dotenv import load_dotenv

load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", "dulrsetkl"),
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

def delete_image(url):
    """
    Deletes an image from Cloudinary given its secure_url.
    Returns (success_boolean, error_msg).
    """
    if not url or "cloudinary.com" not in url:
        return False, "Not a valid Cloudinary URL"
        
    try:
        # Extract public_id from URL
        # Format: https://res.cloudinary.com/.../image/upload/v1234.../public_id.ext
        match = re.search(r'/upload/(?:v\d+/)?(.*?)\.[a-zA-Z0-9]+$', url.split('?')[0])
        if match:
            public_id = match.group(1)
            result = cloudinary.uploader.destroy(public_id)
            if result.get("result") in ["ok", "not found"]:
                return True, None
            return False, result.get("result", "Unknown error")
        return False, "Could not extract public ID"
    except Exception as e:
        error_msg = str(e)
        print(f"Cloudinary delete error: {error_msg}")
        return False, error_msg
