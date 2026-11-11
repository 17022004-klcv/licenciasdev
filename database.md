Database Documentation
1. Overview
   Project: Digital License Management
   Database engine: PostgreSQL

The digital_license_management database supports a small application for managing employee accounts and digital software licenses. It stores employee identity and authentication data, along with license details such as provider, license type, purchase price, image reference, expiration date, and status.

The initial schema contains two tables:
- employees: stores employee accounts and login-related information.
- digital_licenses: stores the digital licenses managed by the system.
2. Entity Relationship Overview
   Currently, the two tables are independent. No relationship has been defined between an employee and a digital license.

If the application later needs to track who registered, owns, or is assigned a license, that relationship should be defined explicitly. For example, a created_by foreign key could record who created a license record, while a separate junction table would be appropriate if licenses can be assigned to multiple employees.
3. Table: employees
   Stores employee accounts and the information required to authenticate them.
   Column	Data type	Constraints	Description
   id	BIGINT	Primary key, auto-generated	Unique employee identifier.
   first_name	VARCHAR(100)	Not null	Employee's first name.
   last_name	VARCHAR(100)	Not null	Employee's last name.
   email	VARCHAR(255)	Not null, unique	Email address used to identify the account and log in.
   password_hash	VARCHAR(255)	Not null	Secure password hash. Never store the original password.
   role	VARCHAR(30)	Not null, default: employee	Defines the employee's application role.
   is_active	BOOLEAN	Not null, default: TRUE	Indicates whether the account is enabled.
   created_at	TIMESTAMPTZ	Not null, default: NOW()	Date and time when the record was created.
   updated_at	TIMESTAMPTZ	Not null, default: NOW()	Date and time when the record was last updated.


Indexes and rules
- id is the primary key.
- email must be unique.
- Consider enforcing case-insensitive email uniqueness with a unique index on LOWER(email) in PostgreSQL.
- role should be restricted to supported values, such as administrator and employee, using a CHECK constraint or a PostgreSQL enum.
- updated_at does not update automatically merely because it has a default value. Update it in application logic or with a database trigger.
  Security considerations
- Store passwords using a password-hashing algorithm such as Argon2id or bcrypt.
- Never store plain-text passwords.
- Check is_active during authentication so disabled accounts cannot sign in.
4. Table: digital_licenses
   Stores information about digital software licenses managed by the application.
   Column	Data type	Constraints	Description
   id	BIGINT	Primary key, auto-generated	Unique license record identifier.
   name	VARCHAR(150)	Not null	Product or license name.
   provider	VARCHAR(150)	Not null	Company or provider that supplies the license.
   license_type	VARCHAR(30)	Not null	Duration of the license: 6_months, 1_year, or indefinite.
   image	TEXT	Nullable	URL or storage path for the product image.
   price	NUMERIC(8,2)	Not null	Purchase price or recorded license cost.
   status	VARCHAR(20)	Not null, default: active	Current license status.
   notes	TEXT	Nullable	Additional information about the license.
   created_at	TIMESTAMPTZ	Not null, default: NOW()	Date and time when the record was created.
   updated_at	TIMESTAMPTZ	Not null, default: NOW()	Date and time when the record was last updated.


Suggested values
license_type (duration; the expiration date is calculated per key when it is sold)
- 6_months
- 1_year
- indefinite
  status
- active
- expired
- suspended
- revoked
  The application or database should validate these values so inconsistent spellings and unsupported statuses are not stored.
  Business rules
- name, provider, license_type, and price are required.
- A license is a catalog product. Its units are the rows in license_keys, and its stock is the number of available keys (it is calculated, not stored).
- Define the currency used for price in the application requirements. The current schema does not store a currency code.
- Clarify whether price represents the original purchase price, the current subscription cost, or another amount.
5. Data Types and Design Decisions
   Primary keys
   Both tables use BIGINT identity columns as primary keys. This provides numeric identifiers with substantial room for growth.
   Monetary values
   Use NUMERIC(8,2) rather than DOUBLE(8,2) for price. PostgreSQL supports NUMERIC for exact decimal values, making it more appropriate for monetary amounts.
   Images
   The image field should normally store a URL or file path, not the image's binary contents. Store image files in a file system or object-storage service and keep their references in the database.
   Timestamps
   TIMESTAMPTZ stores timestamps with time-zone-aware semantics. The created_at and updated_at defaults initialize the values, but updating updated_at requires application logic or a database trigger.
   License keys
   License keys can be commercially sensitive. Restrict database access and consider encrypting the key in the application, with encryption keys stored outside the database. Avoid exposing license keys in logs or API responses unless necessary.
6. Normalization and Scalability
   The current schema separates employee account data from license data. This avoids mixing authentication fields with license-specific information.

For the current small application, keeping provider, license_type, and status as columns is reasonable. If providers require their own details, or license types and statuses need richer metadata, they can later be moved into reference tables.

