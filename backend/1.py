import os
from dotenv import load_dotenv
import requests

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")  # Get from dashboard

# Login as user
url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Content-Type": "application/json"
}
data = {
    "email": "doc@jayant.com",
    "password": "qwertyuiop"
}

response = requests.post(url, json=data, headers=headers)
result = response.json()

if "access_token" in result:
    print("\n✅ JWT Token Generated Successfully!\n")
    print("Access Token:")
    print(result["access_token"])
    print("\n\nCopy this token and use it in Swagger UI!")
else:
    print("❌ Error:", result)
