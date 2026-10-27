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
   license_key	TEXT	Nullable	License key or activation code, if applicable.
   license_type	VARCHAR(30)	Not null	Type of license, such as perpetual, subscription, or temporary.
   purchase_date	DATE	Nullable	Date the license was purchased or acquired.
   image	TEXT	Nullable	URL or storage path for the product image.
   price	NUMERIC(8,2)	Not null	Purchase price or recorded license cost.
   expiration_date	DATE	Nullable	Date the license expires, if applicable.
   status	VARCHAR(20)	Not null, default: active	Current license status.
   notes	TEXT	Nullable	Additional information about the license.
   created_at	TIMESTAMPTZ	Not null, default: NOW()	Date and time when the record was created.
   updated_at	TIMESTAMPTZ	Not null, default: NOW()	Date and time when the record was last updated.


Suggested values
license_type
- perpetual
- subscription
- temporary
  status
- active
- expired
- suspended
- revoked
  The application or database should validate these values so inconsistent spellings and unsupported statuses are not stored.
  Business rules
- name, provider, license_type, and price are required.
- expiration_date may be null for licenses that do not expire or whose expiration date is unknown.
- If both purchase_date and expiration_date are present, the expiration date should not precede the purchase date.
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
- A check constraint ensuring expiration_date >= purchase_date whenever both dates are present.
- A case-insensitive unique index for employee email addresses, if emails should be unique regardless of letter case.
8. Summary
   The database begins with two focused tables: employees for application accounts and digital_licenses for license records. This design is intentionally small while leaving room for future relationships, session management, and auditability as requirements grow.