import uuid
from supabase import create_client, Client
from app.core import config

supabase: Client = create_client(config.SUPABASE_URL, config.SUPABASE_KEY) if config.SUPABASE_URL and config.SUPABASE_KEY else None

def upload_file_to_supabase(file_content, filename: str, content_type: str) -> str:
    """
    Uploads a file to Supabase Storage and returns the public URL.
    """
    if not supabase:
        raise Exception("Supabase client not configured")

    # Generate a unique path/filename
    file_ext = filename.split(".")[-1] if "." in filename else ""
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    
    # Upload to bucket
    # Note: .upload() expects bytes or a file-like object
    res = supabase.storage.from_(config.SUPABASE_BUCKET).upload(
        path=unique_filename,
        file=file_content,
        file_options={"content-type": content_type}
    )
    
    # Get public URL
    public_url = supabase.storage.from_(config.SUPABASE_BUCKET).get_public_url(unique_filename)
    return public_url

def delete_file_from_supabase(file_url: str):
    """
    Deletes a file from Supabase Storage given its public URL.
    """
    if not supabase or not file_url:
        return

    # Extract the filename from the public URL
    # URL format is usually: https://.../storage/v1/object/public/bucket/filename
    if config.SUPABASE_BUCKET in file_url:
        filename = file_url.split("/")[-1]
        try:
            supabase.storage.from_(config.SUPABASE_BUCKET).remove([filename])
        except Exception as e:
            print(f"Error deleting file from Supabase: {e}")
