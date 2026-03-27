import psycopg2, os
from dotenv import load_dotenv
load_dotenv()

conn = psycopg2.connect(os.environ['GHOST_CONNECTION_STRING'])
cur = conn.cursor()

# All tables + row counts
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
tables = [r[0] for r in cur.fetchall()]
print("=== Tables ===")
for t in tables:
    cur.execute(f'SELECT COUNT(*) FROM "{t}"')
    print(f"  {t}: {cur.fetchone()[0]} rows")

# Show listings with contact info
print("\n=== Listings ===")
cur.execute("SELECT address, rent, bedrooms, phone, email FROM listings")
rows = cur.fetchall()
if rows:
    print(f"  {'Address':<45} {'Rent':>8} {'Beds':>5} {'Phone':<15} {'Email'}")
    print("  " + "-"*90)
    for address, rent, beds, phone, email in rows:
        print(f"  {str(address):<45} ${str(rent):>7} {str(beds or ''):>5} {str(phone or ''):.<15} {email or ''}")
else:
    print("  No listings found.")

cur.close()
conn.close()
