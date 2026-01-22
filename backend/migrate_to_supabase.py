import sqlite3
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

SQLITE_DB = 'test.db'
POSTGRES_URL = os.getenv("DATABASE_URL")

def migrate():
    # Connect to SQLite
    print("Connecting to SQLite...")
    sl_conn = sqlite3.connect(SQLITE_DB)
    sl_cursor = sl_conn.cursor()

    # Connect to Postgres
    print("Connecting to Supabase (Postgres)...")
    pg_conn = psycopg2.connect(POSTGRES_URL)
    pg_cursor = pg_conn.cursor()

    try:
        # 1. Migrate Users
        print("Migrating users...")
        sl_cursor.execute("SELECT id, username, hashed_password FROM users")
        users = sl_cursor.fetchall()
        for user in users:
            pg_cursor.execute(
                "INSERT INTO users (id, username, hashed_password) VALUES (%s, %s, %s) ON CONFLICT (id) DO NOTHING",
                user
            )

        # 2. Migrate Memories
        print("Migrating memories...")
        sl_cursor.execute("SELECT id, title, note, owner_id FROM memories")
        memories = sl_cursor.fetchall()
        for mem in memories:
            pg_cursor.execute(
                "INSERT INTO memories (id, title, note, owner_id) VALUES (%s, %s, %s, %s) ON CONFLICT (id) DO NOTHING",
                mem
            )

        # 3. Migrate MemoryImages
        print("Migrating memory images...")
        sl_cursor.execute("SELECT id, url, memory_id FROM memory_images")
        images = sl_cursor.fetchall()
        for img in images:
            pg_cursor.execute(
                "INSERT INTO memory_images (id, url, memory_id) VALUES (%s, %s, %s) ON CONFLICT (id) DO NOTHING",
                img
            )

        pg_conn.commit()
        print("Migration completed successfully!")

    except Exception as e:
        print(f"Error during migration: {e}")
        pg_conn.rollback()
    finally:
        sl_conn.close()
        pg_conn.close()

if __name__ == "__main__":
    migrate()
