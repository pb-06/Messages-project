import { RedirectToSignIn, SignedIn, UserButton } from '@neondatabase/neon-js/auth/react/ui';
import { Mail } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function Home() {
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

                        <UserButton />
                    </nav>

                    {/* Tabs */}
                    <Tabs defaultValue="inbox">
                        <TabsList className='w-full h-12'>
                            <TabsTrigger value="inbox">Bejövő üzenetek</TabsTrigger>
                            <TabsTrigger value="sent">Elküldött üzenetek</TabsTrigger>
                        </TabsList>
                        <TabsContent value="inbox">Ide jönnek a bejövő üzenetek</TabsContent>
                        <TabsContent value="sent">Ide jönnek az elküldött üzenetek</TabsContent>
                    </Tabs>
                </div>
            </SignedIn>
            <RedirectToSignIn />
        </>
    );
}