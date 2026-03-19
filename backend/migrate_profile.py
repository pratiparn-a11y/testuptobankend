import psycopg2
import os
from dotenv import load_dotenv

# Use .env or .env.local if present
if os.path.exists(".env.local"):
    load_dotenv(".env.local")
else:
    load_dotenv()

POSTGRES_URL = os.getenv("DATABASE_URL")

def migrate_database():
    # 1. Try PostgreSQL (Supabase/Production)
    if POSTGRES_URL:
        print(f"Connecting to PostgreSQL for migration...")
        try:
            conn = psycopg2.connect(POSTGRES_URL)
            cursor = conn.cursor()
            print("Adding columns to users table in PostgreSQL...")
            cursor.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT")
            cursor.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS partner_name TEXT")
            cursor.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS anniversary TEXT")
            conn.commit()
            print("✅ PostgreSQL Migration completed!")
            conn.close()
        except Exception as e:
            print(f"❌ PostgreSQL Migration Error: {e}")

    # 2. Try SQLite (Local Development)
    db_path = "test.db"
    if os.path.exists(db_path):
        print(f"Connecting to SQLite ({db_path}) for migration...")
        try:
            import sqlite3
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Check existing columns
            cursor.execute("PRAGMA table_info(users)")
            columns = [col[1] for col in cursor.fetchall()]
            
            new_cols = [
                ("avatar_url", "TEXT"),
                ("partner_name", "TEXT"),
                ("anniversary", "TEXT")
            ]
            
            for col_name, col_type in new_cols:
                if col_name not in columns:
                    print(f"Adding column {col_name} to SQLite...")
                    cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
            
            conn.commit()
            print("✅ SQLite Migration completed!")
            conn.close()
        except Exception as e:
            print(f"❌ SQLite Migration Error: {e}")
    else:
        if not POSTGRES_URL:
            print("Neither DATABASE_URL nor test.db found. Nothing to migrate.")

if __name__ == "__main__":
    migrate_database()
