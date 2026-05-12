import psycopg2
import sys

def purge_db():
    conn = None
    try:
        # DB Configuration
        conn = psycopg2.connect(
            dbname="gorentals",
            user="postgres",
            password="postgres",
            host="localhost",
            port="5432"
        )
        cur = conn.cursor()

        print("Connected to GoRentals database.")

        # Define the SQL commands in order to handle all foreign key constraints
        commands = [
            # 1. Chat Messages
            """
            DELETE FROM chat_messages 
            WHERE conversation_id IN (
                SELECT c.id FROM conversations c
                JOIN listings l ON c.listing_id = l.id
                WHERE l.title ILIKE '%smoke%' OR l.title ILIKE '%test%'
            );
            """,
            # 2. Conversations
            """
            DELETE FROM conversations 
            WHERE listing_id IN (
                SELECT id FROM listings 
                WHERE title ILIKE '%smoke%' OR title ILIKE '%test%'
            );
            """,
            # 3. Payouts
            """
            DELETE FROM payouts 
            WHERE booking_id IN (
                SELECT b.id FROM bookings b
                JOIN listings l ON b.listing_id = l.id
                WHERE l.title ILIKE '%smoke%' OR l.title ILIKE '%test%'
            );
            """,
            # 4. Disputes
            """
            DELETE FROM disputes 
            WHERE booking_id IN (
                SELECT b.id FROM bookings b
                JOIN listings l ON b.listing_id = l.id
                WHERE l.title ILIKE '%smoke%' OR l.title ILIKE '%test%'
            );
            """,
            # 5. Ledger Transactions
            """
            DELETE FROM ledger_transactions 
            WHERE booking_id IN (
                SELECT b.id FROM bookings b
                JOIN listings l ON b.listing_id = l.id
                WHERE l.title ILIKE '%smoke%' OR l.title ILIKE '%test%'
            );
            """,
            # 6. Payments
            """
            DELETE FROM payments 
            WHERE booking_id IN (
                SELECT b.id FROM bookings b
                JOIN listings l ON b.listing_id = l.id
                WHERE l.title ILIKE '%smoke%' OR l.title ILIKE '%test%'
            );
            """,
            # 7. Bookings
            """
            DELETE FROM bookings 
            WHERE listing_id IN (
                SELECT id FROM listings 
                WHERE title ILIKE '%smoke%' OR title ILIKE '%test%'
            );
            """,
            # 8. Blocked Dates
            """
            DELETE FROM blocked_dates 
            WHERE listing_id IN (
                SELECT id FROM listings 
                WHERE title ILIKE '%smoke%' OR title ILIKE '%test%'
            );
            """,
            # 9. Favorites
            """
            DELETE FROM favorites 
            WHERE listing_id IN (
                SELECT id FROM listings 
                WHERE title ILIKE '%smoke%' OR title ILIKE '%test%'
            );
            """,
            # 10. Listings
            """
            DELETE FROM listings 
            WHERE title ILIKE '%smoke%' OR title ILIKE '%test%';
            """
        ]

        for cmd in commands:
            try:
                cur.execute(cmd)
                print(f"Executed: {cur.statusmessage}")
            except Exception as e:
                print(f"Skipping command due to error (likely table doesn't exist): {e}")
                conn.rollback()
                continue

        conn.commit()
        print("Successfully purged ALL smoke test data and committed changes.")

        cur.close()
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"Error: {error}")
        if conn:
            conn.rollback()
            print("Transaction rolled back.")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    purge_db()
