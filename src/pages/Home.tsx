import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { RedirectToSignIn, SignedIn, UserButton } from '@neondatabase/neon-js/auth/react/ui';
import { authClient } from '../lib/auth';
import { Mail, Inbox, Trash2, Send, Shield } from 'lucide-react';

import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

async function apiRequest(endpoint: string, userId: string, options: any = {}) {
    const response = await fetch(`/api${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(userId && { 'x-user-id': userId }),
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

interface Message {
    id: number;
    sender_id: string;
    receiver_id: string;
    sender_email?: string;
    sender_name?: string;
    receiver_email?: string;
    receiver_name?: string;
    subject?: string;
    content: string;
    is_read: boolean;
    sent_at: string;
}

function InboxTab({ userId }: { userId: string }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    const [cimzett, setCimzett] = useState('');
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (userId) {
            loadMessages();
        }
    }, [userId]);

    const loadMessages = async () => {
        try {
            const result = await apiRequest('/messages/inbox', userId);
            setMessages(result.data || []);
        } catch (err: any) {
            alert('Hiba: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!cimzett || !content.trim()) {
            alert('Válassz címzettet és írj üzenetet!');
            return;
        }

        setSending(true);
        try {
            await apiRequest('/messages', userId, {
                method: 'POST',
                body: JSON.stringify({
                    receiver_name: cimzett,
                    subject,
                    content,
                }),
            });
            alert('✅ Üzenet elküldve!');
            setSubject('');
            setContent('');
            setCimzett('');
            await loadMessages();
        } catch (err: any) {
            alert('Hiba: ' + err.message);
        } finally {
            setSending(false);
        }
    };

    const deleteMsg = async (id: number) => {
        if (!confirm('Törlöd?')) return;
        try {
            await apiRequest(`/messages?id=${id}`, userId, { method: 'DELETE' });
            setMessages(messages.filter(m => m.id !== id));
        } catch (err: any) {
            alert('Hiba: ' + err.message);
        }
    };

    if (loading) {
        return <div className="text-center py-12 text-gray-600">Betöltés...</div>;
    }

    return (
        <div>
            <div className="flex justify-between mb-12">
                <h2 className="text-2xl font-bold">Beérkezett üzenetek</h2>

                <Dialog>
                    <DialogTrigger>
                        <Button size={'lg'} className='font-bold'>+ Új üzenet</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Új üzenet</DialogTitle>
                            <DialogDescription>Küldj üzenetet valakinek</DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4">
                            <div className="grid gap-4">
                                <Label htmlFor="cimzett">Címzett neve:</Label>
                                <Input type='text' id="cimzett" name="cimzett" placeholder='Keress valakit...' onChange={(e) => setCimzett(e.target.value)} />
                            </div>
                            <div className="grid gap-4">
                                <Label htmlFor="targy">Tárgy (opcionális)</Label>
                                <Input type="text" id="targy" name="targy" placeholder="Tárgy..." value={subject} onChange={(e) => setSubject(e.target.value)} />
                            </div>
                            <div className="grid gap-4">
                                <Label htmlFor="uzenet">Üzenet</Label>
                                <Textarea id="uzenet" name="uzenet" placeholder="Írj üzenetet..." rows={5} value={content} onChange={(e) => setContent(e.target.value)} />
                            </div>
                        </div>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setCimzett('');
                                        setSubject('');
                                        setContent('');
                                    }}
                                >
                                    Mégsem
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                onClick={sendMessage}
                                disabled={sending || !cimzett || !content.trim()}
                            >
                                Küldés
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Messages */}
            {messages.length === 0 ? (
                <div className='flex flex-col items-center justify-center'>
                    <Inbox size={48} />
                    <p className='font-semibold text-xl'>Nincs üzeneted</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {messages.map((msg) => (
                        <Card key={msg.id}>
                            <CardHeader>
                                <CardTitle>
                                    {msg.sender_name || msg.sender_email}
                                    {!msg.is_read && <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">ÚJ</span>}
                                </CardTitle>
                                <CardDescription>{msg.subject}</CardDescription>
                                <CardAction>
                                    <Button
                                        size='icon'
                                        className='from-destructive via-destructive/60 to-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 bg-transparent bg-gradient-to-r [background-size:200%_auto] text-white hover:bg-transparent hover:bg-[99%_center]'
                                        onClick={() => deleteMsg(msg.id)}
                                    >
                                        <Trash2 />
                                        <span className='sr-only'>Delete</span>
                                    </Button>
                                </CardAction>
                            </CardHeader>
                            <CardContent>
                                <p>{msg.content}</p>
                            </CardContent>
                            <CardFooter>
                                <p className="text-xs text-gray-500">{new Date(msg.sent_at).toLocaleString('hu-HU')}</p>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

function SentTab({ userId }: { userId: string }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            loadMessages();
        }
    }, [userId]);

    const loadMessages = async () => {
        try {
            const result = await apiRequest('/messages/sent', userId);
            setMessages(result.data || []);
        } catch (err: any) {
            alert('Hiba: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const deleteMsg = async (id: number) => {
        if (!confirm('Törlöd?')) return;
        try {
            await apiRequest(`/messages?id=${id}`, userId, { method: 'DELETE' });
            setMessages(messages.filter(m => m.id !== id));
        } catch (err: any) {
            alert('Hiba: ' + err.message);
        }
    };

    if (loading) {
        return <div className="text-center py-12 text-gray-600">Betöltés...</div>;
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6 mt-32">Elküldött üzenetek</h2>
            {messages.length === 0 ? (
                <div className='flex flex-col items-center justify-center'>
                    <Send size={48} />
                    <p className='font-semibold text-xl'>Még nem küldtél üzenetet</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {messages.map((msg) => (
                        <Card key={msg.id}>
                            <CardHeader>
                                <CardTitle>
                                    {msg.receiver_name || msg.receiver_email}
                                    {msg.is_read && <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">ELOLVASVA</span>}
                                </CardTitle>
                                <CardDescription>{msg.subject}</CardDescription>
                                <CardAction>
                                    <Button
                                        size='icon'
                                        className='from-destructive via-destructive/60 to-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 bg-transparent bg-gradient-to-r [background-size:200%_auto] text-white hover:bg-transparent hover:bg-[99%_center]'
                                        onClick={() => deleteMsg(msg.id)}
                                    >
                                        <Trash2 />
                                        <span className='sr-only'>Delete</span>
                                    </Button>
                                </CardAction>
                            </CardHeader>
                            <CardContent>
                                <p>{msg.content}</p>
                            </CardContent>
                            <CardFooter>
                                <p className="text-xs text-gray-500">{new Date(msg.sent_at).toLocaleString('hu-HU')}</p>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

export function Home() {
    const [userId, setUserId] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('user');
    const [synced, setSynced] = useState(false);
    const navigate = useNavigate();

    {/* Load user ID on mount */ }
    useEffect(() => {
        const loadUser = async () => {
            try {
                const session = await authClient.getSession();
                const user = (session?.data as any)?.user;
                if (user?.id) {
                    setUserId(user.id);
                    setFullName(user.user_metadata?.full_name || user.name || '');
                }
            } catch (err) {
                console.error(err);
            }
        };
        loadUser();
    }, []);

    {/* Sync user */ }
    useEffect(() => {
        const syncUser = async () => {
            if (userId && !synced) {
                try {
                    const result = await apiRequest('/users/sync', userId, {
                        method: 'POST',
                        body: JSON.stringify({ userId, email: userId, full_name: fullName }),
                    });
                    setRole(result.data?.[0]?.role || 'user');
                    setSynced(true);
                } catch (err) {
                    console.error(err);
                }
            }
        };
        syncUser();
    }, [userId, synced, fullName]);

    return (
        <>
            <SignedIn>
                <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
                    {/* Navbar */}
                    <nav className='flex justify-between items-center h-32'>
                        <div className='flex items-center gap-2'>
                            <Mail className="text-blue-600" size={28} />
                            <h1 className="text-2xl font-bold">Üzenetküldő</h1>
                        </div>

                        <div className='flex items-center gap-3'>
                            {role === 'admin' && (
                                <Button 
                                    variant="outline" 
                                    onClick={() => navigate('/admin')}
                                    className='flex items-center gap-2'
                                >
                                    <Shield size={18} />
                                    Admin Panel
                                </Button>
                            )}
                            <UserButton />
                        </div>
                    </nav>

                    {/* Tabs */}
                    <Tabs defaultValue="inbox">
                        <TabsList className='w-full h-12'>
                            <TabsTrigger value="inbox">Bejövő üzenetek</TabsTrigger>
                            <TabsTrigger value="sent">Elküldött üzenetek</TabsTrigger>
                        </TabsList>
                        <TabsContent value="inbox"><InboxTab userId={userId} /></TabsContent>
                        <TabsContent value="sent"><SentTab userId={userId} /></TabsContent>
                    </Tabs>
                </div>
            </SignedIn>
            <RedirectToSignIn />
        </>
    );
}