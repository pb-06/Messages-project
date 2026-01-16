/**
 * endpoint: /api/admin/users
 * GET - Összes felhasználó listázása (admin csak)
 * DELETE - Felhasználó törlése (admin csak)
 */
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
    let sql = '';
    let data = [];
    let error = null;

    try {
        const userId = req.headers['x-user-id'] || req.body?.userId || req.query?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'User ID hiányzik' });
        }

        // Ellenőrizni, hogy az aktuális user admin-e
        const adminCheck = await pool.query(
            'SELECT role FROM users WHERE id = $1',
            [userId]
        );

        if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
            return res.status(403).json({ error: 'Nincs jogosultság' });
        }

        if (req.method === 'GET') {
            // Összes felhasználó listázása
            sql = `
                SELECT id, email, full_name, role, created_at, last_active
                FROM users
                ORDER BY created_at DESC
            `;

            const result = await pool.query(sql);
            data = result.rows;

            return res.status(200).json({ data, error });
        } else if (req.method === 'DELETE') {
            // Felhasználó törlése
            const { deleteUserId } = req.body;

            if (!deleteUserId) {
                return res.status(400).json({ error: 'Törlendő user ID kötelező' });
            }

            if (deleteUserId === userId) {
                return res.status(400).json({ error: 'Nem törölheted a saját accountodat' });
            }

            // Felhasználó üzenetei törlése
            await pool.query('DELETE FROM messages WHERE sender_id = $1 OR receiver_id = $1', [deleteUserId]);

            // Felhasználó törlése
            sql = 'DELETE FROM users WHERE id = $1 RETURNING id';
            const result = await pool.query(sql, [deleteUserId]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Felhasználó nem található' });
            }

            data = { deleted: deleteUserId };
            return res.status(200).json({ data, error });
        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (err) {
        console.error('Admin users error:', err);
        error = err.message;
        return res.status(500).json({ data, error });
    }
}