Potential future additions include:
- A license_assignments table if licenses can be assigned to employees.
- A created_by foreign key on digital_licenses to record which employee created a license record.
- A session table if the application needs database-backed session management and revocation.
- A separate provider table if provider details must be reused and maintained centrally.
- An audit log if changes to license keys, prices, or statuses need to be tracked.
  These additions are not required until the application has a concrete need for them.
7. Recommended Database Constraints
   Before deploying the schema, consider adding:
- A check constraint for valid role values in employees.
- Check constraints for valid license_type and status values in digital_licenses.
- A check constraint requiring price >= 0, if negative prices are not meaningful for the application.
- A case-insensitive unique index for employee email addresses, if emails should be unique regardless of letter case.
8. Summary
   The database begins with two focused tables: employees for application accounts and digital_licenses for license records. This design is intentionally small while leaving room for future relationships, session management, and auditability as requirements grow.
9. Table: sales
   Stores each sale registered from the point of sale (POS) view.
   Column	Data type	Constraints	Description
   id	INTEGER	Primary key, auto-generated	Unique sale identifier.
   channel	TEXT	Not null, default: pos, CHECK IN (pos, web)	pos = sold by an employee in the POS; web = bought by a customer on the landing page.
   employee_id	INTEGER	Nullable, FK employees(id) ON DELETE SET NULL	Employee who registered the sale (NULL for web sales).
   customer_name	TEXT	Nullable	Buyer's username (web sales only).
   customer_email	TEXT	Nullable	Buyer's email, stored in lowercase (web sales only).
   total	REAL	Not null, CHECK total >= 0	Sale total, calculated on the server from the license prices.
   created_at	DATETIME	Not null, default: CURRENT_TIMESTAMP	Date and time of the sale.

10. Table: sale_items
   Stores the lines of each sale.
   Column	Data type	Constraints	Description
   id	INTEGER	Primary key, auto-generated	Unique line identifier.
   sale_id	INTEGER	Not null, FK sales(id) ON DELETE CASCADE	Sale the line belongs to.
   license_id	INTEGER	Nullable, FK digital_licenses(id) ON DELETE SET NULL	License sold.
   license_name	TEXT	Not null	Snapshot of the license name at the time of sale.
   unit_price	REAL	Not null, CHECK unit_price >= 0	Snapshot of the license price at the time of sale.
   quantity	INTEGER	Not null, CHECK quantity > 0	Units sold.
   subtotal	REAL	Not null, CHECK subtotal >= 0	unit_price × quantity.

Business rules
- Prices are never taken from the client: the API reads them from digital_licenses when the sale is registered.
- Only licenses with status = active can be sold.
- license_name and unit_price are copied so the sales history does not change if a license is edited or deleted.
- A sale and its lines are inserted in a single transaction.
- Sales are immutable: there is no endpoint to edit or delete them.
- Each unit sold takes one available key from license_keys inside the same transaction (BEGIN IMMEDIATE), so two sales can never receive the same key. A sale fails if there is not enough stock.
- Web purchases (POST /api/public/purchase) buy one unit, require a username and email, and are rate limited per IP.

11. Table: license_keys
   Inventory of a license: one row per unit.
   Column	Data type	Constraints	Description
   id	INTEGER	Primary key, auto-generated	Unique key identifier.
   license_id	INTEGER	Nullable, FK digital_licenses(id) ON DELETE SET NULL	Product the key belongs to.
   license_key	TEXT	Not null, unique	Activation key, format XXXXX-XXXXX-XXXXX-XXXXX without ambiguous characters (0/O, 1/I/L).
   status	TEXT	Not null, default: available, CHECK IN (available, sold)	Whether the unit can still be sold.
   sale_item_id	INTEGER	Nullable, FK sale_items(id) ON DELETE SET NULL	Sale line the key was sold in.
   sold_at	DATETIME	Nullable	When the key was sold.
   expires_at	DATE	Nullable	sold date + duration of the license; NULL for indefinite licenses.
   created_at	DATETIME	Not null, default: CURRENT_TIMESTAMP	When the key was generated.

Business rules
- Keys are generated by the application when a license is created (initial units) or when an administrator adds units.
- Deleting a license deletes its available keys; sold keys are kept (license_id becomes NULL) because they belong to the sales history.
- Keys are never exposed by the public API.

12. Migrations
   lib/migrations.ts upgrades any database (new or existing) on server start, using PRAGMA user_version:
- v1: license types become durations and purchase_date/expiration_date are removed. The new type is derived from the old dates (no expiration → indefinite, up to ~6 months → 6_months, longer → 1_year).
- v2: license_keys is created; each license's old license_key becomes its first available unit, and digital_licenses.license_key is dropped.
- v3: sales gets channel, customer_name, and customer_email.
   Published migrations are never edited; schema changes go in a new migration.
