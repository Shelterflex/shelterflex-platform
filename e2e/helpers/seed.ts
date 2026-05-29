import { Pool } from "pg";
import crypto from "crypto";

export interface TestUsers {
  tenant: { email: string; password: string; id?: string };
  landlord: { email: string; password: string; id?: string };
  admin: { email: string; password: string; id?: string };
  whistleblower: { email: string; password: string; id?: string };
}

export interface SeedResult {
  users: TestUsers;
  listingId: string;
  runId: string;
}

const DB_URL = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL!;

export async function seedTestData(): Promise<SeedResult> {
  const pool = new Pool({ connectionString: DB_URL });
  const runId = `e2e_${crypto.randomBytes(6).toString("hex")}`;

  const users: TestUsers = {
    tenant: { email: `tenant_${runId}@shelterflex.test`, password: "Test1234!" },
    landlord: { email: `landlord_${runId}@shelterflex.test`, password: "Test1234!" },
    admin: { email: `admin_${runId}@shelterflex.test`, password: "Test1234!" },
    whistleblower: { email: `wb_${runId}@shelterflex.test`, password: "Test1234!" },
  };

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const [role, u] of Object.entries(users)) {
      const { rows } = await client.query(
        `INSERT INTO users (email, role, created_at)
         VALUES ($1, $2, NOW())
         RETURNING id`,
        [u.email, role],
      );
      (users as any)[role].id = rows[0].id;
    }

    const { rows: listing } = await client.query(
      `INSERT INTO properties (title, address, monthly_rent_ngn, status, landlord_id, created_at)
       VALUES ($1, $2, $3, 'active', $4, NOW())
       RETURNING id`,
      [
        `Test Property ${runId}`,
        "123 Test Street, Lagos, NG",
        500_000,
        (users.landlord as any).id,
      ],
    );

    await client.query("COMMIT");
    await client.release();
    await pool.end();

    return { users, listingId: listing[0].id, runId };
  } catch (err) {
    await client.query("ROLLBACK");
    client.release();
    await pool.end();
    throw err;
  }
}

export async function cleanupTestData(runId: string): Promise<void> {
  const pool = new Pool({ connectionString: DB_URL });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `DELETE FROM properties WHERE title LIKE $1`,
      [`%${runId}%`],
    );
    await client.query(
      `DELETE FROM users WHERE email LIKE $1`,
      [`%${runId}%`],
    );
    await client.query("COMMIT");
  } catch {
    await client.query("ROLLBACK");
  } finally {
    client.release();
    await pool.end();
  }
}
