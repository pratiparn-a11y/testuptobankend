import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

POSTGRES_URL = os.getenv("DATABASE_URL")

def fix_database():
    print("Connecting to Supabase...")
    conn = psycopg2.connect(POSTGRES_URL)
    cursor = conn.cursor()

    try:
        # 1. Update NULL created_at values
        print("Setting default created_at for existing records...")
        cursor.execute("UPDATE memories SET created_at = NOW() WHERE created_at IS NULL")
        
        # 2. Add SERVER DEFAULT to created_at so future direct inserts work
        print("Adding server-side default to created_at...")
        cursor.execute("ALTER TABLE memories ALTER COLUMN created_at SET DEFAULT NOW()")

        # 3. Reset sequences for all tables
        print("Resetting sequences...")
        tables = ['users', 'memories', 'memory_images']
        for table in tables:
            cursor.execute(f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), COALESCE(MAX(id), 1)) FROM {table}")
        
        conn.commit()
        print("Database fix completed successfully!")

    except Exception as e:
        print(f"Error fixing database: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    fix_database()
