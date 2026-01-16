import { useEffect, useState } from 'react';
import { authClient } from '../lib/auth';
import { Trash2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface User {
    id: string;
    email: string;
    full_name: string;
    role: string;
    created_at: string;
    last_active: string;
}

async function apiRequest(endpoint: string, userId: string, options: any = {}) {
    const response = await fetch(`/api${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
            ...options.headers,
        },
    });

    const text = await response.text();

    let result;
    try {
        result = text ? JSON.parse(text) : {};
    } catch (e) {
        throw new Error(`API hiba: ${response.status} - ${text || 'Üres válasz'}`);
    }

    if (!response.ok) {
        throw new Error(result.error || result.message || `Hiba: ${response.status}`);
    }
    return result;
}

export function Admin() {
    const [userId, setUserId] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const session = await authClient.getSession();
                const user = (session?.data as any)?.user;
                if (user?.id) {
                    setUserId(user.id);
                }
            } catch (err) {
                console.error(err);
            }
        };
        loadUser();
    }, []);

    useEffect(() => {
        if (userId) {
            loadUsers();
        }
    }, [userId]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const result = await apiRequest('/admin/users', userId);
            setUsers(result.data || []);
        } catch (err: any) {
            alert('Hiba: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const deleteUser = async (deleteUserId: string, email: string) => {
        if (!confirm(`Biztosan törlöd a ${email} felhasználót? Ez nem vonható vissza!`)) {
            return;
        }

        setDeleting(deleteUserId);
        try {
            await apiRequest('/admin/users', userId, {
                method: 'DELETE',
                body: JSON.stringify({ deleteUserId }),
            });
            alert('✅ Felhasználó törölve!');
            await loadUsers();
        } catch (err: any) {
            alert('Hiba: ' + err.message);
        } finally {
            setDeleting(null);
        }
    };

    if (loading) {
        return (
            <div className='flex justify-center items-center min-h-screen'>
                <p className='text-gray-600'>Betöltés...</p>
            </div>
        );
    }

    return (
        <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8'>
            {/* Header */}
            <div className='mb-8'>
                <div className='flex items-center gap-2 mb-2'>
                    <Shield className="text-red-600" size={28} />
                    <h1 className="text-3xl font-bold">Admin Panel</h1>
                </div>
                <p className='text-gray-600'>Felhasználók kezelése</p>
            </div>

            {/* Statisztika */}
            <Card className='mb-8'>
                <CardHeader>
                    <CardTitle>Statisztika</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className='text-lg'>
                        Összes felhasználó: <span className='font-bold'>{users.length}</span>
                    </p>
                </CardContent>
            </Card>

            {/* Felhasználók táblázata */}
            <Card>
                <CardHeader>
                    <CardTitle>Felhasználók listája</CardTitle>
                    <CardDescription>Kattints a törlés gombra egy felhasználó eltávolításához</CardDescription>
                </CardHeader>
                <CardContent>
                    {users.length === 0 ? (
                        <p className='text-gray-500 text-center py-8'>Nincs felhasználó</p>
                    ) : (
                        <div className='overflow-x-auto'>
                            <table className='w-full text-sm'>
                                <thead>
                                    <tr className='border-b'>
                                        <th className='text-left py-3 px-4'>Email</th>
                                        <th className='text-left py-3 px-4'>Teljes név</th>
                                        <th className='text-left py-3 px-4'>Szerepkör</th>
                                        <th className='text-left py-3 px-4'>Regisztrálva</th>
                                        <th className='text-left py-3 px-4'>Utolsó aktivitás</th>
                                        <th className='text-left py-3 px-4'>Műveletek</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id} className='border-b hover:bg-gray-50'>
                                            <td className='py-3 px-4'>{user.email}</td>
                                            <td className='py-3 px-4'>{user.full_name || '-'}</td>
                                            <td className='py-3 px-4'>
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                    user.role === 'admin' 
                                                        ? 'bg-red-100 text-red-700' 
                                                        : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {user.role === 'admin' ? 'Admin' : 'Felhasználó'}
                                                </span>
                                            </td>
                                            <td className='py-3 px-4 text-xs'>
                                                {new Date(user.created_at).toLocaleString('hu-HU')}
                                            </td>
                                            <td className='py-3 px-4 text-xs'>
                                                {user.last_active 
                                                    ? new Date(user.last_active).toLocaleString('hu-HU') 
                                                    : '-'
                                                }
                                            </td>
                                            <td className='py-3 px-4'>
                                                {user.role !== 'admin' && (
                                                    <Button
                                                        size='sm'
                                                        variant='destructive'
                                                        onClick={() => deleteUser(user.id, user.email)}
                                                        disabled={deleting === user.id}
                                                    >
                                                        {deleting === user.id ? 'Törlés...' : <Trash2 size={16} />}
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
